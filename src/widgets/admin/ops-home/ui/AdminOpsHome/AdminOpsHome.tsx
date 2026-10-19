import { useState } from 'react'

import { CircleCheck, Info, TriangleAlert } from 'lucide-react'

import { DRAW_STUCK_AFTER_MS, useAdminDraws } from '@entities/admin-draw'
import { useAdminOrders } from '@entities/admin-order'
import {
  useReservationStats,
  useReservationStatsHistory,
} from '@entities/admin-reservation'
import { isBraking, waitEstimate } from '@entities/admin-waitingroom'
import {
  OpenPreorderStrip,
  SLOW_AFTER_MS,
  useOpenPreorders,
} from '@features/open-preorder-picker'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import {
  ADMIN_ORDERS_PATH,
  ADMIN_RESERVATIONS_PATH,
  ADMIN_WAITINGROOM_PATH,
  adminReservationsPath,
} from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { ratePerSecond, slopePerSecond } from '@shared/lib/samples'
import {
  InlineAlert,
  RefreshStatus,
  Skeleton,
  SkeletonGroup,
  ThroughputChart,
} from '@shared/ui'

import { flowVerdict, type FlowVerdict } from '../../lib/flowVerdict'
import { OpsTaskCard, type OpsTaskCardProps } from '../OpsTaskCard'
import { StuckDrawTask } from '../StuckDrawTask'

import * as styles from './AdminOpsHome.css'

// 집계는 서버가 5초까지 캐시해(명세: "5초 이상이면 충분") 그보다 자주 받아도 같은 값이다.
// 문제를 처음 알아채는 화면이라 그 하한에 맞춘다.
const POLL_INTERVAL_MS = 5_000
/** 실패 카드에 나눠 적을 사전예약 수 — 넘으면 '외 N곳'으로 줄인다 */
const BREAKDOWN_MAX = 3
// shortcut: 마감 뒤 하루 안의 회차만 멈췄는지 본다(회차마다 진행을 따로 받아서). 회차가 많아지면 서버 집계로 바꾼다.
const STUCK_LOOKBACK_MS = 24 * 60 * 60 * 1000
// 맨 뒤 예상 대기가 이만큼 길어지면 할 일로 띄운다 — 서버에 기준이 없어 화면에서 정한 값이다.
const LONG_WAIT_SECONDS = 10 * 60

// 성공에 경고 삼각형이 붙으면 문구와 반대로 읽힌다.
const verdictIcon: Record<FlowVerdict['status'], typeof Info> = {
  success: CircleCheck,
  info: Info,
  warning: TriangleAlert,
}

type Task = OpsTaskCardProps & { key: string }

const sum = (values: Record<string, number>) =>
  Object.values(values).reduce((total, value) => total + value, 0)

/** 가장 오래 기다린 것이 몇 분째인지 */
const ageOf = (iso: string | null, now: number) => {
  if (!iso) return null
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000))
  return minutes < 60 ? `${minutes}분째` : `${Math.floor(minutes / 60)}시간째`
}

export type AdminOpsHomeProps = {
  /** 상품 id → 이름. 대기열 응답엔 id만 있다 */
  productNames: ReadonlyMap<string, string>
}

/**
 * 운영 대시보드 — 오픈 중 운영자가 가장 먼저 보는 화면. 급한 일부터 위에 올리고(실패 → 멈춤 →
 * 기한·일상), 아래에 접수·처리 속도를 둔다. 숫자마다 처리할 화면으로 가는 링크를 붙인다 —
 * 외부 등록 실패는 예약 현황의 실패 탭에서 골라 재처리한다.
 */
export function AdminOpsHome({ productNames }: AdminOpsHomeProps) {
  const stats = useReservationStats(undefined, POLL_INTERVAL_MS)
  const draws = useAdminDraws()
  // 건수만 필요해 한 건씩 받고 total을 쓴다.
  const preparing = useAdminOrders({ status: 'PREPARING_ITEMS', size: 1 })
  const readyToShip = useAdminOrders({ status: 'READY_TO_SHIP', size: 1 })

  // 진행 중인 사전예약 — 동시에 여럿 열릴 수 있어 각각의 집계를 따로 받는다.
  const {
    queue,
    openProducts,
    items: strip,
    nameOf,
    statsOf,
  } = useOpenPreorders(productNames, POLL_INTERVAL_MS)
  const q = queue.data
  // 대시보드가 보는 범위 — 처음엔 전체(null). 고른 사전예약이 마감돼 띠에서 빠지면 전체로
  // 돌아간다.
  const [picked, setPicked] = useState<string | null>(null)
  const selected = openProducts.some((product) => product.productId === picked)
    ? picked
    : null

  // 처리 흐름은 관리자 화면을 연 뒤 받은 집계로 그린다 — 다른 화면에 다녀와도 이어진다
  // (새로 고치면 처음부터). 접수는 모든 상태의 합, 처리는 외부 등록을 기다리지 않는 것 —
  // 둘의 차이가 적체다. 맨 위 판정은 언제나 전체로, 그래프만 고른 사전예약을 따른다.
  const selectedHistory = useReservationStatsHistory(selected ?? undefined)
  const series = (
    history: typeof selectedHistory,
    key: 'received' | 'processed' | 'backlog',
  ) =>
    history.map(({ at, value: { preorders } }) => {
      const received = sum(preorders)
      const value = {
        received,
        processed: received - preorders.PENDING_SYNC,
        backlog: preorders.PENDING_SYNC,
      }
      return { at, value: value[key] }
    })
  const receivedRates = ratePerSecond(series(selectedHistory, 'received'))
  const processedRates = ratePerSecond(series(selectedHistory, 'processed'))
  const backlogSlope = slopePerSecond(series(selectedHistory, 'backlog')).at(
    -1,
  )?.value

  const s = stats.data
  const braking = isBraking(q?.brakeFactor ?? null)
  // 브레이크는 대기열 전체에 하나라 언제나 전체, 처리 흐름은 고른 사전예약 기준이다.
  const verdict = flowVerdict({
    braking,
    backlogPerMinute: backlogSlope === undefined ? null : backlogSlope * 60,
    scope: selected ? nameOf(selected) : undefined,
  })
  // 판정 기준 시각 — 받은 집계의 시각을 써서 렌더마다 흔들리지 않게 한다. 아직 못 받았으면
  // 0이라 멈춘 추첨·경과 시간을 판정하지 않는다.
  const now = stats.dataUpdatedAt

  // 둘 이상 열려 있으면 실패가 어느 사전예약에서 났는지 나눠 적는다(많은 순).
  const failedPreorders = strip
    .filter((item) => item.failures)
    // 많은 곳부터 — 어디부터 볼지 바로 보이게.
    .toSorted((a, b) => (b.failures ?? 0) - (a.failures ?? 0))
  const failuresByPreorder =
    strip.length > 1
      ? [
          ...failedPreorders
            .slice(0, BREAKDOWN_MAX)
            .map(
              (item) => `${item.name} ${formatNumber(item.failures ?? 0)}건`,
            ),
          failedPreorders.length > BREAKDOWN_MAX &&
            `외 ${failedPreorders.length - BREAKDOWN_MAX}곳`,
        ]
          .filter(Boolean)
          .join(' · ')
      : ''

  const shipping =
    preparing.data && readyToShip.data
      ? { preparing: preparing.data.total, ready: readyToShip.data.total }
      : null

  // 급한 순서대로 쌓는다. 0건인 일은 빼서 이상이 없으면 목록이 비게 한다.
  // 사전예약을 골랐으면 할 일도 그 사전예약 집계로 센다. 상품으로 거를 수 없는 것(배송 대기)은
  // '전체 기준'이라고 밝힌다 — 백엔드에 상품 조건을 요청해 뒀다.
  const scoped = selected !== null
  const t = scoped && selected ? statsOf(selected) : s
  // 외부 등록을 기다리는 작업(재처리 필요는 빼고) — 0이면 오래 기다리는 접수 시각이
  // 재처리 필요 건을 가리킬 수 있어 밀림으로 보지 않는다.
  const waitingRegister = t
    ? t.syncJobs.REGISTER.PENDING +
      t.syncJobs.REGISTER.PROCESSING +
      t.syncJobs.REGISTER.RETRY_SCHEDULED
    : 0
  const slowAge =
    t?.oldestPendingSyncAt &&
    waitingRegister > 0 &&
    now - Date.parse(t.oldestPendingSyncAt) > SLOW_AFTER_MS
      ? ageOf(t.oldestPendingSyncAt, now)
      : null

  // 대기가 긴 사전예약 — 대기열은 평소엔 띠의 대기·예상 대기로만 보이고, 길어지면 할 일이 된다.
  // 입장이 멈췄는데 줄이 있으면(초당 0) 끝이 없으니 같이 띄운다.
  const longWaits = openProducts.filter(
    (product) =>
      (selected === null || product.productId === selected) &&
      product.waiting > 0 &&
      (product.credit <= 0 ||
        product.waiting / product.credit >= LONG_WAIT_SECONDS),
  )

  const candidates: (Task | false)[] = t
    ? [
        t.syncJobs.REGISTER.DEAD_LETTER > 0 && {
          key: 'register',
          level: 'urgent',
          title: `외부 등록 실패 ${formatNumber(t.syncJobs.REGISTER.DEAD_LETTER)}건 — 결제 단계로 못 넘어가고 있어요`,
          description: [
            !scoped && failuresByPreorder,
            '예약 현황에서 실패한 예약을 골라 재처리하세요',
          ]
            .filter(Boolean)
            .join(' / '),
          // 재처리는 예약 현황에서 한 건씩 골라서 한다 — 실패 탭을 고른 사전예약 그대로 연다.
          action: {
            label: '예약 현황에서 재처리',
            to: adminReservationsPath(
              'REPROCESS_NEEDED',
              selected ?? undefined,
            ),
          },
        },
        t.deadLetters.waiting > 0 && {
          key: 'dead-letters',
          level: 'check',
          title: `상태 반영 실패 ${formatNumber(t.deadLetters.waiting)}건`,
          // 원인은 메시지 원문을 봐야 알 수 있어 개발팀이 맡는다 — 운영 홈은 관리자 화면이라
          // 개발자 기능(이벤트 DLQ)으로 보내지 않고, 알릴 때 쓸 건수·시각만 보인다.
          description: [
            '결제 완료·기한 만료 같은 처리가 예약에 반영되지 않았어요',
            ageOf(t.deadLetters.oldestWaitingAt, now) &&
              `가장 오래된 건 ${ageOf(t.deadLetters.oldestWaitingAt, now)}`,
          ]
            .filter(Boolean)
            .join(' · '),
        },
        slowAge !== null && {
          key: 'slow',
          level: 'check',
          title: `외부 등록이 ${slowAge} 밀려 있어요 — 기다리는 예약 ${formatNumber(waitingRegister)}건`,
          description:
            '외부 예약 시스템이 느리거나 접수가 처리보다 빨라요 · 계속 늘면 입장 속도를 줄이세요',
          action: { label: '입장 속도 조절', to: ADMIN_WAITINGROOM_PATH },
        },
        ...longWaits.map((product): Task => ({
          key: `wait-${product.productId}`,
          level: 'check',
          title: `${nameOf(product.productId)} 대기 예상 ${waitEstimate(product.waiting, product.credit)} — 대기 ${formatNumber(product.waiting)}명`,
          description:
            product.credit <= 0
              ? '입장이 멈춰 있어요 · 대기열 관리에서 입장 속도를 확인하세요'
              : `초당 ${formatNumber(product.credit)}명씩 들어가고 있어요 · 외부 등록이 밀리지 않으면 입장 속도를 올리세요`,
          action: { label: '입장 속도 조절', to: ADMIN_WAITINGROOM_PATH },
        })),
        t.paymentOverdue > 0 && {
          key: 'overdue',
          level: 'todo',
          title: `결제 기한이 지났는데 아직 만료 전인 예약 ${formatNumber(t.paymentOverdue)}건`,
          description:
            '서버가 곧 자동으로 만료해요 · 문의가 오면 예약 현황에서 찾으세요',
          action: { label: '예약 보기', to: ADMIN_RESERVATIONS_PATH },
        },
        shipping !== null &&
          shipping.preparing + shipping.ready > 0 && {
            key: 'shipping',
            level: 'todo',
            title: `배송 처리 대기 주문 ${formatNumber(shipping.preparing + shipping.ready)}건`,
            description: `상품 준비 중 ${formatNumber(shipping.preparing)}건 · 출고 대기 ${formatNumber(shipping.ready)}건`,
            scope: scoped ? '전체 기준' : undefined,
            action: {
              label: '주문 처리',
              to: `${ADMIN_ORDERS_PATH}?status=PREPARING_ITEMS`,
            },
          },
      ]
    : []
  const tasks = candidates.filter((task) => task !== false)

  // 마감 뒤 결과가 나올 시간이 지난 회차만 진행을 받아 본다.
  const stuckCandidates = (draws.data ?? []).filter((draw) => {
    const sinceClose = now - Date.parse(draw.closesAt)
    return sinceClose > DRAW_STUCK_AFTER_MS && sinceClose < STUCK_LOOKBACK_MS
  })

  const refresh = () => {
    void stats.refetch()
    void queue.refetch()
    void draws.refetch()
    void preparing.refetch()
    void readyToShip.refetch()
  }

  const statsError = pollingError(stats)

  return (
    <div className={styles.root}>
      <RefreshStatus
        updatedAt={stats.dataUpdatedAt}
        onRefresh={refresh}
        note="5초마다 자동 갱신"
      />

      {statsError !== null && (
        <InlineAlert status={s ? 'warning' : 'error'}>
          {getErrorMessage(statsError, '운영 현황을 불러오지 못했어요.')}
          {s && ' 아래 숫자는 마지막으로 받은 값이에요.'}
        </InlineAlert>
      )}

      <InlineAlert status={verdict.status} icon={verdictIcon[verdict.status]}>
        {verdict.message}
      </InlineAlert>

      <section className={styles.section} aria-labelledby="ops-open">
        <h2 id="ops-open" className={styles.sectionTitle}>
          진행 중인 사전예약
        </h2>
        {queue.isPending ? (
          <Skeleton height={96} />
        ) : (
          <OpenPreorderStrip
            items={strip}
            selected={selected}
            onSelect={setPicked}
            now={now}
            allowAll
          />
        )}
        {pollingError(queue) !== null && (
          <InlineAlert status={q ? 'warning' : 'error'}>
            {getErrorMessage(
              pollingError(queue),
              '대기열 현황을 불러오지 못했어요.',
            )}
          </InlineAlert>
        )}
      </section>

      <section className={styles.section} aria-labelledby="ops-todo">
        <h2 id="ops-todo" className={styles.sectionTitle}>
          지금 처리할 일
        </h2>
        {stats.isPending ? (
          <SkeletonGroup className={styles.taskSkeleton}>
            {[0, 1].map((row) => (
              <Skeleton key={row} height={76} />
            ))}
          </SkeletonGroup>
        ) : (
          <>
            {tasks
              .filter((task) => task.level !== 'todo')
              .map(({ key, ...task }) => (
                <OpsTaskCard key={key} {...task} />
              ))}
            {/* 멈춘 추첨은 '확인' 단계라 실패 뒤, 일상 업무 앞에 둔다. */}
            {stuckCandidates.map((draw) => (
              <StuckDrawTask key={draw.drawId} draw={draw} now={now} />
            ))}
            {tasks
              .filter((task) => task.level === 'todo')
              .map(({ key, ...task }) => (
                <OpsTaskCard key={key} {...task} />
              ))}
            {/* 집계를 못 받았으면 이상 없음이라고 말하지 않는다. */}
            {t && tasks.length === 0 && (
              <div className={styles.allClear}>
                <CircleCheck size={18} aria-hidden="true" />
                외부 등록 · 상태 반영 · 결제 기한 · 배송에 밀린 일이 없어요.
              </div>
            )}
            {/* 못 받았으면 빈칸으로 두지 않는다 — 비어 있으면 "할 일 없음"으로 읽힌다. */}
            {!t && (
              <div className={styles.allClear}>
                <TriangleAlert size={18} aria-hidden="true" />
                운영 현황을 받지 못해 처리할 일을 판단할 수 없어요. 위 안내를
                확인하세요.
              </div>
            )}
          </>
        )}
      </section>

      {/* 다른 섹션처럼 제목은 카드 밖에 두고, 카드에는 그래프만 담는다. */}
      <section className={styles.section} aria-labelledby="ops-flow">
        <div className={styles.cardHeader}>
          <h2 id="ops-flow" className={styles.sectionTitle}>
            접수·처리 속도
          </h2>
          <span className={styles.caption}>
            관리자 화면을 연 뒤부터 · 건/초
          </span>
        </div>
        <div className={styles.card}>
          <ThroughputChart
            // 고른 사전예약이 바뀌면 그래프 상태(올린 지점)를 새로 시작한다.
            key={selected ?? 'all'}
            label={`${selected ? nameOf(selected) : '전체'} 초당 접수와 외부 등록 처리`}
            unit="건/초"
            times={receivedRates.map(({ at }) => at)}
            series={[
              {
                label: '접수',
                values: receivedRates.map(({ value }) => value),
              },
              {
                label: '외부 등록 처리',
                values: processedRates.map(({ value }) => value),
              },
            ]}
          />
          <div className={styles.caption}>
            두 선 사이가 벌어진 만큼 외부 등록 대기가 쌓여요.
          </div>
        </div>
      </section>
    </div>
  )
}

import { useState } from 'react'

import { CircleCheck, TriangleAlert } from 'lucide-react'

import { useAdminDraws, useStuckDraws } from '@entities/admin-draw'
import { useAdminOrderCounts } from '@entities/admin-order'
import { useAdminProductCount } from '@entities/admin-product'
import {
  useReservationStats,
  useReservationStatsHistory,
} from '@entities/admin-reservation'
import { isBraking, waitEstimate } from '@entities/admin-waitingroom'
import {
  OpenPreorderPicker,
  SLOW_AFTER_MS,
  useOpenPreorders,
} from '@features/open-preorder-picker'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import {
  ADMIN_ORDERS_PATH,
  ADMIN_RECONCILIATION_PATH,
  ADMIN_WAITINGROOM_PATH,
  adminReservationsPath,
} from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { slopePerSecond } from '@shared/lib/samples'
import { InlineAlert, RefreshStatus, Skeleton, SkeletonGroup } from '@shared/ui'

import { ORDER_SUMMARY_STEPS } from '../../lib/orderSummary'
import { useScrolledPast } from '../../lib/useScrolledPast'
import { BacklogCard } from '../BacklogCard'
import { DrawSummaryCard } from '../DrawSummaryCard'
import { OpenPreorderCard } from '../OpenPreorderCard'
import { OpsKpiCard } from '../OpsKpiCard'
import { OpsTaskCard, type OpsTaskCardProps } from '../OpsTaskCard'
import { OrderSummaryCard } from '../OrderSummaryCard'
import { StuckDrawTask } from '../StuckDrawTask'
import { UrgentBanner, type UrgentItem } from '../UrgentBanner'

import * as styles from './AdminOpsHome.css'

// 집계는 서버가 5초까지 캐시해(명세: "5초 이상이면 충분") 그보다 자주 받아도 같은 값이다.
// 문제를 처음 알아채는 화면이라 그 하한에 맞춘다.
const POLL_INTERVAL_MS = 5_000
// 주문·상품 수, 럭키드로우 단계는 몇 초 사이엔 잘 안 바뀌어 느리게 다시 받는다.
const SLOW_POLL_MS = 30_000
/** 실패 숫자에 나눠 적을 사전예약 수 — 넘으면 '외 N곳'으로 줄인다 */
const BREAKDOWN_MAX = 3
// shortcut: 마감 뒤 하루 안의 회차만 멈췄는지 본다(회차마다 진행을 따로 받아서). 회차가 많아지면 서버 집계로 바꾼다.
const STUCK_LOOKBACK_MS = 24 * 60 * 60 * 1000
// 맨 뒤 예상 대기가 이만큼 길어지면 할 일로 띄운다 — 서버에 기준이 없어 화면에서 정한 값이다.
const LONG_WAIT_SECONDS = 10 * 60

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
 * 운영 대시보드 — 오픈 중 운영자가 가장 먼저 보는 한 화면. 맨 위에 결제를 막는 긴급한 일,
 * 그 아래 영역별 숫자(대기열·예약·외부 등록·배송), 처리 흐름과 사전예약별 현황, 마지막으로
 * 할 일 목록과 럭키드로우·주문 요약을 둔다. 숫자마다 처리할 화면으로 가는 링크를 붙인다.
 */
export function AdminOpsHome({ productNames }: AdminOpsHomeProps) {
  const stats = useReservationStats(undefined, POLL_INTERVAL_MS)
  const draws = useAdminDraws(SLOW_POLL_MS)
  const orders = useAdminOrderCounts(ORDER_SUMMARY_STEPS, SLOW_POLL_MS)
  const activeProducts = useAdminProductCount(
    { status: 'ACTIVE' },
    SLOW_POLL_MS,
  )
  const pausedProducts = useAdminProductCount(
    { status: 'PAUSED' },
    SLOW_POLL_MS,
  )

  // 진행 중인 사전예약 — 동시에 여럿 열릴 수 있어 각각의 집계를 따로 받는다.
  const {
    queue,
    openProducts,
    items: openPreorders,
    nameOf,
    statsOf,
    refetchStats,
  } = useOpenPreorders(productNames, POLL_INTERVAL_MS)
  const q = queue.data
  // 대시보드가 보는 범위 — 처음엔 전체(null). 고른 사전예약이 마감돼 목록에서 빠지면 전체로
  // 돌아간다.
  const [picked, setPicked] = useState<string | null>(null)
  const selected = openProducts.some((product) => product.productId === picked)
    ? picked
    : null
  const scoped = selected !== null

  // 외부 등록 대기(적체)는 관리자 화면을 연 뒤 받은 집계로 그린다 — 다른 화면에 다녀와도
  // 이어진다(새로 고치면 처음부터). 고른 사전예약이 있으면 그 사전예약만.
  const backlogSamples = useReservationStatsHistory(selected ?? undefined).map(
    ({ at, value }) => ({ at, value: value.preorders.PENDING_SYNC }),
  )
  const backlogSlope = slopePerSecond(backlogSamples).at(-1)?.value

  const s = stats.data
  // 판정 기준 시각 — 받은 응답의 시각을 써서 렌더마다 흔들리지 않게 한다. 회차 단계는 회차
  // 목록만 와도 정해야 해서 둘 중 늦은 쪽을 쓴다. 둘 다 못 받았으면 0이라 판정하지 않는다.
  const now = Math.max(stats.dataUpdatedAt, draws.dataUpdatedAt)

  // 사전예약을 골랐으면 숫자·할 일도 그 사전예약 집계로 센다.
  const t = selected ? statsOf(selected) : s
  const failures = t ? t.syncJobs.REGISTER.DEAD_LETTER : null

  // 둘 이상 열려 있으면 실패가 어느 사전예약에서 났는지 나눠 적는다(많은 순).
  const failedPreorders = openPreorders
    .filter((item) => item.failures)
    .toSorted((a, b) => (b.failures ?? 0) - (a.failures ?? 0))
  const failureBreakdown =
    !scoped && openPreorders.length > 1
      ? [
          ...failedPreorders
            .slice(0, BREAKDOWN_MAX)
            .map((item) => `${item.name} ${formatNumber(item.failures ?? 0)}`),
          ...(failedPreorders.length > BREAKDOWN_MAX
            ? [`외 ${failedPreorders.length - BREAKDOWN_MAX}곳`]
            : []),
        ]
      : []
  const failuresByPreorder = failureBreakdown.join(' · ')

  // 대기열 — 고른 사전예약이 있으면 그것만, 없으면 접수 중인 사전예약 합.
  const queueScope = openProducts.filter(
    (product) => selected === null || product.productId === selected,
  )
  const waiting = q
    ? queueScope.reduce((total, product) => total + product.waiting, 0)
    : null
  const credit = queueScope.reduce(
    (total, product) => total + product.credit,
    0,
  )
  const wait = waiting === null ? null : waitEstimate(waiting, credit)

  const shipping =
    orders.counts.PREPARING_ITEMS !== null &&
    orders.counts.READY_TO_SHIP !== null
      ? {
          preparing: orders.counts.PREPARING_ITEMS,
          ready: orders.counts.READY_TO_SHIP,
        }
      : null

  // 외부 등록을 기다리는 작업(재처리 필요는 빼고) — 0이면 오래 기다리는 접수 시각이
  // 재처리 필요 건을 가리킬 수 있어 밀림으로 보지 않는다.
  const waitingRegister = t
    ? t.syncJobs.REGISTER.PENDING +
      t.syncJobs.REGISTER.PROCESSING +
      t.syncJobs.REGISTER.RETRY_SCHEDULED
    : 0
  // ponytail: oldestPendingSyncAt엔 재처리 필요(DEAD_LETTER) 예약도 들어 있어, 실패가 있으면
  // 그 접수 시각을 밀림으로 잘못 읽는다 — 실패가 있으면 밀림을 띄우지 않는다(실패 할 일이
  // 먼저 뜬다). 서버가 처리 중인 것만의 시각을 주면 이 조건을 뺀다.
  const slowAge =
    t?.oldestPendingSyncAt &&
    waitingRegister > 0 &&
    t.syncJobs.REGISTER.DEAD_LETTER === 0 &&
    now - Date.parse(t.oldestPendingSyncAt) > SLOW_AFTER_MS
      ? ageOf(t.oldestPendingSyncAt, now)
      : null

  // 대기가 긴 사전예약 — 입장이 멈췄는데 줄이 있으면(초당 0) 끝이 없으니 같이 띄운다.
  const longWaits = queueScope.filter(
    (product) =>
      product.waiting > 0 &&
      (product.credit <= 0 ||
        product.waiting / product.credit >= LONG_WAIT_SECONDS),
  )

  const reprocessPath = adminReservationsPath(
    'REPROCESS_NEEDED',
    selected ?? undefined,
  )

  // 급한 순서대로 쌓는다. 0건인 일은 빼서 이상이 없으면 목록이 비게 한다. 배송 대기는 위
  // 숫자와 주문 카드가 보여 줘 여기엔 두지 않는다.
  const candidates: (Task | false)[] = t
    ? [
        t.syncJobs.REGISTER.DEAD_LETTER > 0 && {
          key: 'register',
          level: 'urgent',
          title: `결제 막힘 · 외부 등록 실패 ${formatNumber(t.syncJobs.REGISTER.DEAD_LETTER)}건`,
          // 재처리는 예약 현황에서 한다 — 실패 탭을 고른 사전예약 그대로 연다.
          action: { label: '재처리', to: reprocessPath },
        },
        t.deadLetters.waiting > 0 && {
          key: 'dead-letters',
          level: 'check',
          // 원인은 메시지 원문을 봐야 알 수 있어 개발팀이 맡는다 — 운영 대시보드는 관리자 화면이라
          // 개발자 기능(이벤트 DLQ)으로 보내지 않는다.
          title: `결제·만료 반영 실패 ${formatNumber(t.deadLetters.waiting)}건`,
        },
        slowAge !== null && {
          key: 'slow',
          level: 'check',
          title: `외부 등록 ${formatNumber(waitingRegister)}건 ${slowAge} 밀림`,
          action: { label: '속도 조절', to: ADMIN_WAITINGROOM_PATH },
        },
        ...longWaits.map((product): Task => ({
          key: `wait-${product.productId}`,
          level: 'check',
          title:
            product.credit <= 0
              ? `${nameOf(product.productId)} 입장 멈춤 · ${formatNumber(product.waiting)}명 대기`
              : `${nameOf(product.productId)} 대기 ${waitEstimate(product.waiting, product.credit)}`,
          action: { label: '속도 조절', to: ADMIN_WAITINGROOM_PATH },
        })),
        t.paymentOverdue > 0 && {
          key: 'overdue',
          level: 'todo',
          title: `결제 기한 지난 예약 ${formatNumber(t.paymentOverdue)}건`,
          action: { label: '예약 보기', to: adminReservationsPath('all') },
        },
      ]
    : []
  const tasks = candidates.filter((task) => task !== false)

  // 맨 위 긴급 카드 — 결제를 막는 일. 지금은 외부 등록 실패 하나다.
  const urgentItems: UrgentItem[] =
    t && t.syncJobs.REGISTER.DEAD_LETTER > 0
      ? [
          {
            key: 'register',
            label: '외부 등록 실패',
            count: t.syncJobs.REGISTER.DEAD_LETTER,
            breakdown: failureBreakdown,
            action: { label: '재처리하기', to: reprocessPath },
          },
        ]
      : []
  // 긴급 띠가 스크롤 영역 위로 사라지면 위에 얇은 한 줄을 띄운다. 띠의 높이를 바꾸지 않고
  // 따로 띄워야 브라우저의 스크롤 위치 보정과 맞물려 깜빡이지 않는다.
  const { ref: urgentRef, past: urgentScrolledPast } =
    useScrolledPast<HTMLDivElement>()

  // 마감 뒤 결과가 나올 시간이 지난 회차만 진행을 받아 본다.
  const stuckCandidates = (draws.data ?? []).filter((draw) => {
    const sinceClose = now - Date.parse(draw.closesAt)
    return sinceClose > 0 && sinceClose < STUCK_LOOKBACK_MS
  })
  const stuckDraws = useStuckDraws(stuckCandidates, now)

  const refresh = () => {
    void stats.refetch()
    void queue.refetch()
    refetchStats()
    void draws.refetch()
    orders.refetch()
    void activeProducts.refetch()
    void pausedProducts.refetch()
  }

  const statsError = pollingError(stats)
  const queueError = pollingError(queue)

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <h1 className={styles.pageTitle}>운영 대시보드</h1>
        <RefreshStatus
          updatedAt={stats.dataUpdatedAt}
          onRefresh={refresh}
          note="5초마다 자동 갱신"
        />
      </header>

      {statsError !== null && (
        <InlineAlert status={s ? 'warning' : 'error'}>
          {getErrorMessage(statsError, '운영 현황을 불러오지 못했어요.')}
          {s && ' 아래 숫자는 마지막으로 받은 값이에요.'}
        </InlineAlert>
      )}

      {/* 결제를 막는 일은 어디를 보든 먼저 보이게 맨 위에 한 번 더 두고, 띠가 스크롤로
          사라지면 헤더 바로 아래에 얇은 한 줄로 따라온다. */}
      {urgentItems.length > 0 && (
        <>
          <div ref={urgentRef}>
            <UrgentBanner items={urgentItems} />
          </div>
          <div className={styles.urgentPin}>
            {urgentScrolledPast && (
              <div className={styles.urgentPinned}>
                <UrgentBanner items={urgentItems} compact />
              </div>
            )}
          </div>
        </>
      )}

      <section className={styles.section} aria-labelledby="ops-open">
        <h2 id="ops-open" className={styles.sectionTitle}>
          진행 중인 사전예약
        </h2>
        {queue.isPending ? (
          <Skeleton height={38} width={320} />
        ) : (
          <OpenPreorderPicker
            items={openPreorders}
            selected={selected}
            onSelect={setPicked}
          />
        )}
        {queueError !== null && (
          <InlineAlert status={q ? 'warning' : 'error'}>
            {getErrorMessage(queueError, '대기열 현황을 불러오지 못했어요.')}
          </InlineAlert>
        )}
      </section>

      <div className={styles.kpis}>
        <OpsKpiCard
          label="대기 인원"
          to={ADMIN_WAITINGROOM_PATH}
          linkLabel="대기열 관리"
          value={waiting}
          unit="명"
          loading={queue.isPending}
          description={
            wait
              ? `맨 뒤 예상 대기 ${wait} · 초당 ${formatNumber(credit)}명 입장`
              : '기다리는 사람이 없어요'
          }
        />
        <OpsKpiCard
          label="예약 접수"
          to={adminReservationsPath(undefined, selected ?? undefined)}
          linkLabel="예약 현황"
          value={t ? sum(t.preorders) : null}
          unit="건"
          loading={stats.isPending}
          description={
            t &&
            `결제 완료 ${formatNumber(t.preorders.RESERVED)} · 외부 등록 대기 ${formatNumber(t.preorders.PENDING_SYNC)}`
          }
        />
        <OpsKpiCard
          label="외부 등록 실패"
          to={reprocessPath}
          linkLabel={failures ? '재처리하기' : '예약 현황'}
          value={failures}
          unit="건"
          tone={failures ? 'danger' : 'default'}
          loading={stats.isPending}
          description={
            failures
              ? ['결제로 못 넘어가요', failuresByPreorder]
                  .filter(Boolean)
                  .join(' · ')
              : failures === 0 && '재처리할 예약이 없어요'
          }
        />
        {/* ponytail: 불일치 건수를 주는 API가 없어 자리만 둔다(값은 '—'). 대조는 예약 전체와
            외부 원장 전체를 받아야 해서 5초 갱신에 넣지 않는다 — 백엔드에 stats 응답의 대조
            요약을 요청해 뒀고, 생기면 value에 그 숫자를 넣는다. */}
        <OpsKpiCard
          label="외부 예약 대조"
          to={ADMIN_RECONCILIATION_PATH}
          linkLabel="대조하기"
          value={null}
          unit="건"
          description="불일치 건수는 집계 준비 중 · 눌러서 대조"
        />
        <OpsKpiCard
          label="배송 대기 주문"
          to={`${ADMIN_ORDERS_PATH}?status=PREPARING_ITEMS`}
          linkLabel="주문 관리"
          value={shipping && shipping.preparing + shipping.ready}
          unit="건"
          description={
            shipping &&
            [
              `상품 준비 ${formatNumber(shipping.preparing)} · 출고 대기 ${formatNumber(shipping.ready)}`,
              // 주문은 상품으로 거를 수 없어 고른 사전예약과 상관없이 전체다.
              scoped && '전체 기준',
            ]
              .filter(Boolean)
              .join(' · ')
          }
        />
      </div>

      <div className={styles.mainRow}>
        <BacklogCard
          // 고른 사전예약이 바뀌면 그래프를 새로 그린다(선이 다시 그려진다).
          key={selected ?? 'all'}
          backlog={t ? t.preorders.PENDING_SYNC : null}
          perMinute={backlogSlope === undefined ? null : backlogSlope * 60}
          history={{
            times: backlogSamples.map(({ at }) => at),
            values: backlogSamples.map(({ value }) => value),
          }}
          // 브레이크는 대기열 전체에 하나라 고른 사전예약과 상관없이 전체 기준이다.
          braking={isBraking(q?.brakeFactor ?? null)}
          flow={{
            waiting,
            payable: t ? t.preorders.REGISTERED : null,
            reserved: t ? t.preorders.RESERVED : null,
          }}
        />
        <OpenPreorderCard
          items={openPreorders}
          selected={selected}
          onSelect={setPicked}
          loading={queue.isPending}
        />
      </div>

      <div className={styles.bottomRow}>
        <section className={styles.taskPanel} aria-labelledby="ops-todo">
          <div className={styles.panelHeader}>
            <h2 id="ops-todo" className={styles.panelTitle}>
              지금 처리할 일
            </h2>
          </div>
          {stats.isPending ? (
            <SkeletonGroup className={styles.taskSkeleton}>
              {[0, 1].map((row) => (
                <Skeleton key={row} height={52} />
              ))}
            </SkeletonGroup>
          ) : (
            <div>
              {tasks
                .filter((task) => task.level !== 'todo')
                .map(({ key, ...task }) => (
                  <OpsTaskCard key={key} {...task} />
                ))}
              {/* 멈춘 추첨은 '확인' 단계라 실패 뒤, 일상 업무 앞에 둔다. */}
              {stuckDraws.stuck.map((draw) => (
                <StuckDrawTask key={draw.drawId} draw={draw} />
              ))}
              {tasks
                .filter((task) => task.level === 'todo')
                .map(({ key, ...task }) => (
                  <OpsTaskCard key={key} {...task} />
                ))}
              {/* 집계·추첨 진행을 다 받기 전엔 이상 없음이라고 말하지 않는다. */}
              {t &&
                tasks.length === 0 &&
                stuckDraws.stuck.length === 0 &&
                !draws.isPending &&
                !stuckDraws.isPending && (
                  <div className={styles.allClear}>
                    <CircleCheck size={18} aria-hidden="true" />
                    밀린 일이 없어요.
                  </div>
                )}
              {/* 못 받았으면 빈칸으로 두지 않는다 — 비어 있으면 "할 일 없음"으로 읽힌다. */}
              {!t && (
                <div className={styles.allClear}>
                  <TriangleAlert size={18} aria-hidden="true" />
                  현황을 받지 못해 판단할 수 없어요.
                </div>
              )}
            </div>
          )}
        </section>

        <DrawSummaryCard
          draws={draws.data}
          isPending={draws.isPending}
          now={now}
          recentMs={STUCK_LOOKBACK_MS}
        />

        <OrderSummaryCard
          orders={orders.counts}
          products={{
            active: activeProducts.data ?? null,
            paused: pausedProducts.data ?? null,
          }}
        />
      </div>
    </div>
  )
}

import { useState } from 'react'

import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'

import { DRAW_STUCK_AFTER_MS, useAdminDraws } from '@entities/admin-draw'
import { useAdminOrders } from '@entities/admin-order'
import {
  useReservationStats,
  useSyncJobErrorGroups,
} from '@entities/admin-reservation'
import {
  isBraking,
  useWaitingroomStatus,
  type WaitingroomProductStatus,
} from '@entities/admin-waitingroom'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import {
  ADMIN_DEAD_LETTERS_PATH,
  ADMIN_ORDERS_PATH,
  ADMIN_RECOVERY_PATH,
  ADMIN_RESERVATIONS_PATH,
  ADMIN_WAITINGROOM_PATH,
} from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import {
  appendSample,
  ratePerSecond,
  slopePerSecond,
  type Sample,
} from '@shared/lib/samples'
import {
  InlineAlert,
  RefreshStatus,
  Skeleton,
  SkeletonGroup,
  Table,
  ThroughputChart,
} from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import { flowVerdict, type FlowVerdict } from '../../lib/flowVerdict'
import { OpsTaskCard, type OpsTaskCardProps } from '../OpsTaskCard'
import { StuckDrawTask } from '../StuckDrawTask'

import * as styles from './AdminOpsHome.css'

const POLL_INTERVAL_MS = 10_000
/** 상품별 대기열 표에 보일 상품 수 — 전부는 대기열 관리에서 본다 */
const QUEUE_ROWS = 5
// shortcut: 마감 뒤 하루 안의 회차만 멈췄는지 본다(회차마다 진행을 따로 받아서). 회차가 많아지면 서버 집계로 바꾼다.
const STUCK_LOOKBACK_MS = 24 * 60 * 60 * 1000

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
 * 운영 홈 — 오픈 중 운영자가 가장 먼저 보는 화면. 급한 일부터 위에 올리고(실패 → 멈춤 →
 * 기한·일상), 아래에 처리 흐름(부하 검증과 같은 그래프)과 상품별 대기열을 둔다. 숫자마다
 * 처리할 화면으로 가는 링크를 붙인다.
 */
export function AdminOpsHome({ productNames }: AdminOpsHomeProps) {
  const stats = useReservationStats(undefined, POLL_INTERVAL_MS)
  const errors = useSyncJobErrorGroups(POLL_INTERVAL_MS)
  const queue = useWaitingroomStatus(POLL_INTERVAL_MS)
  const draws = useAdminDraws()
  // 건수만 필요해 한 건씩 받고 total을 쓴다.
  const preparing = useAdminOrders({ status: 'PREPARING_ITEMS', size: 1 })
  const readyToShip = useAdminOrders({ status: 'READY_TO_SHIP', size: 1 })

  // 처리 흐름은 이 화면을 연 뒤 받은 집계로 그린다(새로 고치면 처음부터).
  const [history, setHistory] = useState<
    Sample<{ received: number; processed: number; backlog: number }>[]
  >([])
  // 새 응답이 오면 렌더 중에 표본을 붙인다 — 같은 응답이면 건너뛴다.
  if (stats.data && stats.dataUpdatedAt !== history.at(-1)?.at) {
    const { preorders } = stats.data
    // 접수는 모든 상태의 합, 처리는 외부 등록을 기다리지 않는 것 — 둘의 차이가 적체다.
    const received = sum(preorders)
    setHistory((prev) =>
      appendSample(prev, {
        at: stats.dataUpdatedAt,
        value: {
          received,
          processed: received - preorders.PENDING_SYNC,
          backlog: preorders.PENDING_SYNC,
        },
      }),
    )
  }
  const pick = (key: 'received' | 'processed' | 'backlog') =>
    history.map(({ at, value }) => ({ at, value: value[key] }))
  const receivedRates = ratePerSecond(pick('received'))
  const processedRates = ratePerSecond(pick('processed'))
  const backlogSlope = slopePerSecond(pick('backlog')).at(-1)?.value

  const s = stats.data
  const q = queue.data
  const braking = isBraking(q?.brakeFactor ?? null)
  const verdict = flowVerdict({
    braking,
    backlogPerMinute: backlogSlope === undefined ? null : backlogSlope * 60,
  })
  // 판정 기준 시각 — 받은 집계의 시각을 써서 렌더마다 흔들리지 않게 한다. 아직 못 받았으면
  // 0이라 멈춘 추첨·경과 시간을 판정하지 않는다.
  const now = stats.dataUpdatedAt

  const topErrors = (errors.data ?? [])
    .toSorted((a, b) => b.count - a.count)
    .slice(0, 2)
    .map((group) => `${group.errorCode} ${formatNumber(group.count)}건`)
    .join(' · ')

  const shipping =
    preparing.data && readyToShip.data
      ? { preparing: preparing.data.total, ready: readyToShip.data.total }
      : null

  // 급한 순서대로 쌓는다. 0건인 일은 빼서 이상이 없으면 목록이 비게 한다.
  const candidates: (Task | false)[] = s
    ? [
        s.syncJobs.REGISTER.DEAD_LETTER > 0 && {
          key: 'register',
          level: 'urgent',
          title: `외부 등록 실패 ${formatNumber(s.syncJobs.REGISTER.DEAD_LETTER)}건 — 결제 단계로 못 넘어가고 있어요`,
          description: topErrors
            ? `원인 ${topErrors}`
            : '원인별 건수를 불러오는 중이에요',
          action: { label: '원인별로 다시 보내기', to: ADMIN_RECOVERY_PATH },
        },
        s.deadLetters.waiting > 0 && {
          key: 'dead-letters',
          level: 'check',
          title: `상태 반영 실패 ${formatNumber(s.deadLetters.waiting)}건`,
          description: [
            ageOf(s.deadLetters.oldestWaitingAt, now) &&
              `가장 오래된 메시지 ${ageOf(s.deadLetters.oldestWaitingAt, now)}`,
            '되돌리거나 사유를 적고 버리세요',
          ]
            .filter(Boolean)
            .join(' · '),
          action: { label: '이벤트 DLQ 열기', to: ADMIN_DEAD_LETTERS_PATH },
        },
        s.paymentOverdue > 0 && {
          key: 'overdue',
          level: 'todo',
          title: `결제 기한이 지났는데 아직 만료 전인 예약 ${formatNumber(s.paymentOverdue)}건`,
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
    void errors.refetch()
    void queue.refetch()
    void draws.refetch()
    void preparing.refetch()
    void readyToShip.refetch()
  }

  const queueColumns: TableColumn<WaitingroomProductStatus>[] = [
    {
      key: 'name',
      header: '상품',
      render: (product) =>
        productNames.get(product.productId) ?? product.productId,
    },
    {
      key: 'waiting',
      header: '대기',
      align: 'right',
      render: (product) => `${formatNumber(product.waiting)}명`,
    },
    {
      key: 'credit',
      header: '초당 입장',
      align: 'right',
      render: (product) => `${formatNumber(product.credit)}명`,
    },
  ]

  const statsError = pollingError(stats)

  return (
    <div className={styles.root}>
      <RefreshStatus
        updatedAt={stats.dataUpdatedAt}
        onRefresh={refresh}
        note="10초마다 자동 갱신"
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
            {s && tasks.length === 0 && (
              <div className={styles.allClear}>
                <CircleCheck size={18} aria-hidden="true" />
                외부 등록 · 상태 반영 · 결제 기한 · 배송에 밀린 일이 없어요.
              </div>
            )}
            {/* 못 받았으면 빈칸으로 두지 않는다 — 비어 있으면 "할 일 없음"으로 읽힌다. */}
            {!s && (
              <div className={styles.allClear}>
                <TriangleAlert size={18} aria-hidden="true" />
                운영 현황을 받지 못해 처리할 일을 판단할 수 없어요. 위 안내를
                확인하세요.
              </div>
            )}
          </>
        )}
      </section>

      <div className={styles.columns}>
        <section className={styles.card} aria-labelledby="ops-flow">
          <div className={styles.cardHeader}>
            <h2 id="ops-flow" className={styles.sectionTitle}>
              들어오는 양과 처리한 양
            </h2>
            <span className={styles.caption}>이 화면을 연 뒤부터 · 건/초</span>
          </div>
          <ThroughputChart
            label="초당 접수와 외부 등록 처리"
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
        </section>

        <section className={styles.card} aria-labelledby="ops-queue">
          <div className={styles.cardHeader}>
            <h2 id="ops-queue" className={styles.sectionTitle}>
              상품별 대기열
            </h2>
            <Link className={styles.link} to={ADMIN_WAITINGROOM_PATH}>
              대기열 관리
            </Link>
          </div>
          {pollingError(queue) !== null && (
            <InlineAlert status={q ? 'warning' : 'error'}>
              {getErrorMessage(
                pollingError(queue),
                '대기열 현황을 불러오지 못했어요.',
              )}
            </InlineAlert>
          )}
          <Table
            columns={queueColumns}
            // 대기가 많은 상품이 막힌 상품이라 위로 올린다.
            rows={(q?.products ?? [])
              .toSorted((a, b) => b.waiting - a.waiting)
              .slice(0, QUEUE_ROWS)}
            rowKey={(product) => product.productId}
            loading={queue.isPending}
            loadingRows={3}
            emptyMessage="대기열에 오른 상품이 없어요."
          />
          <div className={styles.caption}>
            대기 많은 순 · 브레이크 배율{' '}
            {q?.brakeFactor != null ? `${q.brakeFactor}×` : '—'} (서버 자동)
          </div>
        </section>
      </div>
    </div>
  )
}

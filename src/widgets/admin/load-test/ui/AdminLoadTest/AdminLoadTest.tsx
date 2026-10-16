import { useState, type ReactNode } from 'react'

import { Link } from 'react-router'

import {
  useReservationStats,
  useSyncJobErrorGroups,
} from '@entities/admin-reservation'
import { isBraking, useWaitingroomStatus } from '@entities/admin-waitingroom'
import {
  mockFailureModeLabel,
  useMockConfig,
} from '@entities/external-reservation'
import { getErrorMessage } from '@shared/api/client'
import {
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import {
  ADMIN_MOCK_SETTINGS_PATH,
  ADMIN_RECONCILIATION_PATH,
  ADMIN_WAITINGROOM_PATH,
} from '@shared/config/routes'
import { srOnly } from '@shared/config/theme'
import {
  Button,
  Dropdown,
  FormSection,
  InlineAlert,
  RefreshStatus,
  Skeleton,
  Sparkline,
  StatCard,
  Table,
} from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import { appendSample, ratePerSecond, type Sample } from '../../lib/samples'

import * as styles from './AdminLoadTest.css'

// 서버 지표(TPS·응답 시간·에러율)는 Grafana가 맡는다 — 여기는 서비스 상태만 본다.
const GRAFANA_URL =
  'https://grafana.grandis-nova.link/?orgId=1&from=now-1h&to=now&timezone=browser&refresh=10s'
const DEFAULT_INTERVAL: RefreshInterval = 5_000

type QueuePoint = { waiting: number; credit: number; brake: number }
type ReservationPoint = { confirmed: number; pending: number }
type ErrorGroup = { errorCode: string | null; count: number }

const fmt = (value: number, unit: string, digits = 0) =>
  `${value.toLocaleString('ko-KR', { maximumFractionDigits: digits })}${unit}`

/** 가장 오래 기다린 접수가 몇 초·분째인지 */
const ageOf = (iso: string | null, now: number) => {
  if (!iso) return '없음'
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  return seconds < 60 ? `${seconds}초째` : `${Math.floor(seconds / 60)}분째`
}

const errorColumns: TableColumn<ErrorGroup>[] = [
  {
    key: 'code',
    header: '오류 코드',
    render: (group) => group.errorCode ?? '—',
  },
  {
    key: 'count',
    header: '작업 수',
    align: 'right',
    render: (group) => fmt(group.count, '건'),
  },
]

/** 숫자 아래 작은 추이 그래프를 붙인 카드 값 */
function Trend({
  value,
  values,
  label,
  danger,
}: {
  value: ReactNode
  values: number[]
  label: string
  danger?: boolean
}) {
  return (
    <span className={styles.trend}>
      {value}
      <Sparkline values={values} label={label} danger={danger} />
    </span>
  )
}

/**
 * 부하 검증(개발자용). 부하는 k6 같은 도구가 만들고, 이 화면은 그동안 대기열 → 예약 처리
 * → 외부 등록이 어떻게 버티는지 한 화면에서 지켜본다. 받은 값을 브라우저에 쌓아 최근
 * 몇 분의 흐름을 그린다(새로고침하면 사라진다). 조작은 대기열 관리·Mock 설정에서 한다.
 */
export function AdminLoadTest() {
  const [refreshInterval, setRefreshInterval] =
    useState<RefreshInterval>(DEFAULT_INTERVAL)
  const queue = useWaitingroomStatus(refreshInterval)
  const stats = useReservationStats(undefined, refreshInterval)
  const errors = useSyncJobErrorGroups(refreshInterval)
  const mock = useMockConfig()

  const [queueHistory, setQueueHistory] = useState<Sample<QueuePoint>[]>([])
  const [reservationHistory, setReservationHistory] = useState<
    Sample<ReservationPoint>[]
  >([])

  // 새 응답이 오면 그 자리에서 표본을 쌓는다(렌더 중 갱신 — 같은 응답이면 건너뛴다).
  if (queue.data && queue.dataUpdatedAt !== queueHistory.at(-1)?.at) {
    setQueueHistory((prev) =>
      appendSample(prev, {
        at: queue.dataUpdatedAt,
        value: {
          waiting: queue.data.products.reduce((sum, p) => sum + p.waiting, 0),
          credit: queue.data.globalCredit ?? 0,
          brake: queue.data.brakeFactor ?? 1,
        },
      }),
    )
  }
  if (stats.data && stats.dataUpdatedAt !== reservationHistory.at(-1)?.at) {
    const { preorders } = stats.data
    setReservationHistory((prev) =>
      appendSample(prev, {
        at: stats.dataUpdatedAt,
        value: {
          confirmed: preorders.REGISTERED + preorders.RESERVED,
          pending: preorders.PENDING_SYNC,
        },
      }),
    )
  }

  const series = <TPoint,>(
    history: Sample<TPoint>[],
    pick: (point: TPoint) => number,
  ) => history.map((sample) => pick(sample.value))
  const confirmRates = ratePerSecond(
    reservationHistory.map(({ at, value }) => ({ at, value: value.confirmed })),
  )

  const refresh = () => {
    void queue.refetch()
    void stats.refetch()
    void errors.refetch()
    void mock.refetch()
  }
  const clearHistory = () => {
    setQueueHistory([])
    setReservationHistory([])
  }

  const q = queue.data
  const s = stats.data
  const braking = isBraking(q?.brakeFactor ?? null)
  const failures = errors.data ?? []

  return (
    <div className={styles.root}>
      <RefreshStatus
        updatedAt={Math.max(queue.dataUpdatedAt, stats.dataUpdatedAt)}
        onRefresh={refresh}
        note={`최근 ${reservationHistory.length}개 표본`}
      >
        <Dropdown
          label="자동 갱신 간격"
          size="small"
          width="140px"
          options={refreshIntervalOptions}
          value={refreshInterval}
          // 고르는 즉시 한 번 받는다 — 새 간격을 기다리지 않고 지금 값을 보여준다.
          onSelect={(next) => {
            setRefreshInterval(next)
            refresh()
          }}
        />
        <Button size="small" variant="subtle" onClick={clearHistory}>
          그래프 비우기
        </Button>
        <a
          className={styles.externalLink}
          href={GRAFANA_URL}
          target="_blank"
          rel="noreferrer"
        >
          Grafana 열기
        </a>
      </RefreshStatus>

      <FormSection
        title="대기열"
        description={
          <>
            입장 속도·상한은{' '}
            <Link className={styles.link} to={ADMIN_WAITINGROOM_PATH}>
              대기열 관리
            </Link>
            에서 바꿉니다.
          </>
        }
      >
        {queue.isError && (
          <InlineAlert status={q ? 'warning' : 'error'}>
            {getErrorMessage(queue.error, '대기열 현황을 불러오지 못했습니다.')}
          </InlineAlert>
        )}
        {braking && (
          <InlineAlert status="warning">
            예약 서버의 오류나 지연 때문에 입장을 자동으로 줄이고 있습니다(배율{' '}
            {q?.brakeFactor}). 아래 예약 처리에서 원인을 확인하세요.
          </InlineAlert>
        )}
        {q?.snapshotStale && (
          <InlineAlert status="warning">
            대기열 현황이 {q.snapshotAgeSeconds ?? '?'}초째 갱신되지 않았습니다.
          </InlineAlert>
        )}
        <div className={styles.cards}>
          <StatCard
            label="총 대기 인원"
            muted={!q}
            value={
              <Trend
                value={
                  q ? fmt(queueHistory.at(-1)?.value.waiting ?? 0, '명') : '—'
                }
                values={series(queueHistory, (point) => point.waiting)}
                label="대기 인원 추이"
              />
            }
          />
          <StatCard
            label="실제 입장 속도"
            muted={!q}
            value={
              <Trend
                value={
                  q?.globalCredit != null ? fmt(q.globalCredit, '명/초') : '—'
                }
                values={series(queueHistory, (point) => point.credit)}
                label="입장 속도 추이"
              />
            }
          />
          <StatCard
            label="브레이크 배율"
            muted={!q}
            value={
              <Trend
                value={q?.brakeFactor ?? '—'}
                values={series(queueHistory, (point) => point.brake)}
                label="브레이크 배율 추이"
                danger={braking}
              />
            }
          />
          <StatCard
            label="대기열 서버"
            muted={!q}
            value={q?.gateways != null ? fmt(q.gateways, '대') : '—'}
          />
        </div>
      </FormSection>

      <FormSection
        title="예약 처리"
        description="집계는 서버가 5초까지 캐시해서 초당 확정은 최근 30초 평균입니다."
      >
        {stats.isError && (
          <InlineAlert status={s ? 'warning' : 'error'}>
            {getErrorMessage(stats.error, '예약 집계를 불러오지 못했습니다.')}
          </InlineAlert>
        )}
        <div className={styles.cards}>
          <StatCard
            label="초당 확정"
            muted={confirmRates.length === 0}
            value={
              <Trend
                value={
                  confirmRates.length > 0
                    ? fmt(confirmRates.at(-1) ?? 0, '건/초', 1)
                    : '측정 중'
                }
                values={confirmRates}
                label="초당 확정 추이"
              />
            }
          />
          <StatCard
            label="처리 중 적체"
            muted={!s}
            value={
              <Trend
                value={s ? fmt(s.preorders.PENDING_SYNC, '건') : '—'}
                values={series(reservationHistory, (point) => point.pending)}
                label="처리 중 적체 추이"
              />
            }
          />
          <StatCard
            label="가장 오래 처리 중"
            muted={!s}
            value={s ? ageOf(s.oldestPendingSyncAt, stats.dataUpdatedAt) : '—'}
          />
          <StatCard
            label="외부 등록 실패"
            muted={!s}
            value={s ? fmt(s.syncJobs.REGISTER.DEAD_LETTER, '건') : '—'}
          />
          <StatCard
            label="상태 반영 실패"
            muted={!s}
            value={s ? fmt(s.deadLetters.waiting, '건') : '—'}
          />
        </div>

        <div className={styles.subTitle}>
          외부 등록이 실패 중인 작업(오류 코드별)
        </div>
        {errors.isError && (
          <InlineAlert status="warning">
            {getErrorMessage(
              errors.error,
              '오류 코드별 수를 불러오지 못했습니다.',
            )}
          </InlineAlert>
        )}
        <Table
          columns={errorColumns}
          rows={failures}
          rowKey={(group) => group.errorCode ?? 'none'}
          loading={errors.isPending}
          loadingRows={3}
          emptyMessage="실패 중인 작업이 없습니다."
        />
      </FormSection>

      <FormSection
        title="시험 조건 · 시험 뒤"
        description={
          <>
            외부 Mock 지연·실패는{' '}
            <Link className={styles.link} to={ADMIN_MOCK_SETTINGS_PATH}>
              Mock 설정
            </Link>
            에서 바꾸고, 시험이 끝나면{' '}
            <Link className={styles.link} to={ADMIN_RECONCILIATION_PATH}>
              외부 예약 대조
            </Link>
            로 누락이 없는지 확인합니다.
          </>
        }
      >
        <div className={styles.card}>
          {mock.isError ? (
            <InlineAlert status="warning">
              {getErrorMessage(mock.error, 'Mock 설정을 불러오지 못했습니다.')}
            </InlineAlert>
          ) : mock.data ? (
            <div className={styles.mockSummary}>
              등록 지연 평균 {mock.data.registerLatencyMs}ms
              {mock.data.latencyTailRate > 0 &&
                ` (꼬리 ${Math.round(mock.data.latencyTailRate * 100)}% · ${mock.data.latencyTailMinMs}~${mock.data.latencyTailMaxMs}ms)`}
              {' · '}일시 실패 {Math.round(mock.data.failureRate * 1000) / 10}%
              {' · '}
              {mockFailureModeLabel[mock.data.failureMode]}
              {' · '}설정 버전 {mock.data.configVersion}
            </div>
          ) : (
            <div role="status" aria-busy="true">
              <span className={srOnly}>불러오는 중입니다.</span>
              <Skeleton width="60%" height={20} />
            </div>
          )}
        </div>
      </FormSection>
    </div>
  )
}

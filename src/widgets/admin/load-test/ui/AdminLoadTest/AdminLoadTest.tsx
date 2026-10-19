import { useEffect, useState } from 'react'

import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'

import {
  useReservationStats,
  useSyncJobErrorGroups,
} from '@entities/admin-reservation'
import {
  isBraking,
  useWaitingroomStatus,
  waitingroomRuntimeLabel,
  type WaitingroomProductStatus,
} from '@entities/admin-waitingroom'
import {
  mockFailureModeLabel,
  useMockConfig,
} from '@entities/external-reservation'
import { getErrorMessage } from '@shared/api/client'
import { setMockLoad } from '@shared/api/mock'
import { pollingError } from '@shared/api/queryPolicy'
import {
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import {
  ADMIN_MOCK_SETTINGS_PATH,
  ADMIN_RECONCILIATION_PATH,
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
  Button,
  Dropdown,
  FormSection,
  InlineAlert,
  RefreshStatus,
  Skeleton,
  SkeletonGroup,
  StatCard,
  Table,
  ThroughputChart,
} from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import { diagnose, type LoadTestVerdict } from '../../lib/diagnose'

import * as styles from './AdminLoadTest.css'

// 서버 지표(TPS·응답 시간·에러율)는 Grafana가 맡는다 — 여기는 업무 흐름이 버티는지 본다.
const GRAFANA_BASE =
  'https://grafana.grandis-nova.link/?orgId=1&timezone=browser'
const DEFAULT_INTERVAL: RefreshInterval = 5_000

// 성공에 경고 삼각형이 붙으면 문구와 반대로 읽힌다.
const verdictIcon: Record<LoadTestVerdict['status'], typeof Info> = {
  success: CircleCheck,
  info: Info,
  warning: TriangleAlert,
  error: TriangleAlert,
}

type ErrorGroup = { errorCode: string | null; count: number }

/** 시험을 시작한 때의 값 — 실패·접수를 "이번 시험에서 늘어난 만큼"으로 본다 */
type TestRun = {
  startedAt: number
  endedAt: number | null
  baseline: {
    received: number
    registerFailures: number
    eventFailures: number
  }
}

const sum = (values: Record<string, number>) =>
  Object.values(values).reduce((total, value) => total + value, 0)

const formatTime = (ms: number) =>
  new Date(ms).toLocaleTimeString('ko-KR', { hour12: false })

/** 가장 오래 기다린 접수가 몇 초·분째인지 */
const ageOf = (iso: string | null, now: number) => {
  if (!iso) return '없음'
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (seconds < 60) return `${seconds}초째`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분째`
  return `${Math.floor(seconds / 3600)}시간째`
}

/** 분당 변화 — 눈금 없는 그래프 대신 얼마나 빨리 바뀌는지를 숫자로 보인다 */
const perMinuteNote = (perSecond: number | undefined, unit: string) => {
  if (perSecond === undefined) return '변화 측정 중'
  const perMinute = Math.round(perSecond * 60)
  if (perMinute === 0) return '변화 없음'
  return `분당 ${perMinute > 0 ? '+' : '−'}${formatNumber(Math.abs(perMinute))}${unit}`
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
    render: (group) => `${formatNumber(group.count)}건`,
  },
]

const queueColumns = (
  productNames: ReadonlyMap<string, string>,
): TableColumn<WaitingroomProductStatus>[] => [
  {
    key: 'name',
    header: '상품',
    render: (product) =>
      productNames.get(product.productId) ?? product.productId,
  },
  {
    key: 'runtime',
    header: '대기열 상태',
    align: 'center',
    render: (product) => waitingroomRuntimeLabel[product.runtime],
  },
  {
    key: 'waiting',
    header: '대기 인원',
    align: 'right',
    render: (product) => `${formatNumber(product.waiting)}명`,
  },
  {
    key: 'credit',
    header: '입장 속도 / 상한',
    align: 'right',
    render: (product) =>
      `${formatNumber(product.credit)} / ${formatNumber(product.cap)}명/초`,
  },
]

/** 카드 값 아래에 작은 보조 문구(변화량·시험 중 증가분)를 붙인다 */
function ValueWithNote({ value, note }: { value: string; note?: string }) {
  return (
    <span className={styles.valueWithNote}>
      {value}
      {note && <span className={styles.note}>{note}</span>}
    </span>
  )
}

export type AdminLoadTestProps = {
  /** 볼 사전예약 상품. 없으면 모든 상품을 합친 값 */
  productId?: string
  /** 대기열 표에 이름을 붙인다(대기열 현황엔 id만 온다) */
  productNames: ReadonlyMap<string, string>
  /** 전체 보기의 상품 행을 누르면 그 상품으로 들어간다 */
  onSelectProduct: (productId: string) => void
}

/**
 * 부하 검증(개발자용). 부하는 k6 같은 도구가 만들고, 이 화면은 그동안 대기열 → 예약 처리
 * → 외부 등록 중 어디가 막히는지 본다. [시험 시작]을 누른 때를 기준으로 실패·접수를
 * 세고, 받은 값은 브라우저에 쌓아 그린다(새로고침하면 사라진다). 조작은 대기열 관리·Mock
 * 설정에서 한다.
 */
export function AdminLoadTest({
  productId,
  productNames,
  onSelectProduct,
}: AdminLoadTestProps) {
  const [refreshInterval, setRefreshInterval] =
    useState<RefreshInterval>(DEFAULT_INTERVAL)
  const queue = useWaitingroomStatus(refreshInterval)
  const stats = useReservationStats(productId, refreshInterval)
  // 부하 중엔 자동 재시도 중인 실패까지 봐야 무엇 때문에 실패하는지 일찍 보인다.
  const errors = useSyncJobErrorGroups(refreshInterval, 'failing')
  const mock = useMockConfig()

  const [waitingHistory, setWaitingHistory] = useState<Sample<number>[]>([])
  const [statsHistory, setStatsHistory] = useState<
    Sample<{ received: number; processed: number; backlog: number }>[]
  >([])
  const [test, setTest] = useState<TestRun | null>(null)

  // 새 응답이 오면 그 자리에서 표본을 쌓는다(렌더 중 갱신 — 같은 응답이면 건너뛴다).
  // 시험 중엔 시작 전에 받아 둔 응답을 넣지 않는다 — 넣으면 첫 구간이 시험 밖까지 걸쳐 속도가 틀어진다.
  const inTest = (at: number) => !test || at >= test.startedAt
  if (
    queue.data &&
    inTest(queue.dataUpdatedAt) &&
    queue.dataUpdatedAt !== waitingHistory.at(-1)?.at
  ) {
    setWaitingHistory((prev) =>
      appendSample(prev, {
        at: queue.dataUpdatedAt,
        value: queue.data.products
          .filter((p) => !productId || p.productId === productId)
          .reduce((total, p) => total + p.waiting, 0),
      }),
    )
  }
  if (
    stats.data &&
    inTest(stats.dataUpdatedAt) &&
    stats.dataUpdatedAt !== statsHistory.at(-1)?.at
  ) {
    const { preorders } = stats.data
    // 접수는 모든 상태의 합, 처리는 외부 등록을 기다리지 않는 것 — 둘의 차이가 적체다.
    const received = sum(preorders)
    setStatsHistory((prev) =>
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
    statsHistory.map(({ at, value }) => ({ at, value: value[key] }))
  const receivedRates = ratePerSecond(pick('received'))
  const processedRates = ratePerSecond(pick('processed'))
  const backlogSlope = slopePerSecond(pick('backlog')).at(-1)?.value
  const waitingSlope = slopePerSecond(waitingHistory).at(-1)?.value

  const q = queue.data
  // 고른 상품이 대기열에 없으면(오픈 전·정리됨) undefined다.
  const queueProduct = productId
    ? q?.products.find((it) => it.productId === productId)
    : undefined
  const s = stats.data
  const braking = isBraking(q?.brakeFactor ?? null)
  const failures = errors.data ?? []
  const topErrorCode =
    failures.toSorted((a, b) => b.count - a.count)[0]?.errorCode ?? null

  // 재처리로 줄면 늘어난 게 없는 것이다.
  const sinceStart = (now: number | undefined, base: number | undefined) =>
    now === undefined || base === undefined ? null : Math.max(0, now - base)
  const newReceived = sinceStart(s && sum(s.preorders), test?.baseline.received)
  const newRegisterFailures = sinceStart(
    s?.syncJobs.REGISTER.DEAD_LETTER,
    test?.baseline.registerFailures,
  )
  const newEventFailures = sinceStart(
    s?.deadLetters.waiting,
    test?.baseline.eventFailures,
  )

  const verdict = diagnose({
    braking,
    backlogPerMinute: backlogSlope === undefined ? null : backlogSlope * 60,
    newRegisterFailures,
    newEventFailures,
    topErrorCode,
  })

  const refresh = () => {
    void queue.refetch()
    void stats.refetch()
    void errors.refetch()
    void mock.refetch()
  }

  const startTest = () => {
    if (!s) return
    setWaitingHistory([])
    setStatsHistory([])
    setTest({
      startedAt: Date.now(),
      endedAt: null,
      baseline: {
        received: sum(s.preorders),
        registerFailures: s.syncJobs.REGISTER.DEAD_LETTER,
        eventFailures: s.deadLetters.waiting,
      },
    })
    // 시작 뒤 첫 표본을 다음 자동 갱신까지 기다리지 않고 바로 받는다.
    refresh()
  }
  const endTest = () =>
    setTest((prev) => prev && { ...prev, endedAt: Date.now() })

  // 시험 구간을 Grafana에서 그대로 이어 본다.
  const grafanaUrl = test
    ? `${GRAFANA_BASE}&from=${test.startedAt}&to=${test.endedAt ?? 'now'}`
    : `${GRAFANA_BASE}&from=now-1h&to=now&refresh=10s`
  const running = test !== null && test.endedAt === null

  // 목(MSW)으로 띄웠을 때만 시험 중에 가짜 예약이 들어온다 — 목 예약은 원래 고정이라 그래프가
  // 0에 붙는다. 실서버면 아무것도 하지 않는다. 화면을 나가면 멈춘다.
  useEffect(() => {
    void setMockLoad(running)
    return () => void setMockLoad(false)
  }, [running])

  return (
    <div className={styles.root}>
      <RefreshStatus
        updatedAt={Math.max(queue.dataUpdatedAt, stats.dataUpdatedAt)}
        onRefresh={refresh}
        note={
          test
            ? `시험 ${formatTime(test.startedAt)} ~ ${test.endedAt ? formatTime(test.endedAt) : '진행 중'}`
            : '시험 전 — [시험 시작]을 누르면 그때부터 셉니다'
        }
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
        {running ? (
          <Button
            size="small"
            variant="outline"
            color="cancel"
            onClick={endTest}
          >
            시험 종료
          </Button>
        ) : (
          <Button size="small" disabled={!s} onClick={startTest}>
            {test ? '새 시험 시작' : '시험 시작'}
          </Button>
        )}
        <a
          className={styles.externalLink}
          href={grafanaUrl}
          target="_blank"
          rel="noreferrer"
        >
          {test ? '이 시험 구간을 Grafana에서 보기' : 'Grafana 열기'}
        </a>
      </RefreshStatus>

      <InlineAlert status={verdict.status} icon={verdictIcon[verdict.status]}>
        {verdict.message}
      </InlineAlert>

      <FormSection
        title="예약 처리"
        description="접수와 외부 등록 처리를 같은 축에 그립니다. 두 선 사이가 벌어지면 그만큼 처리 중 적체가 쌓입니다. 집계는 서버가 5초까지 캐시해 최근 30초 평균으로 계산합니다."
      >
        {pollingError(stats) !== null && (
          <InlineAlert status={s ? 'warning' : 'error'}>
            {getErrorMessage(
              pollingError(stats),
              '예약 집계를 불러오지 못했습니다.',
            )}
          </InlineAlert>
        )}
        <div className={styles.card}>
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
        </div>
        <div className={styles.cards}>
          <StatCard
            label="처리 중 적체"
            muted={!s}
            loading={stats.isPending}
            value={
              <ValueWithNote
                value={s ? `${formatNumber(s.preorders.PENDING_SYNC)}건` : '—'}
                note={perMinuteNote(backlogSlope, '건')}
              />
            }
          />
          <StatCard
            label="가장 오래 처리 중"
            muted={!s}
            loading={stats.isPending}
            value={s ? ageOf(s.oldestPendingSyncAt, stats.dataUpdatedAt) : '—'}
          />
          <StatCard
            label="외부 등록 실패"
            muted={!s}
            loading={stats.isPending}
            value={
              <ValueWithNote
                value={
                  s ? `${formatNumber(s.syncJobs.REGISTER.DEAD_LETTER)}건` : '—'
                }
                note={
                  newRegisterFailures === null
                    ? undefined
                    : `시험 시작 뒤 +${formatNumber(newRegisterFailures)}건`
                }
              />
            }
          />
          <StatCard
            label="상태 반영 실패"
            muted={!s}
            loading={stats.isPending}
            value={
              <ValueWithNote
                value={s ? `${formatNumber(s.deadLetters.waiting)}건` : '—'}
                note={
                  newEventFailures === null
                    ? undefined
                    : `시험 시작 뒤 +${formatNumber(newEventFailures)}건`
                }
              />
            }
          />
          {newReceived !== null && (
            <StatCard
              label="시험 시작 뒤 접수"
              value={`${formatNumber(newReceived)}건`}
            />
          )}
        </div>

        <div className={styles.subTitle}>
          외부 등록이 실패 중인 작업(오류 코드별)
          {/* 동기화 작업 목록 API에는 상품 조건이 없다. */}
          {productId && ' — 전체 상품 기준'}
        </div>
        {pollingError(errors) !== null && (
          <InlineAlert status="warning">
            {getErrorMessage(
              pollingError(errors),
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
        {pollingError(queue) !== null && (
          <InlineAlert status={q ? 'warning' : 'error'}>
            {getErrorMessage(
              pollingError(queue),
              '대기열 현황을 불러오지 못했습니다.',
            )}
          </InlineAlert>
        )}
        {q?.snapshotStale && (
          <InlineAlert status="warning">
            대기열 현황이 {q.snapshotAgeSeconds ?? '?'}초째 갱신되지 않았습니다.
          </InlineAlert>
        )}
        <div className={styles.cards}>
          <StatCard
            label={productId ? '대기 인원' : '총 대기 인원'}
            muted={!q}
            loading={queue.isPending}
            value={
              <ValueWithNote
                value={
                  q
                    ? `${formatNumber(waitingHistory.at(-1)?.value ?? 0)}명`
                    : '—'
                }
                note={perMinuteNote(waitingSlope, '명')}
              />
            }
          />
          <StatCard
            label="실제 입장 속도"
            muted={!q || (productId !== undefined && !queueProduct)}
            loading={queue.isPending}
            value={
              productId ? (
                queueProduct ? (
                  <ValueWithNote
                    value={`${formatNumber(queueProduct.credit)}명/초`}
                    note={`상한 ${formatNumber(queueProduct.cap)}명/초`}
                  />
                ) : (
                  '대기열에 없음'
                )
              ) : q?.globalCredit != null ? (
                `${formatNumber(q.globalCredit)}명/초`
              ) : (
                '—'
              )
            }
          />
          <StatCard
            label="브레이크 배율(전체)"
            muted={!q}
            loading={queue.isPending}
            value={
              <ValueWithNote
                value={q?.brakeFactor != null ? String(q.brakeFactor) : '—'}
                note={braking ? '입장을 줄이는 중' : '1이면 정상'}
              />
            }
          />
          <StatCard
            label="대기열 서버"
            muted={!q}
            loading={queue.isPending}
            value={q?.gateways != null ? `${formatNumber(q.gateways)}대` : '—'}
          />
        </div>

        {/* 전체 보기에서는 어느 상품이 막혔는지 비교하게 상품별로 나눠 보인다. */}
        {!productId && (
          <Table
            columns={queueColumns(productNames)}
            // 대기가 많은 상품이 막힌 상품이라 위로 올린다.
            rows={(q?.products ?? []).toSorted((a, b) => b.waiting - a.waiting)}
            rowKey={(product) => product.productId}
            onRowClick={(product) => onSelectProduct(product.productId)}
            rowAction={{
              label: (product) =>
                `${productNames.get(product.productId) ?? product.productId} 부하 보기`,
              onClick: (product) => onSelectProduct(product.productId),
            }}
            loading={queue.isPending}
            loadingRows={2}
            emptyMessage="대기열에 오른 상품이 없습니다."
          />
        )}
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
            <SkeletonGroup>
              <Skeleton width="60%" height={20} />
            </SkeletonGroup>
          )}
        </div>
      </FormSection>
    </div>
  )
}

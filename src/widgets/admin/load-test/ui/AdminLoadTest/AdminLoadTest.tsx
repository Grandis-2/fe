import { useEffect, useState, type ReactNode } from 'react'

import { Check, CircleDot, Square, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'

import {
  errorCodeMeaning,
  useReservationStats,
  useReservationStatsHistory,
  useSyncJobErrorGroups,
} from '@entities/admin-reservation'
import {
  isBraking,
  useWaitingroomStatus,
  useWaitingroomStatusHistory,
  type WaitingroomStatus,
} from '@entities/admin-waitingroom'
import {
  mockFailureModeLabel,
  useExternalLedgerHasRows,
  useMockConfig,
  useUpdateMockConfig,
} from '@entities/external-reservation'
import { getErrorMessage } from '@shared/api/client'
import { setMockLoad } from '@shared/api/mock'
import { pollingError } from '@shared/api/queryPolicy'
import type { RefreshInterval } from '@shared/config/refreshInterval'
import {
  ADMIN_DEAD_LETTERS_PATH,
  ADMIN_MOCK_SETTINGS_PATH,
  ADMIN_RECONCILIATION_PATH,
  ADMIN_WAITINGROOM_PATH,
  adminReservationsPath,
} from '@shared/config/routes'
import { srOnly } from '@shared/config/theme'
import {
  formatDotDateTime,
  formatShortDateTime,
} from '@shared/lib/formatDotDate'
import { formatNumber } from '@shared/lib/formatNumber'
import { ratePerSecond, slopePerSecond } from '@shared/lib/samples'
import {
  Button,
  ButtonLink,
  Chip,
  CopyButton,
  DescriptionList,
  InlineAlert,
  NoticeBanner,
  PageHeader,
  Panel,
  RefreshStatus,
  SegmentedTabs,
  StatCard,
  Table,
  Tag,
  ThroughputChart,
  TrendChart,
} from '@shared/ui'
import type { PageHeaderProps, TableColumn } from '@shared/ui'

import { diagnose, type LoadTestVerdict } from '../../lib/diagnose'
import {
  brakeBands,
  durationLabel,
  recordText,
  summarizeWindow,
  type QueuePoint,
  type RecordedWindow,
  type StatsPoint,
} from '../../lib/recording'
import { useRecording } from '../../lib/useRecording'
import { MOCK_PRESETS, presetOf } from '../../model/mockPresets'

import * as styles from './AdminLoadTest.css'

// 서버 지표(TPS·응답 시간·에러율)는 Grafana가 맡는다 — 여기는 업무 흐름이 버티는지 본다.
const GRAFANA_BASE =
  'https://grafana.grandis-nova.link/?orgId=1&timezone=browser'
// 대시보드처럼 5초마다 받는다. 집계는 서버가 5초까지 캐시해 더 자주 받아도 같다.
const REFRESH_INTERVAL: RefreshInterval = 5_000

const RANGES = [
  { value: '5', label: '5분' },
  { value: '10', label: '10분' },
  { value: '30', label: '30분' },
] as const
type Range = (typeof RANGES)[number]['value']

const bannerTone = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'danger',
} as const satisfies Record<LoadTestVerdict['status'], string>

const resultColor = {
  통과: 'green',
  적체: 'yellow',
  실패: 'red',
  '판단 못 함': 'gray',
} as const satisfies Record<RecordedWindow['result'], string>

type ErrorGroup = { errorCode: string | null; count: number }

const sum = (values: Record<string, number>) =>
  Object.values(values).reduce((total, value) => total + value, 0)

const valueOf = (value: number | null | undefined, unit = '') =>
  value === null || value === undefined
    ? '—'
    : `${formatNumber(Math.round(value))}${unit}`

/** 가장 오래 기다린 접수가 몇 초·분째인지 */
const ageOf = (iso: string | null, now: number) => {
  if (!iso) return null
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (seconds < 60) return `${seconds}초째`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 ${seconds % 60}초째`
  return `${Math.floor(seconds / 3600)}시간째`
}

/** 분당 변화 — 얼마나 빨리 바뀌는지를 숫자로 */
const perMinuteNote = (perSecond: number | undefined, unit: string) => {
  if (perSecond === undefined) return '변화 측정 중'
  const perMinute = Math.round(perSecond * 60)
  if (perMinute === 0) return '변화 없음'
  return `분당 ${perMinute > 0 ? '+' : '−'}${formatNumber(Math.abs(perMinute))}${unit}`
}

/** 대기열 현황을 보는 범위(상품 하나 또는 전체)로 줄인다 */
function queuePointOf(
  at: number,
  status: WaitingroomStatus,
  productId: string | undefined,
): QueuePoint & { cap: number | null } {
  const product = productId
    ? status.products.find((it) => it.productId === productId)
    : undefined
  const brakeFactor = status.brakeFactor
  return {
    at,
    // 대시보드처럼 접수 중인 사전예약만 센다 — 오픈 전·마감 줄이 섞이면 부하가 커 보인다.
    waiting: status.products
      .filter(
        (it) =>
          it.phase === 'OPEN' && (!productId || it.productId === productId),
      )
      .reduce((total, it) => total + it.waiting, 0),
    credit: productId ? (product?.credit ?? 0) : (status.globalCredit ?? 0),
    // 전체 입장은 운영값 × 브레이크라, 브레이크를 걷어 낸 값이 상한이다.
    cap: productId
      ? (product?.cap ?? null)
      : status.globalCredit !== null && brakeFactor
        ? Math.round(status.globalCredit / brakeFactor)
        : null,
    brakeFactor,
    braking: isBraking(brakeFactor),
  }
}

const errorColumns = (total: number): TableColumn<ErrorGroup>[] => [
  {
    key: 'code',
    header: '오류 코드',
    render: (group) => <b>{group.errorCode ?? '—'}</b>,
  },
  {
    key: 'meaning',
    header: '뜻',
    render: (group) =>
      (group.errorCode && errorCodeMeaning[group.errorCode]) ?? '—',
  },
  {
    key: 'count',
    header: '건수',
    align: 'right',
    render: (group) => formatNumber(group.count),
  },
  {
    key: 'share',
    header: '비율',
    width: '30%',
    render: (group) => {
      const share = total ? Math.round((group.count / total) * 100) : 0
      return (
        <span className={styles.shareCell}>
          <span className={styles.shareBar}>
            <span className={styles.shareFill} style={{ width: `${share}%` }} />
          </span>
          {share}%
        </span>
      )
    },
  },
]

export type AdminLoadTestProps = {
  /** 볼 사전예약 상품. 없으면 모든 상품을 합친 값 */
  productId?: string
  /** 페이지 제목 — 마지막 갱신·도구와 같은 줄에 그린다 */
  header: Omit<PageHeaderProps, 'aside' | 'badge'>
  /** 제목 줄 바로 아래 — 볼 상품 고르기 */
  scope?: ReactNode
}

/**
 * 부하 검증(개발자용). 열면 바로 실시간이다 — 부하는 k6 같은 도구가 만들고, 이 화면은 그동안
 * 대기열 → 예약 처리 → 외부 등록 중 어디가 막히는지 본다. 표본은 대시보드와 같이 관리자 화면을
 * 연 뒤부터 쌓인다(새로 고치면 처음부터). [구간 기록]은 선택이다 — 누른 동안의 요약을 남겨
 * 조건별로 비교한다.
 */
export function AdminLoadTest({
  productId,
  header,
  scope,
}: AdminLoadTestProps) {
  const [range, setRange] = useState<Range>('10')
  const rangeMs = Number(range) * 60_000
  const rangeLabel = `최근 ${range}분`

  const queue = useWaitingroomStatus(REFRESH_INTERVAL)
  const stats = useReservationStats(productId, REFRESH_INTERVAL)
  // 부하 중엔 자동 재시도 중인 실패까지 봐야 무엇 때문에 실패하는지 일찍 보인다.
  const errors = useSyncJobErrorGroups(REFRESH_INTERVAL)
  const mock = useMockConfig()
  const updateMock = useUpdateMockConfig()
  // 원장이 비었는지만 본다 — 전체를 받으면 예약 수만큼 요청이 는다.
  const ledger = useExternalLedgerHasRows()
  const recording = useRecording()

  const statsPoints: (StatsPoint & { eventFailures: number })[] =
    useReservationStatsHistory(productId).map(({ at, value }) => {
      const received = sum(value.preorders)
      const registerFailures = value.syncJobs.REGISTER.DEAD_LETTER
      return {
        at,
        received,
        processed: received - value.preorders.PENDING_SYNC,
        // 재처리 필요(DEAD_LETTER)도 원장으로는 PENDING_SYNC지만 처리 중이 아니라 뺀다.
        backlog: Math.max(0, value.preorders.PENDING_SYNC - registerFailures),
        failures: registerFailures + value.deadLetters.waiting,
        eventFailures: value.deadLetters.waiting,
      }
    })
  const queuePoints = useWaitingroomStatusHistory().map(({ at, value }) =>
    queuePointOf(at, value, productId),
  )

  // 범위의 끝은 마지막으로 받은 시각이다 — 렌더마다 흔들리지 않는다.
  const now = Math.max(statsPoints.at(-1)?.at ?? 0, queuePoints.at(-1)?.at ?? 0)
  const from = now - rangeMs
  const shownStats = statsPoints.filter(({ at }) => at >= from)
  const shownQueue = queuePoints.filter(({ at }) => at >= from)

  const pick = (key: 'received' | 'processed' | 'backlog') =>
    shownStats.map(({ at, ...value }) => ({ at, value: value[key] }))
  const receivedRates = ratePerSecond(pick('received'))
  const processedRates = ratePerSecond(pick('processed'))
  const backlogSlope = slopePerSecond(pick('backlog')).at(-1)?.value
  const waitingSlope = slopePerSecond(
    shownQueue.map(({ at, waiting }) => ({ at, value: waiting })),
  ).at(-1)?.value
  // 차트 점 하나마다 그 사이에 새로 생긴 실패 수(rate는 첫 표본이 빠진다).
  const newFailureCounts = shownStats
    .slice(1)
    .map((point, index) =>
      Math.max(0, point.failures - shownStats[index].failures),
    )

  const firstStat = shownStats[0]
  const lastStat = shownStats.at(-1)
  const windowed = shownStats.length >= 2 && firstStat && lastStat
  const newRegisterFailures = windowed
    ? Math.max(
        0,
        lastStat.failures -
          lastStat.eventFailures -
          (firstStat.failures - firstStat.eventFailures),
      )
    : null
  const newEventFailures = windowed
    ? Math.max(0, lastStat.eventFailures - firstStat.eventFailures)
    : null

  const q = queue.data
  const s = stats.data
  const current = q ? queuePointOf(queue.dataUpdatedAt, q, productId) : null
  const failures = errors.data ?? []
  const failureTotal = failures.reduce((total, group) => total + group.count, 0)
  const topErrorCode =
    failures.toSorted((a, b) => b.count - a.count)[0]?.errorCode ?? null
  const receivedNow = receivedRates.at(-1)?.value
  const processedNow = processedRates.at(-1)?.value

  const verdict = diagnose({
    braking: current?.braking ?? false,
    brakeFactor: current?.brakeFactor ?? null,
    backlogPerMinute: backlogSlope === undefined ? null : backlogSlope * 60,
    newRegisterFailures,
    newEventFailures,
    topErrorCode,
    rangeLabel,
  })
  const verdictAction = {
    'register-failures': {
      label: '재처리 필요 보기',
      to: adminReservationsPath('REPROCESS_NEEDED', productId),
    },
    'event-failures': { label: '이벤트 DLQ', to: ADMIN_DEAD_LETTERS_PATH },
    braking: { label: '입장 속도 조절', to: ADMIN_WAITINGROOM_PATH },
    backlog: { label: '입장 속도 조절', to: ADMIN_WAITINGROOM_PATH },
    measuring: null,
    ok: null,
  }[verdict.kind]

  const refresh = () => {
    void queue.refetch()
    void stats.refetch()
    void errors.refetch()
    void mock.refetch()
  }

  const preset = mock.data ? presetOf(mock.data) : undefined
  const active = recording.active
  const grafanaUrlOf = (start: number, end: number | 'now') =>
    `${GRAFANA_BASE}&from=${start}&to=${end}`
  const grafanaUrl = active
    ? grafanaUrlOf(active.startedAt, 'now')
    : `${GRAFANA_BASE}&from=now-${range}m&to=now&refresh=10s`

  const startRecording = () =>
    recording.start({
      // 마지막으로 받은 시각부터 센다(집계가 있어야 누를 수 있어 0이 아니다).
      startedAt: now,
      condition: preset?.label ?? '직접 설정',
      baselineFailures: lastStat?.failures ?? null,
    })
  const finishRecording = () => {
    if (!active) return
    recording.finish(
      summarizeWindow(
        active,
        Math.max(now, active.startedAt),
        statsPoints,
        queuePoints,
      ),
    )
  }

  // 목(MSW)으로 띄웠을 때만 이 화면을 보는 동안 가짜 예약이 들어온다 — 목 예약은 원래 고정이라
  // 그래프가 0에 붙는다. 실서버면 아무것도 하지 않는다. 화면을 나가면 멈춘다.
  useEffect(() => {
    void setMockLoad(true)
    return () => void setMockLoad(false)
  }, [])

  const recordColumns: TableColumn<RecordedWindow>[] = [
    {
      key: 'window',
      header: '구간',
      render: (record) =>
        `${formatShortDateTime(new Date(record.startedAt).toISOString())} · ${durationLabel(record.endedAt - record.startedAt)}`,
    },
    { key: 'condition', header: '조건', render: (record) => record.condition },
    {
      key: 'waiting',
      header: '최대 대기',
      align: 'right',
      render: (record) => valueOf(record.maxWaiting),
    },
    {
      key: 'credit',
      header: '최대 입장/초',
      align: 'right',
      render: (record) => valueOf(record.maxCredit),
    },
    {
      key: 'processed',
      header: '평균 처리/초',
      align: 'right',
      render: (record) => valueOf(record.avgProcessed),
    },
    {
      key: 'backlog',
      header: '최대 적체',
      align: 'right',
      render: (record) => valueOf(record.maxBacklog),
    },
    {
      key: 'failures',
      header: '새 실패',
      align: 'right',
      render: (record) => valueOf(record.newFailures),
    },
    {
      key: 'result',
      header: '판정',
      align: 'center',
      render: (record) => (
        <Tag
          size="small"
          variant="subtle"
          color={resultColor[record.result]}
          widthOptions={Object.keys(resultColor)}
        >
          {record.result}
        </Tag>
      ),
    },
    {
      key: 'copy',
      header: <span className={srOnly}>복사</span>,
      align: 'right',
      render: (record) => (
        <CopyButton
          label="결과"
          showLabel
          value={recordText(
            record,
            grafanaUrlOf(record.startedAt, record.endedAt),
          )}
        />
      ),
    },
  ]

  const checks = [
    {
      key: 'queue',
      ok: !!q && (q.gateways ?? 0) > 0 && !q.snapshotStale,
      label: q
        ? `대기열 서버 ${valueOf(q.gateways, '대')} · ${q.snapshotStale ? `현황 ${q.snapshotAgeSeconds ?? '?'}초째 멈춤` : '현황 최신'}`
        : '대기열 현황을 받지 못했어요',
    },
    {
      key: 'backlog',
      ok: lastStat?.backlog === 0,
      label: `처리 중 적체 ${valueOf(lastStat?.backlog, '건')}`,
    },
    {
      key: 'failures',
      ok: s?.syncJobs.REGISTER.DEAD_LETTER === 0,
      label:
        s?.syncJobs.REGISTER.DEAD_LETTER === 0
          ? '외부 등록 실패 없음'
          : `외부 등록 실패 ${valueOf(s?.syncJobs.REGISTER.DEAD_LETTER, '건')} 남아 있음`,
    },
    {
      key: 'ledger',
      ok: ledger.data === false,
      label: ledger.isError
        ? '외부 원장을 확인하지 못했어요'
        : ledger.data === undefined
          ? '외부 원장 확인 중'
          : ledger.data
            ? '외부 원장에 지난 기록 있음'
            : '외부 원장 비어 있음',
    },
  ]

  return (
    <div className={styles.root}>
      {/* 제목 줄 오른쪽에 마지막 갱신·도구를 둔다(다른 관리자 화면과 같은 자리). */}
      <PageHeader
        {...header}
        // 실시간·기록 중은 제목 바로 옆 — 지금 보는 값이 무엇인지 먼저 읽힌다(시안과 같다).
        badge={
          active ? (
            <span className={styles.recordingBadge}>
              <span className={styles.recordingDot} aria-hidden="true" />
              기록 중 · {durationLabel(Math.max(0, now - active.startedAt))}
            </span>
          ) : (
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} aria-hidden="true" />
              실시간
            </span>
          )
        }
        aside={
          <RefreshStatus
            updatedAt={Math.max(queue.dataUpdatedAt, stats.dataUpdatedAt)}
            onRefresh={refresh}
            note="5초마다"
          >
            <SegmentedTabs items={RANGES} value={range} onChange={setRange} />
            <ButtonLink
              size="small"
              variant="outline"
              color="cancel"
              href={grafanaUrl}
            >
              Grafana ↗
            </ButtonLink>
            {active ? (
              <Button
                size="small"
                variant="outline"
                color="cancel"
                icon={Square}
                onClick={finishRecording}
              >
                기록 끝
              </Button>
            ) : (
              <Button
                size="small"
                variant="outline"
                icon={CircleDot}
                disabled={!s}
                onClick={startRecording}
              >
                구간 기록 시작
              </Button>
            )}
          </RefreshStatus>
        }
      />
      {scope}

      <NoticeBanner
        tone={bannerTone[verdict.status]}
        title={verdict.title}
        description={verdict.description}
        action={
          verdictAction && (
            <ButtonLink size="small" variant="outline" to={verdictAction.to}>
              {verdictAction.label}
            </ButtonLink>
          )
        }
      />

      {[pollingError(stats), pollingError(queue)].some(Boolean) && (
        <InlineAlert status="warning">
          {getErrorMessage(
            pollingError(stats) ?? pollingError(queue),
            '현황을 불러오지 못했습니다. 다시 받는 중이에요.',
          )}
        </InlineAlert>
      )}
      {q?.snapshotStale && (
        <InlineAlert status="warning">
          대기열 현황이 {q.snapshotAgeSeconds ?? '?'}초째 갱신되지 않았습니다.
        </InlineAlert>
      )}

      <div className={styles.kpis}>
        <StatCard
          label="대기 인원"
          loading={queue.isPending}
          muted={!current}
          value={valueOf(current?.waiting, '명')}
          caption={`${perMinuteNote(waitingSlope, '')} · ${range}분 최대 ${valueOf(
            shownQueue.length
              ? Math.max(...shownQueue.map((point) => point.waiting))
              : null,
          )}`}
        />
        <StatCard
          label="입장 허용 속도"
          loading={queue.isPending}
          muted={!current}
          tone={current?.braking ? 'warning' : undefined}
          value={valueOf(current?.credit, '명/초')}
          caption={
            current?.cap != null
              ? `상한 ${formatNumber(current.cap)}${current.braking ? ` × 브레이크 ${current.brakeFactor}` : ''}`
              : '상한 서버 기본값'
          }
        />
        <StatCard
          label="초당 접수 / 외부 등록"
          loading={stats.isPending}
          muted={receivedNow === undefined}
          value={`${valueOf(receivedNow)} / ${valueOf(processedNow, '건')}`}
          caption={
            receivedNow && processedNow !== undefined
              ? `처리율 ${Math.round((processedNow / receivedNow) * 100)}%`
              : '변화 측정 중'
          }
        />
        <StatCard
          label="처리 중 적체"
          loading={stats.isPending}
          muted={!lastStat}
          tone={
            backlogSlope !== undefined && backlogSlope > 0
              ? 'warning'
              : undefined
          }
          value={valueOf(lastStat?.backlog, '건')}
          caption={
            s && lastStat?.backlog
              ? `가장 오래 ${ageOf(s.oldestPendingSyncAt, stats.dataUpdatedAt) ?? '—'}`
              : perMinuteNote(backlogSlope, '건')
          }
        />
        <StatCard
          label={`${rangeLabel} 새 실패`}
          loading={stats.isPending}
          muted={newRegisterFailures === null}
          tone={
            (newRegisterFailures ?? 0) + (newEventFailures ?? 0) > 0
              ? 'danger'
              : undefined
          }
          value={
            newRegisterFailures === null
              ? '—'
              : `+${formatNumber(newRegisterFailures + (newEventFailures ?? 0))}건`
          }
          caption={
            newRegisterFailures === null
              ? '변화 측정 중'
              : `외부 등록 ${formatNumber(newRegisterFailures)} · 상태 반영 ${formatNumber(newEventFailures ?? 0)}`
          }
        />
      </div>

      <div className={styles.chartPair}>
        <Panel
          title="대기 인원 — 접수 중인 사전예약에 줄 선 사람"
          aside={<>{rangeLabel} · 5초마다 한 점</>}
        >
          <span className={styles.miniValue}>
            {valueOf(current?.waiting, '명')}
          </span>
          <TrendChart
            times={shownQueue.map(({ at }) => at)}
            values={shownQueue.map(({ waiting }) => waiting)}
            unit="명"
            label="대기 인원"
          />
        </Panel>
        <Panel
          title="입장 허용 속도 — 초당 들여보내도 되는 인원"
          aside={<>{rangeLabel} · 브레이크 반영</>}
        >
          <span className={styles.miniValue}>
            {valueOf(current?.credit, '명/초')}
          </span>
          <TrendChart
            times={shownQueue.map(({ at }) => at)}
            values={shownQueue.map(({ credit }) => credit)}
            unit="명"
            label="입장 허용 속도(초당)"
            tone="warning"
            reference={
              current?.cap != null
                ? {
                    value: current.cap,
                    label: `상한 ${formatNumber(current.cap)}명`,
                  }
                : undefined
            }
            bands={brakeBands(shownQueue)}
          />
          {/* 서버가 정한 허용량이다 — 실제로 들어간 수는 서버가 주지 않는다. */}
          <span className={styles.caption}>
            실제로 들어간 수가 아니라 서버가 정한 허용량이에요. 줄이 짧으면 실제
            입장은 이보다 적어요.
          </span>
        </Panel>
      </div>

      <Panel
        title="예약 처리 — 접수와 외부 등록"
        aside={<>두 선이 벌어진 만큼 처리 중 적체가 쌓여요</>}
      >
        <ThroughputChart
          label="초당 접수와 외부 등록 처리"
          unit="건"
          times={receivedRates.map(({ at }) => at)}
          series={[
            {
              label: '초당 접수',
              values: receivedRates.map(({ value }) => value),
            },
            {
              label: '초당 외부 등록 처리',
              values: processedRates.map(({ value }) => value),
            },
          ]}
          incidents={{ label: '새 실패', counts: newFailureCounts }}
        />
      </Panel>

      <div className={styles.row}>
        <Panel
          className={styles.wideCard}
          title="외부 등록 실패 원인"
          aside={
            <>
              {/* 동기화 작업 목록 API에는 상품 조건이 없다. */}
              {productId ? '전체 상품 기준 · ' : ''}자동 재시도 중 포함
            </>
          }
        >
          {pollingError(errors) !== null && (
            <InlineAlert status="warning">
              {getErrorMessage(
                pollingError(errors),
                '오류 코드별 수를 불러오지 못했습니다.',
              )}
            </InlineAlert>
          )}
          <div className={styles.errorTable}>
            <Table
              columns={errorColumns(failureTotal)}
              rows={failures.toSorted((a, b) => b.count - a.count)}
              rowKey={(group) => group.errorCode ?? 'none'}
              loading={errors.isPending}
              loadingRows={3}
              emptyMessage="실패 중인 작업이 없습니다."
            />
          </div>
          <span className={styles.caption}>
            재시도로 풀리는 것도 섞여 있어요. 끝내 실패한 건은 예약 현황에서
            재처리해요.
          </span>
        </Panel>

        <Panel
          className={styles.sideCard}
          title="시험 조건 · 외부 Mock"
          aside={
            <Link className={styles.link} to={ADMIN_MOCK_SETTINGS_PATH}>
              Mock 설정
            </Link>
          }
        >
          <div
            className={styles.chips}
            role="group"
            aria-label="조건 빨리 바꾸기"
          >
            {MOCK_PRESETS.map((item) => (
              <Chip
                key={item.key}
                variant="solid"
                selected={preset?.key === item.key}
                aria-pressed={preset?.key === item.key}
                disabled={!mock.data || updateMock.isPending}
                onClick={() => updateMock.mutate(item.update)}
              >
                {item.label}
              </Chip>
            ))}
          </div>
          {updateMock.isError && (
            <InlineAlert status="error">
              {getErrorMessage(updateMock.error, '조건을 바꾸지 못했습니다.')}
            </InlineAlert>
          )}
          {mock.isError ? (
            <InlineAlert status="warning">
              {getErrorMessage(mock.error, 'Mock 설정을 불러오지 못했습니다.')}
            </InlineAlert>
          ) : (
            mock.data && (
              <DescriptionList
                items={[
                  {
                    label: '등록 지연',
                    value: `평균 ${formatNumber(mock.data.registerLatencyMs)}ms (±${Math.round(mock.data.latencyJitter * 100)}%)${
                      mock.data.latencyTailRate > 0
                        ? ` · 꼬리 ${Math.round(mock.data.latencyTailRate * 100)}% ${formatNumber(mock.data.latencyTailMinMs)}~${formatNumber(mock.data.latencyTailMaxMs)}ms`
                        : ''
                    }`,
                  },
                  {
                    label: '실패',
                    value: `${Math.round(mock.data.failureRate * 1000) / 10}% · ${mockFailureModeLabel[mock.data.failureMode]}`,
                  },
                  {
                    label: '워커 타임아웃',
                    value: `${formatNumber(mock.data.workerReadTimeoutMs)}ms`,
                  },
                  {
                    label: '적용',
                    value: `${formatDotDateTime(mock.data.appliedAt)} · 설정 #${mock.data.configVersion}`,
                  },
                ]}
              />
            )
          )}
        </Panel>
      </div>

      <Panel
        title="부하 넣기 전 점검"
        aside={<>깨끗한 상태에서 시작하면 숫자가 섞이지 않아요</>}
      >
        <ul className={styles.checks}>
          {checks.map((check) => (
            <li key={check.key} className={styles.check}>
              <span
                className={check.ok ? styles.checkOk : styles.checkNo}
                aria-hidden="true"
              >
                {check.ok ? <Check size={12} /> : <TriangleAlert size={12} />}
              </span>
              {check.label}
            </li>
          ))}
        </ul>
        <div className={styles.chips}>
          {/* 초기화는 확인 글자를 받는 Mock 설정에서 한다 — 여기서 한 번에 지우지 않는다. */}
          <ButtonLink
            size="small"
            variant="outline"
            color="cancel"
            to={ADMIN_MOCK_SETTINGS_PATH}
          >
            외부 원장 초기화
          </ButtonLink>
          <ButtonLink
            size="small"
            variant="outline"
            color="cancel"
            to={ADMIN_RECONCILIATION_PATH}
          >
            외부 예약 대조
          </ButtonLink>
          <ButtonLink
            size="small"
            variant="outline"
            color="cancel"
            to={adminReservationsPath('REPROCESS_NEEDED', productId)}
          >
            재처리 필요 보기
          </ButtonLink>
        </div>
      </Panel>

      <Panel
        title="기록한 구간"
        aside={
          <>[구간 기록 시작]~[기록 끝]을 누른 구간 · 이 브라우저에만 남아요</>
        }
      >
        <Table
          columns={recordColumns}
          rows={recording.records}
          rowKey={(record) => String(record.startedAt)}
          emptyMessage="아직 기록한 구간이 없어요. 부하를 넣기 전에 [구간 기록 시작]을 누르세요."
        />
      </Panel>
    </div>
  )
}

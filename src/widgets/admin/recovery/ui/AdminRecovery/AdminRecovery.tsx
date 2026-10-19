import { useState, useSyncExternalStore } from 'react'

import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'

import {
  syncErrorCause,
  useReprocessByErrorCodes,
  useReservationStats,
  useReservationStatsHistory,
  useSyncJobErrorGroups,
} from '@entities/admin-reservation'
import {
  OpenPreorderStrip,
  useOpenPreorders,
} from '@features/open-preorder-picker'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import { adminReservationsPath } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { slopePerSecond } from '@shared/lib/samples'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Checkbox,
  InlineAlert,
  RefreshStatus,
  Skeleton,
  SkeletonGroup,
  ThroughputChart,
} from '@shared/ui'

import { recoveryStatus, type RecoveryStatus } from '../../lib/recoveryStatus'
import { sentRunStore } from '../../model/sentRun'

import * as styles from './AdminRecovery.css'

// 조치 뒤 실패가 줄어드는지 바로 봐야 해서 대시보드와 같은 하한(5초, 서버 캐시 주기)으로 받는다.
const POLL_INTERVAL_MS = 5_000
/** 서버가 한 번에 받는 최대 건수(원인마다) */
const BATCH_MAX = 1000
/**
 * 서버가 다시 보내는 속도(명세 기본값). 보내기 전 예상 시간을 어림하는 데만 쓰고 요청엔
 * 싣지 않는다 — 보낸 뒤엔 서버가 준 예상 시간을 쓴다.
 */
const SERVER_RATE_PER_SECOND = 20
/**
 * 사전예약별로 다시 보내기를 서버가 받는지. 다시 보내기 API에 상품 조건(productId)이 생기면
 * true로 바꾸고 send에서 productId를 함께 보낸다(백엔드 요청서 R4). 그 전엔 고른 채로 보내면
 * 모든 사전예약의 실패가 나가므로 버튼을 막아 둔다.
 */
const PRODUCT_SEND_READY = false
/** 실패가 늘고 있는지 볼 구간 */
const RISING_WINDOW_MS = 60_000

const statusIcon: Record<RecoveryStatus['tone'], typeof Info> = {
  success: CircleCheck,
  info: Info,
  warning: TriangleAlert,
}

export type AdminRecoveryProps = {
  /** 상품 id → 이름. 대기열 응답엔 id만 있다 */
  productNames: ReadonlyMap<string, string>
  /** 볼 사전예약. null이면 전체 */
  selected: string | null
  onSelect: (productId: string | null) => void
}

/**
 * 외부 등록 장애 대응. 자동 재시도를 다 쓰고 멈춘(재처리 필요) 예약을 원인별로 골라 한 번에
 * 다시 보내고, 실패가 줄어드는지 본다. 맨 위 한 줄이 지금 상태와 다음 행동을 말한다.
 * 사전예약을 고르면 상태·회복 확인이 그 사전예약 기준이 되지만, 원인 묶음과 다시 보내기는
 * API에 상품 조건이 없어 전체 기준이다(백엔드 요청서 R4) — 고른 채로는 보내지 않는다.
 * 서버가 집계한 값만 보인다 — 다시 보낸 뒤의 성공을 미리 지어내지 않는다.
 */
export function AdminRecovery({
  productNames,
  selected: requested,
  onSelect,
}: AdminRecoveryProps) {
  const stats = useReservationStats(undefined, POLL_INTERVAL_MS)
  const errors = useSyncJobErrorGroups(POLL_INTERVAL_MS)
  const reprocess = useReprocessByErrorCodes()
  const { openProducts, items, nameOf, statsOf, queue } = useOpenPreorders(
    productNames,
    POLL_INTERVAL_MS,
  )
  const sent = useSyncExternalStore(sentRunStore.subscribe, sentRunStore.get)

  // 고른 사전예약이 마감돼 띠에서 빠지면 전체로 본다.
  const selected = openProducts.some(
    (product) => product.productId === requested,
  )
    ? requested
    : null
  const scopeKey = selected ?? 'all'
  const scopeStats = selected ? statsOf(selected) : stats.data
  const failures = scopeStats?.syncJobs.REGISTER.DEAD_LETTER

  // 관리자가 직접 켜고 끈 원인만 기억한다. 손대지 않은 원인은 다시 보내면 풀릴 수 있는
  // 것(일시 장애)만 기본으로 골라진다 — 거절된 건을 같이 보내 외부 시스템을 두드리지 않게.
  const [choices, setChoices] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  )
  const groups = (errors.data ?? [])
    .flatMap(({ errorCode, count }) =>
      errorCode === null
        ? []
        : [{ errorCode, count, cause: syncErrorCause(errorCode) }],
    )
    .toSorted((a, b) => b.count - a.count)
  const isPicked = (group: (typeof groups)[number]) =>
    choices.get(group.errorCode) ?? group.cause.transient
  const picked = groups.filter(isPicked)
  const pickedCount = picked.reduce((total, group) => total + group.count, 0)
  // 서버는 원인마다 1000건까지만 받는다 — 예상 시간은 실제로 보낼 수 있는 만큼으로 잰다.
  const sendableCount = picked.reduce(
    (total, group) => total + Math.min(group.count, BATCH_MAX),
    0,
  )
  const estimateSeconds = Math.ceil(sendableCount / SERVER_RATE_PER_SECOND)

  // 실패 추이 — 관리자 화면을 연 뒤 받은 집계(다른 화면에 다녀와도 이어진다).
  const history = useReservationStatsHistory(selected ?? undefined).map(
    ({ at, value }) => ({ at, value: value.syncJobs.REGISTER.DEAD_LETTER }),
  )
  const slope = slopePerSecond(history, RISING_WINDOW_MS).at(-1)?.value
  const rising = slope === undefined ? null : slope * 60 >= 1
  // 판정 기준 시각 — 받은 집계의 시각이라 렌더마다 흔들리지 않는다.
  const now = stats.dataUpdatedAt
  const failuresAtSend = sent?.failuresAtSend[scopeKey]

  const status = recoveryStatus({
    failures,
    rising,
    sent,
    failuresAtSend,
    now,
    scope: selected ? nameOf(selected) : undefined,
  })

  const send = () => {
    // 보낼 때의 실패 수를 범위마다 남겨, 어느 사전예약을 보든 회복을 비교할 수 있게 한다.
    const atSend: Record<string, number> = {
      all: stats.data?.syncJobs.REGISTER.DEAD_LETTER ?? 0,
    }
    for (const product of openProducts) {
      const count = statsOf(product.productId)?.syncJobs.REGISTER.DEAD_LETTER
      if (count !== undefined) atSend[product.productId] = count
    }
    reprocess.reset()
    reprocess.mutate(
      picked.map((group) => group.errorCode),
      {
        onSuccess: (results) =>
          sentRunStore.set({
            at: Date.now(),
            targetCount: results.reduce((t, r) => t + r.targetCount, 0),
            skippedCount: results.reduce((t, r) => t + r.skippedCount, 0),
            // 원인끼리 차례로 보내므로 합이 전체 소요 시간이다.
            estimatedSeconds: results.reduce(
              (t, r) => t + r.estimatedSeconds,
              0,
            ),
            capped: results.some((r) => r.targetCount >= BATCH_MAX),
            failuresAtSend: atSend,
          }),
      },
    )
  }

  const confirmSend = () =>
    openModal({
      theme: 'light',
      title: `${formatNumber(pickedCount)}건을 다시 보낼까요?`,
      description: [
        `모든 사전예약의 고른 원인을 외부 예약 시스템에 다시 등록해요. 한꺼번에 몰리지 않게 약 ${formatNumber(estimateSeconds)}초에 걸쳐 나눠 보내요.`,
        rising &&
          '실패가 아직 늘고 있어요 — 외부 시스템이 회복되지 않았다면 또 실패할 수 있어요.',
      ]
        .filter(Boolean)
        .join(' '),
      confirmLabel: '다시 보내기',
      onConfirm: () => {
        closeModal()
        send()
      },
    })

  const refresh = () => {
    void stats.refetch()
    void errors.refetch()
    void queue.refetch()
  }

  // 회복 확인 — 보낸 시각부터 예상 완료까지 얼마나 왔나(5초마다 오르는 집계 시각 기준).
  const progress = sent
    ? Math.min(
        1,
        Math.max(0, (now - sent.at) / (sent.estimatedSeconds * 1000 || 1)),
      )
    : 0
  const decreased =
    failuresAtSend !== undefined && failures !== undefined
      ? failuresAtSend - failures
      : null

  return (
    <div className={styles.root}>
      <RefreshStatus
        updatedAt={stats.dataUpdatedAt}
        onRefresh={refresh}
        note="5초마다 자동 갱신"
      />

      <section className={styles.section} aria-labelledby="recovery-open">
        <h2 id="recovery-open" className={styles.sectionTitle}>
          진행 중인 사전예약
        </h2>
        {queue.isPending ? (
          <Skeleton height={96} />
        ) : (
          <OpenPreorderStrip
            items={items}
            selected={selected}
            onSelect={onSelect}
            now={queue.dataUpdatedAt}
            allowAll
          />
        )}
      </section>

      {/* 단계 표시 대신 — 지금 상태와 다음 행동을 한 줄로. role로 바뀔 때 읽어 준다. */}
      <InlineAlert status={status.tone} icon={statusIcon[status.tone]}>
        {status.message}
      </InlineAlert>

      <section className={styles.section} aria-labelledby="recovery-send">
        <h2 id="recovery-send" className={styles.sectionTitle}>
          다시 보내기
        </h2>
        <div className={styles.card}>
          <div className={styles.sendHeader}>
            <div className={styles.sendSummary}>
              <span className={styles.sendCount}>
                {selected
                  ? `${nameOf(selected)} 실패 ${failures === undefined ? '—' : formatNumber(failures)}건`
                  : `보낼 실패 ${formatNumber(pickedCount)}건`}
              </span>
              <span className={styles.caption}>
                {selected && !PRODUCT_SEND_READY
                  ? '사전예약별로 보내기는 서버 준비 후 열려요 · 지금은 전체에서 보낼 수 있어요'
                  : pickedCount > 0
                    ? `약 ${formatNumber(estimateSeconds)}초에 나눠 보내요 · 누른 순간의 실패만 보내요`
                    : '보낼 원인을 골라 주세요'}
              </span>
            </div>
            {selected && !PRODUCT_SEND_READY ? (
              // 사전예약별 보내기 자리 — 서버가 상품 조건을 받기 전엔 막고, 전체로 가는 길을 둔다.
              <div className={styles.sendActions}>
                <Button
                  size="small"
                  variant="subtle"
                  onClick={() => onSelect(null)}
                >
                  전체에서 보내기
                </Button>
                <Button size="small" disabled>
                  {nameOf(selected)} 다시 보내기
                </Button>
              </div>
            ) : (
              <Button
                size="small"
                disabled={pickedCount === 0 || reprocess.isPending}
                onClick={confirmSend}
              >
                {reprocess.isPending
                  ? '보내는 중…'
                  : `${formatNumber(pickedCount)}건 다시 보내기`}
              </Button>
            )}
          </div>
          {selected && !PRODUCT_SEND_READY && (
            <div className={styles.scopeNote}>
              아래 원인별 건수는 모든 사전예약을 합친 값이에요. 사전예약별
              원인은 서버 준비 후 보여요.
            </div>
          )}
          {pollingError(errors) !== null && (
            <InlineAlert status={errors.data ? 'warning' : 'error'}>
              {getErrorMessage(
                pollingError(errors),
                '원인별 건수를 불러오지 못했어요.',
              )}
            </InlineAlert>
          )}
          {reprocess.isError && (
            <InlineAlert status="error">
              {getErrorMessage(reprocess.error, '다시 보내지 못했어요.')}
            </InlineAlert>
          )}
          {errors.isPending ? (
            <SkeletonGroup className={styles.list}>
              {[0, 1].map((row) => (
                <Skeleton key={row} height={56} />
              ))}
            </SkeletonGroup>
          ) : (
            groups.length > 0 && (
              <div className={styles.list}>
                {groups.map((group) => {
                  const checked = isPicked(group)
                  return (
                    <div
                      key={group.errorCode}
                      className={[styles.cause, checked && styles.causePicked]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <label className={styles.causeLabelRow}>
                        <Checkbox
                          checked={checked}
                          onChange={(event) =>
                            setChoices((prev) =>
                              new Map(prev).set(
                                group.errorCode,
                                event.target.checked,
                              ),
                            )
                          }
                        />
                        <span className={styles.causeText}>
                          <span className={styles.causeLabel}>
                            {group.cause.label}
                          </span>
                          {/* 개발팀에 알릴 때 쓰는 원래 코드 */}
                          <span className={styles.causeCode}>
                            {group.errorCode}
                          </span>
                        </span>
                        <span className={styles.causeCount}>
                          {formatNumber(group.count)}건
                        </span>
                      </label>
                      {!group.cause.transient && (
                        <span className={styles.causeHintWarn}>
                          보내도 같은 결과예요 ·{' '}
                          <Link
                            className={styles.link}
                            to={adminReservationsPath('REPROCESS_NEEDED')}
                          >
                            한 건씩 보기
                          </Link>
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="recovery-watch">
        <div className={styles.sectionHeader}>
          <h2 id="recovery-watch" className={styles.sectionTitle}>
            회복 확인
          </h2>
          <span className={styles.caption}>관리자 화면을 연 뒤부터</span>
        </div>
        <div className={styles.card}>
          {pollingError(stats) !== null && (
            <InlineAlert status={stats.data ? 'warning' : 'error'}>
              {getErrorMessage(
                pollingError(stats),
                '실패 건수를 불러오지 못했어요.',
              )}
              {stats.data && ' 아래 숫자는 마지막으로 받은 값이에요.'}
            </InlineAlert>
          )}
          {/* 결과를 먼저 — 보냈으면 보낼 때와 지금, 아니면 지금 실패 수. */}
          <div className={styles.result}>
            {failuresAtSend !== undefined && failures !== undefined ? (
              <>
                <span className={styles.resultValue}>
                  실패 {formatNumber(failuresAtSend)} → {formatNumber(failures)}
                  건
                </span>
                {decreased !== null && decreased !== 0 && (
                  <span
                    className={
                      decreased > 0 ? styles.resultDown : styles.resultUp
                    }
                  >
                    {decreased > 0
                      ? `${formatNumber(decreased)}건 줄었어요`
                      : `${formatNumber(-decreased)}건 늘었어요`}
                  </span>
                )}
              </>
            ) : (
              <span className={styles.resultValue}>
                지금 실패{' '}
                {failures === undefined ? '—' : `${formatNumber(failures)}건`}
              </span>
            )}
          </div>
          {sent && (
            <div className={styles.progress}>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label="다시 보내기 진행"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
              >
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className={styles.caption}>
                전체 {formatNumber(sent.targetCount)}건 보냄
                {sent.skippedCount > 0 &&
                  ` · 조건 밖이라 건너뛴 ${formatNumber(sent.skippedCount)}건 제외`}
                {sent.capped &&
                  ` · 원인마다 ${formatNumber(BATCH_MAX)}건까지라 남은 실패는 끝난 뒤 다시 보내세요`}
              </span>
            </div>
          )}
          <ThroughputChart
            key={scopeKey}
            label={`${selected ? nameOf(selected) : '전체'} 외부 등록 실패 건수`}
            unit="건"
            times={history.map(({ at }) => at)}
            series={[
              {
                label: '외부 등록 실패',
                values: history.map(({ value }) => value),
              },
            ]}
            // 보낸 시각이 기준점이다 — 그 뒤로 실패 선이 내려가야 회복이다.
            markers={
              sent
                ? [
                    { at: sent.at, label: '보냄' },
                    {
                      at: sent.at + sent.estimatedSeconds * 1000,
                      label: '예상 완료',
                      dashed: true,
                    },
                  ]
                : []
            }
          />
        </div>
      </section>
    </div>
  )
}

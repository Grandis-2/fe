import { useState } from 'react'

import { CircleCheck } from 'lucide-react'
import { Link } from 'react-router'

import {
  syncErrorCause,
  useReprocessByErrorCodes,
  useReservationStats,
  useSyncJobErrorGroups,
} from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import { adminReservationsPath } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { appendSample, type Sample } from '@shared/lib/samples'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Checkbox,
  FormSection,
  InlineAlert,
  RefreshStatus,
  Skeleton,
  SkeletonGroup,
  StatCard,
  ThroughputChart,
} from '@shared/ui'

import * as styles from './AdminRecovery.css'

// 조치 뒤 실패가 줄어드는지 바로 봐야 해서 홈(10초)보다 자주 받는다. 집계는 서버가 5초까지 캐시한다.
const POLL_INTERVAL_MS = 5_000
/** 서버가 한 번에 받는 최대 건수(코드마다) */
const BATCH_MAX = 1000
/** 예상 시간이 이만큼 지나도 줄지 않으면 외부 시스템이 아직 회복되지 않은 것으로 본다 */
const GRACE_SECONDS = 30

/**
 * 서버가 다시 보내는 속도(명세 기본값). 보내기 전 예상 시간을 어림하는 데만 쓰고 요청엔
 * 싣지 않는다 — 보낸 뒤엔 서버가 준 예상 시간을 쓴다.
 */
const SERVER_RATE_PER_SECOND = 20

const steps = ['원인 확인', '다시 보내기', '회복 확인'] as const

/** 다시 보낸 때의 값 — 그 뒤로 실패가 얼마나 줄었는지 비교한다 */
type Sent = {
  at: number
  failuresAtSend: number
  targetCount: number
  skippedCount: number
  estimatedSeconds: number
  /** 어느 코드든 1000건을 꽉 채웠으면 남은 실패가 있을 수 있다 */
  capped: boolean
}

/**
 * 외부 등록 장애 대응. 자동 재시도를 다 쓰고 멈춘(DEAD_LETTER) 예약을 마지막 오류 코드별로
 * 묶어 고른 속도로 다시 보내고, 같은 화면에서 실패 수가 줄어드는지 본다. 서버가 확인한
 * 집계만 보여 준다 — 다시 보낸 뒤의 성공을 미리 지어내지 않는다.
 */
export function AdminRecovery() {
  const stats = useReservationStats(undefined, POLL_INTERVAL_MS)
  const errors = useSyncJobErrorGroups(POLL_INTERVAL_MS)
  const reprocess = useReprocessByErrorCodes()

  // 관리자가 직접 켜고 끈 원인만 기억한다. 손대지 않은 원인은 다시 보내면 풀릴 수 있는
  // 것(일시 장애)만 기본으로 골라진다 — 거절된 건을 같이 보내 외부 시스템을 두드리지 않게.
  const [choices, setChoices] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  )
  const [sent, setSent] = useState<Sent | null>(null)

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
  // 서버는 코드마다 1000건까지만 받는다 — 예상 시간은 실제로 보낼 수 있는 만큼으로 잰다.
  const sendableCount = picked.reduce(
    (total, group) => total + Math.min(group.count, BATCH_MAX),
    0,
  )

  const s = stats.data
  const failuresNow = s?.syncJobs.REGISTER.DEAD_LETTER
  // 외부 등록을 기다리는 작업 전부 — 다시 보낸 것뿐 아니라 새로 들어온 예약의 정상 등록
  // 대기가 대부분이라, 재처리 결과로 읽히지 않게 이름을 그대로 둔다.
  const pendingRegister = s
    ? s.syncJobs.REGISTER.PENDING +
      s.syncJobs.REGISTER.PROCESSING +
      s.syncJobs.REGISTER.RETRY_SCHEDULED
    : undefined

  // 회복 추이 — 이 화면을 연 뒤 받은 실패 수를 쌓는다(보내기 전부터 그려 둬야 보낸 뒤와
  // 비교된다). 등록 대기는 수천 건이라 같은 축에 넣으면 실패 선이 바닥에 붙어 빼 둔다.
  const [history, setHistory] = useState<Sample<number>[]>([])
  if (s && stats.dataUpdatedAt !== history.at(-1)?.at) {
    setHistory((prev) =>
      appendSample(prev, {
        at: stats.dataUpdatedAt,
        value: s.syncJobs.REGISTER.DEAD_LETTER,
      }),
    )
  }

  const send = () => {
    const failuresAtSend = failuresNow ?? 0
    reprocess.reset()
    reprocess.mutate(
      picked.map((group) => group.errorCode),
      {
        onSuccess: (results) => {
          const targetCount = results.reduce((t, r) => t + r.targetCount, 0)
          setSent({
            at: Date.now(),
            failuresAtSend,
            targetCount,
            skippedCount: results.reduce((t, r) => t + r.skippedCount, 0),
            // 코드끼리 차례로 보내므로 합이 전체 소요 시간이다.
            estimatedSeconds: results.reduce(
              (t, r) => t + r.estimatedSeconds,
              0,
            ),
            capped: results.some((r) => r.targetCount >= BATCH_MAX),
          })
        },
      },
    )
  }

  const confirmSend = () =>
    openModal({
      theme: 'light',
      title: `${formatNumber(pickedCount)}건을 다시 보낼까요?`,
      description: `외부 예약 시스템에 다시 등록해요. 한꺼번에 몰리지 않게 약 ${formatNumber(Math.ceil(sendableCount / SERVER_RATE_PER_SECOND))}초에 걸쳐 나눠 보내요.`,
      confirmLabel: '다시 보내기',
      onConfirm: () => {
        closeModal()
        send()
      },
    })

  const refresh = () => {
    void stats.refetch()
    void errors.refetch()
  }

  const currentStep = sent ? 2 : 1
  const elapsedSeconds = sent
    ? Math.max(0, Math.round((stats.dataUpdatedAt - sent.at) / 1000))
    : 0
  const decreased =
    sent && failuresNow !== undefined
      ? sent.failuresAtSend - failuresNow
      : undefined
  const notRecovering =
    sent !== null &&
    decreased !== undefined &&
    decreased <= 0 &&
    elapsedSeconds > sent.estimatedSeconds + GRACE_SECONDS

  return (
    <div className={styles.root}>
      <RefreshStatus
        updatedAt={stats.dataUpdatedAt}
        onRefresh={refresh}
        note="5초마다 자동 갱신"
      />

      <ol className={styles.steps} aria-label="진행 단계">
        {steps.map((label, index) => (
          <li
            key={label}
            className={[styles.step, index <= currentStep && styles.stepReached]
              .filter(Boolean)
              .join(' ')}
            aria-current={index === currentStep ? 'step' : undefined}
          >
            <span className={styles.stepNumber} aria-hidden="true">
              {index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      <div className={styles.columns}>
        <div className={styles.card}>
          <FormSection
            title="1. 실패 원인별 묶음"
            description="외부 예약 시스템이 마지막에 돌려준 이유로 묶었어요. 다시 보낼 원인을 고르세요."
          >
            {pollingError(errors) !== null && (
              <InlineAlert status={errors.data ? 'warning' : 'error'}>
                {getErrorMessage(
                  pollingError(errors),
                  '원인별 건수를 불러오지 못했어요.',
                )}
              </InlineAlert>
            )}
            {errors.isPending ? (
              <SkeletonGroup className={styles.list}>
                {[0, 1].map((row) => (
                  <Skeleton key={row} height={64} />
                ))}
              </SkeletonGroup>
            ) : errors.data && groups.length === 0 ? (
              <InlineAlert status="success" icon={CircleCheck}>
                지금 다시 보낼 외부 등록 실패가 없어요.
              </InlineAlert>
            ) : (
              <div className={styles.list}>
                {groups.map((group) => {
                  const checked = isPicked(group)
                  return (
                    <label
                      key={group.errorCode}
                      className={[styles.cause, checked && styles.causePicked]
                        .filter(Boolean)
                        .join(' ')}
                    >
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
                        <span
                          className={
                            group.cause.transient
                              ? styles.causeHint
                              : styles.causeHintWarn
                          }
                        >
                          {group.cause.transient
                            ? '잠시 뒤 다시 보내면 풀릴 수 있어요'
                            : '다시 보내도 같은 결과일 수 있어요 — 예약을 한 건씩 확인하세요'}
                          {/* 개발팀에 알릴 때 쓰는 원래 코드 */}
                          <span className={styles.causeCode}>
                            {' '}
                            · {group.errorCode}
                          </span>
                        </span>
                      </span>
                      <span className={styles.causeCount}>
                        {formatNumber(group.count)}건
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
            <div className={styles.caption}>
              건수에는 아직 자동 재시도 중인 작업이 섞일 수 있어요. 다시
              보내기는 재시도를 다 쓴 작업만 보내고, 실제로 보낸 수는 결과에
              나와요.{' '}
              <Link
                className={styles.link}
                to={adminReservationsPath('REPROCESS_NEEDED')}
              >
                실패한 예약을 한 건씩 보기
              </Link>
            </div>
          </FormSection>
        </div>

        <div className={styles.card}>
          <FormSection title="2. 다시 보내기">
            <div className={styles.summary}>
              <span className={styles.caption}>고른 원인</span>
              <span className={styles.summaryValue}>
                {formatNumber(pickedCount)}건
              </span>
            </div>
            <span className={styles.caption}>
              {pickedCount > 0
                ? `한꺼번에 보내면 막 회복된 외부 시스템이 다시 멈출 수 있어 약 ${formatNumber(Math.ceil(sendableCount / SERVER_RATE_PER_SECOND))}초에 걸쳐 나눠 보내요. 누른 순간의 실패만 보내고, 그 뒤에 생긴 실패는 다시 눌러야 해요.`
                : '보낼 원인을 골라 주세요.'}
            </span>
            {reprocess.isError && (
              <InlineAlert status="error">
                {getErrorMessage(reprocess.error, '다시 보내지 못했어요.')}
              </InlineAlert>
            )}
            <Button
              disabled={pickedCount === 0 || reprocess.isPending}
              onClick={confirmSend}
            >
              {reprocess.isPending
                ? '보내는 중…'
                : `${formatNumber(pickedCount)}건 다시 보내기`}
            </Button>
          </FormSection>
        </div>
      </div>

      <div className={styles.card}>
        <FormSection
          title="3. 회복 확인"
          description="서버가 집계한 값만 보여요. 다시 보낸 작업이 또 실패하면 '지금 실패'로 돌아와요."
        >
          {pollingError(stats) !== null && (
            <InlineAlert status={s ? 'warning' : 'error'}>
              {getErrorMessage(
                pollingError(stats),
                '실패 건수를 불러오지 못했어요.',
              )}
              {s && ' 아래 숫자는 마지막으로 받은 값이에요.'}
            </InlineAlert>
          )}
          {sent && (
            <InlineAlert status="success" icon={CircleCheck}>
              {formatNumber(sent.targetCount)}건을 다시 보내기 시작했어요. 약{' '}
              {formatNumber(sent.estimatedSeconds)}초 걸려요
              {sent.skippedCount > 0 &&
                ` (조건 밖이라 건너뛴 ${formatNumber(sent.skippedCount)}건 제외)`}
              .
            </InlineAlert>
          )}
          {sent?.capped && (
            <InlineAlert status="info">
              한 번에 원인마다 {formatNumber(BATCH_MAX)}건까지 보내요. 남은
              실패가 있으면 끝난 뒤 다시 보내 주세요.
            </InlineAlert>
          )}
          <div className={styles.cards}>
            {sent && (
              <StatCard
                label="보낼 때 실패"
                value={`${formatNumber(sent.failuresAtSend)}건`}
              />
            )}
            <StatCard
              label="지금 실패"
              muted={failuresNow === undefined}
              loading={stats.isPending}
              value={
                failuresNow === undefined
                  ? '조회 실패'
                  : `${formatNumber(failuresNow)}건`
              }
            />
            <StatCard
              label="외부 등록 대기 (새 접수 포함)"
              muted={pendingRegister === undefined}
              loading={stats.isPending}
              value={
                pendingRegister === undefined
                  ? '조회 실패'
                  : `${formatNumber(pendingRegister)}건`
              }
            />
          </div>
          {notRecovering && (
            <InlineAlert status="warning">
              예상 시간이 지났는데 실패가 줄지 않았어요. 외부 시스템이 아직
              회복되지 않았을 수 있어요. 잠시 뒤 다시 보내거나 외부 시스템
              담당자에게 알리세요.
            </InlineAlert>
          )}
          <ThroughputChart
            label="외부 등록 실패 건수"
            unit="건"
            times={history.map(({ at }) => at)}
            series={[
              {
                label: '외부 등록 실패',
                values: history.map(({ value }) => value),
              },
            ]}
            // 보낸 시각이 기준점이다 — 그 뒤로 실패 선이 내려가야 회복이다. 예상 완료는
            // 서버가 준 소요 시간으로 그은 점선이라, 이 선을 지나도 안 줄면 회복이 안 된 것이다.
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
          <div className={styles.caption}>
            이 화면을 연 뒤부터 그려요. &lsquo;보냄&rsquo; 선 뒤로 실패가 줄어야
            회복된 거예요. &lsquo;예상 완료&rsquo; 점선을 지나도 그대로거나 다시
            오르면 외부 시스템이 아직 회복되지 않았거나, 오픈 중이라 새 실패가
            생기고 있는 거예요.
          </div>
        </FormSection>
      </div>
    </div>
  )
}

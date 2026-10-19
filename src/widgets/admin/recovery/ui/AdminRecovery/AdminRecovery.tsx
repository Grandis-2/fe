import { useState } from 'react'

import { CircleCheck } from 'lucide-react'
import { Link } from 'react-router'

import {
  useReprocessByErrorCodes,
  useReservationStats,
  useSyncJobErrorGroups,
} from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import { ADMIN_RESERVATIONS_PATH } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { toggleInSet } from '@shared/lib/toggleInSet'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Checkbox,
  FormSection,
  InlineAlert,
  RefreshStatus,
  SegmentedTabs,
  Skeleton,
  SkeletonGroup,
  StatCard,
} from '@shared/ui'

import * as styles from './AdminRecovery.css'

// 조치 뒤 실패가 줄어드는지 바로 봐야 해서 홈(10초)보다 자주 받는다. 집계는 서버가 5초까지 캐시한다.
const POLL_INTERVAL_MS = 5_000
/** 서버가 한 번에 받는 최대 건수(코드마다) */
const BATCH_MAX = 1000
/** 예상 시간이 이만큼 지나도 줄지 않으면 외부 시스템이 아직 회복되지 않은 것으로 본다 */
const GRACE_SECONDS = 30

const rateOptions = [
  { value: '10', label: '초당 10건' },
  { value: '20', label: '초당 20건 (기본)' },
  { value: '50', label: '초당 50건' },
] as const
type Rate = (typeof rateOptions)[number]['value']

const steps = ['원인 확인', '속도 정해서 다시 보내기', '회복 확인'] as const

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

  // 고르지 않은 코드만 기억한다 — 새로 생긴 오류 코드는 기본으로 골라진다.
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set())
  const [rate, setRate] = useState<Rate>('20')
  const [sent, setSent] = useState<Sent | null>(null)

  const groups = (errors.data ?? [])
    .flatMap(({ errorCode, count }) =>
      errorCode === null ? [] : [{ errorCode, count }],
    )
    .toSorted((a, b) => b.count - a.count)
  const picked = groups.filter((group) => !excluded.has(group.errorCode))
  const pickedCount = picked.reduce((total, group) => total + group.count, 0)
  // 서버는 코드마다 1000건까지만 받는다 — 예상 시간은 실제로 보낼 수 있는 만큼으로 잰다.
  const sendableCount = picked.reduce(
    (total, group) => total + Math.min(group.count, BATCH_MAX),
    0,
  )
  const ratePerSecond = Number(rate)

  const s = stats.data
  const failuresNow = s?.syncJobs.REGISTER.DEAD_LETTER
  const retrying = s
    ? s.syncJobs.REGISTER.PENDING +
      s.syncJobs.REGISTER.PROCESSING +
      s.syncJobs.REGISTER.RETRY_SCHEDULED
    : undefined

  const send = () => {
    const failuresAtSend = failuresNow ?? 0
    reprocess.reset()
    reprocess.mutate(
      {
        errorCodes: picked.map((group) => group.errorCode),
        ratePerSecond,
      },
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
      description: `초당 ${rate}건씩 외부 예약 시스템에 다시 등록해요. 외부 시스템이 막 회복됐다면 속도를 낮추세요.`,
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
            description="마지막 시도의 오류 코드로 묶었어요. 다시 보낼 원인을 고르세요."
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
                  const checked = !excluded.has(group.errorCode)
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
                          setExcluded((prev) =>
                            toggleInSet(
                              prev,
                              [group.errorCode],
                              !event.target.checked,
                            ),
                          )
                        }
                      />
                      <span className={styles.causeCode}>
                        {group.errorCode}
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
              나와요. 한 건씩 보려면{' '}
              <Link className={styles.link} to={ADMIN_RESERVATIONS_PATH}>
                예약 현황
              </Link>
              에서 찾으세요.
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
            <div className={styles.field}>
              <span className={styles.fieldLabel} id="recovery-rate">
                보내는 속도
              </span>
              <div aria-labelledby="recovery-rate" role="group">
                <SegmentedTabs
                  items={rateOptions}
                  value={rate}
                  onChange={setRate}
                />
              </div>
              <span className={styles.caption}>
                {pickedCount > 0
                  ? `약 ${formatNumber(Math.ceil(sendableCount / ratePerSecond))}초 걸려요. 한꺼번에 몰리면 다시 실패할 수 있어요.`
                  : '보낼 원인을 골라 주세요.'}
              </span>
            </div>
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
          {!sent ? (
            <div className={styles.caption}>
              다시 보내면 여기서 실패가 줄어드는지 보여 줘요.
            </div>
          ) : (
            <>
              <InlineAlert status="success" icon={CircleCheck}>
                {formatNumber(sent.targetCount)}건을 다시 보내기 시작했어요. 약{' '}
                {formatNumber(sent.estimatedSeconds)}초 걸려요
                {sent.skippedCount > 0 &&
                  ` (조건 밖이라 건너뛴 ${formatNumber(sent.skippedCount)}건 제외)`}
                .
              </InlineAlert>
              {sent.capped && (
                <InlineAlert status="info">
                  한 번에 원인마다 {formatNumber(BATCH_MAX)}건까지 보내요. 남은
                  실패가 있으면 끝난 뒤 다시 보내 주세요.
                </InlineAlert>
              )}
              <div className={styles.cards}>
                <StatCard
                  label="보낼 때 실패"
                  value={`${formatNumber(sent.failuresAtSend)}건`}
                />
                <StatCard
                  label="지금 실패"
                  muted={failuresNow === undefined}
                  value={
                    failuresNow === undefined
                      ? '조회 실패'
                      : `${formatNumber(failuresNow)}건`
                  }
                />
                <StatCard
                  label="다시 보내는 중"
                  muted={retrying === undefined}
                  value={
                    retrying === undefined
                      ? '조회 실패'
                      : `${formatNumber(retrying)}건`
                  }
                />
                <StatCard
                  label="경과"
                  value={`${formatNumber(elapsedSeconds)}초 / 약 ${formatNumber(sent.estimatedSeconds)}초`}
                />
              </div>
              {notRecovering && (
                <InlineAlert status="warning">
                  예상 시간이 지났는데 실패가 줄지 않았어요. 외부 시스템이 아직
                  회복되지 않았을 수 있어요. 속도를 낮춰 다시 보내거나 외부
                  시스템 담당자에게 알리세요.
                </InlineAlert>
              )}
            </>
          )}
        </FormSection>
      </div>
    </div>
  )
}

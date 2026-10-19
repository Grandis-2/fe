import { useState, useSyncExternalStore } from 'react'

import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'

import {
  syncErrorCause,
  useReprocessByErrorCodes,
  useReservationStatsHistory,
  useSyncJobErrorGroups,
} from '@entities/admin-reservation'
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
  Skeleton,
  SkeletonGroup,
} from '@shared/ui'

import { recoveryStatus, type RecoveryStatus } from '../../lib/recoveryStatus'
import { sentRunStore } from '../../model/sentRun'
import { SentRunList } from '../SentRunList'

import * as styles from './ResendPanel.css'

// 펼쳐 둔 동안엔 보낸 원인이 빠지는지 바로 봐야 해서 서버 캐시 주기(5초)로 받는다 — 대시보드의
// 10초 구독과 같은 키라 펼친 동안만 당겨진다.
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

export type ResendPanelProps = {
  /** 펼치는 버튼이 가리킬 id */
  id: string
  /** 볼 사전예약. null이면 전체 */
  selected: string | null
  /** 고른 사전예약 이름 */
  scopeName?: string
  /**
   * 지금 재처리 필요 건수 — 'all'은 전체, 나머지는 열린 사전예약 id. 고른 범위의 상태를
   * 말하고, 보낼 때 그대로 남겨 어느 사전예약을 보든 보낼 때와 비교한다.
   */
  failuresByScope: Readonly<Record<string, number>>
  /** 전체로 돌아가 보내기 */
  onSelectAll: () => void
  /** 판정 기준 시각(받은 집계 시각) */
  now: number
}

/**
 * 외부 등록 실패 다시 보내기 — 운영 대시보드의 실패 카드에서 펼친다. 자동 재시도를 다 쓰고
 * 멈춘(재처리 필요) 예약을 원인별로 골라 한 번에 다시 보낸다. 맨 위 한 줄이 지금 상태와 다음
 * 행동을, 아래 보낸 기록이 처리 중·결과를 말한다. 추이는 대시보드의 접수·처리 속도로 본다.
 * 원인 묶음과 다시 보내기는 API에 상품 조건이 없어 전체 기준이다(백엔드 요청서 R4) — 사전예약을
 * 고른 채로는 보내지 않는다. 서버가 집계한 값만 보인다.
 */
export function ResendPanel({
  id,
  selected,
  scopeName,
  failuresByScope,
  onSelectAll,
  now,
}: ResendPanelProps) {
  const errors = useSyncJobErrorGroups(POLL_INTERVAL_MS)
  const reprocess = useReprocessByErrorCodes()
  const runs = useSyncExternalStore(sentRunStore.subscribe, sentRunStore.get)
  const sent = runs[0] ?? null
  const scopeKey = selected ?? 'all'
  const failures = failuresByScope[scopeKey]

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
  const failuresAtSend = sent?.failuresAtSend[scopeKey]

  const status = recoveryStatus({
    failures,
    rising,
    sent,
    failuresAtSend,
    now,
    scope: scopeName,
  })

  const send = () => {
    reprocess.reset()
    // mutate의 onSuccess는 패널이 접히거나 자리를 옮겨 다시 그려지면 버려진다 — 보낸 기록이
    // 빠지지 않게 promise로 받는다. 실패 문구는 reprocess.isError가 보인다.
    reprocess
      .mutateAsync(picked.map((group) => group.errorCode))
      .then((results) =>
        sentRunStore.add({
          at: Date.now(),
          targetCount: results.reduce((t, r) => t + r.targetCount, 0),
          skippedCount: results.reduce((t, r) => t + r.skippedCount, 0),
          // 원인끼리 차례로 보내므로 합이 전체 소요 시간이다.
          estimatedSeconds: results.reduce((t, r) => t + r.estimatedSeconds, 0),
          capped: results.some((r) => r.targetCount >= BATCH_MAX),
          // 보낼 때의 실패 수를 범위마다 남긴다 — 나중에 어느 사전예약을 보든 비교할 수 있게.
          failuresAtSend: failuresByScope,
          byErrorCode: Object.fromEntries(
            results.map((r) => [r.errorCode, r.targetCount]),
          ),
        }),
      )
      .catch(() => {})
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

  return (
    <section id={id} className={styles.card} aria-label="원인별로 다시 보내기">
      {/* 지금 상태와 다음 행동을 한 줄로. role로 바뀔 때 읽어 준다. */}
      <InlineAlert status={status.tone} icon={statusIcon[status.tone]}>
        {status.message}
      </InlineAlert>
      <div className={styles.sendHeader}>
        <div className={styles.sendSummary}>
          <span className={styles.sendCount}>
            {selected
              ? `${scopeName} 실패 ${failures === undefined ? '—' : formatNumber(failures)}건`
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
            <Button size="small" variant="subtle" onClick={onSelectAll}>
              전체에서 보내기
            </Button>
            <Button size="small" disabled>
              {scopeName} 다시 보내기
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
          아래 원인별 건수는 모든 사전예약을 합친 값이에요. 사전예약별 원인은
          서버 준비 후 보여요.
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
      {/* 보낸 기록 — 처리 중이면 돌고, 끝나면 결과 */}
      <SentRunList
        runs={runs}
        failuresByCode={Object.fromEntries(
          groups.map((group) => [group.errorCode, group.count]),
        )}
        now={now}
      />
    </section>
  )
}

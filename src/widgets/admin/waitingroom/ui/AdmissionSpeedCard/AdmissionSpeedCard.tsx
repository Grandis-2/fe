import { useState } from 'react'

import {
  useReservationStats,
  useReservationStatsHistory,
} from '@entities/admin-reservation'
import {
  isBraking,
  settingSourceLabel,
  waitEstimate,
  WAITINGROOM_DEFAULTS,
  type WaitingroomSetting,
  type WaitingroomStatus,
} from '@entities/admin-waitingroom'
import { SLOW_AFTER_MS } from '@features/open-preorder-picker'
import type { RefreshInterval } from '@shared/config/refreshInterval'
import { formatNumber } from '@shared/lib/formatNumber'
import { ratePerSecond, slopePerSecond } from '@shared/lib/samples'
import { Button, Input, Skeleton, Tag } from '@shared/ui'

import { admissionVerdict, previewNote } from '../../lib/admissionVerdict'
import { formatSeconds, oldestSeconds } from '../../lib/duration'
import { AdmissionBar } from '../AdmissionBar'
import { BacklogTrend } from '../BacklogTrend'

import * as styles from './AdmissionSpeedCard.css'

import type { AdmissionChange } from '../../lib/useAdmissionChange'

export type AdmissionSpeedCardProps = {
  /** 대기열 현황. 못 받았으면 undefined */
  view: WaitingroomStatus | undefined
  loading: boolean
  /** 전역 입장 속도 운영값. 못 받았으면 undefined */
  globalSetting: WaitingroomSetting | undefined
  /** 정할 수 있는 최댓값(운영값 조회의 maxGlobalCredit) */
  maxCredit: number
  refreshInterval: RefreshInterval
  admission: AdmissionChange
}

const sum = (values: Record<string, number>) =>
  Object.values(values).reduce((total, value) => total + value, 0)

/**
 * 입장 속도 카드 — 지금 올려도 되는지(판정·여유 막대·근거 칩)와 전역 입장 속도 바꾸기를
 * 한곳에 둔다. 모든 사전예약이 같은 예약 서버·외부 예약 시스템을 쓰므로 전체 기준이다.
 * 속도는 숫자만 받고, 지금 값과 다른 올바른 값일 때만 적용이 열린다. 넣는 순간 바꿨을 때의
 * 맨 뒤 대기와 처리 속도 대비 여유를 먼저 보인다.
 */
export function AdmissionSpeedCard({
  view,
  loading,
  globalSetting,
  maxCredit,
  refreshInterval,
  admission,
}: AdmissionSpeedCardProps) {
  // 판단 근거 — 외부 등록이 따라오는지는 예약 집계에서 본다. 받은 값은 추이로 쌓인다.
  const stats = useReservationStats(undefined, refreshInterval)
  const history = useReservationStatsHistory()
  const series = (pick: (value: (typeof history)[number]['value']) => number) =>
    history.map(({ at, value }) => ({ at, value: pick(value) }))
  const received = ratePerSecond(series((value) => sum(value.preorders))).at(
    -1,
  )?.value
  const processed = ratePerSecond(
    series((value) => sum(value.preorders) - value.preorders.PENDING_SYNC),
  ).at(-1)?.value
  const backlogSlope = slopePerSecond(
    series((value) => value.preorders.PENDING_SYNC),
    60_000,
  ).at(-1)?.value

  const totalWaiting = (view?.products ?? []).reduce(
    (total, product) => total + product.waiting,
    0,
  )
  const admitting = view?.globalCredit ?? 0
  const processing = processed === undefined ? null : Math.round(processed)
  const braking = isBraking(view?.brakeFactor ?? null)
  const verdict = admissionVerdict({
    braking,
    backlogPerMinute: backlogSlope === undefined ? null : backlogSlope * 60,
    backlog: stats.data?.preorders.PENDING_SYNC ?? 0,
    admitting,
    processing,
    receiving: received ?? 0,
  })
  const oldest = oldestSeconds(
    stats.data?.oldestPendingSyncAt,
    stats.dataUpdatedAt,
  )

  const [draft, setDraft] = useState('')
  const draftValue = draft === '' ? null : Number(draft)
  const inRange =
    draftValue !== null && draftValue >= 1 && draftValue <= maxCredit
  const canApply =
    inRange && draftValue !== globalSetting?.value && !admission.isPending
  // 실제 입장은 운영값 × 브레이크 배율이라 바꾼 값에도 지금 배율을 곱해 본다.
  const nextAdmitting =
    inRange && draftValue !== null
      ? Math.round(draftValue * (view?.brakeFactor ?? 1))
      : null
  const note =
    nextAdmitting !== null && processing !== null
      ? previewNote(nextAdmitting, processing)
      : null

  return (
    <div className={styles.card[verdict.tone]}>
      {loading ? (
        <Skeleton height={120} />
      ) : (
        <>
          <div className={styles.verdict}>
            <span className={styles.dot[verdict.tone]} aria-hidden="true" />
            <span className={styles.verdictText[verdict.tone]}>
              {verdict.message}
            </span>
          </div>

          {processing !== null && view && (
            <AdmissionBar
              admitting={admitting}
              processing={processing}
              next={nextAdmitting}
              tone={verdict.tone}
            />
          )}

          <div className={styles.chips}>
            <span className={styles.chip}>
              <BacklogTrend prefix="외부 등록 대기" />
            </span>
            <span
              className={
                oldest !== null && oldest * 1000 > SLOW_AFTER_MS
                  ? styles.chipWarn
                  : styles.chip
              }
            >
              가장 오래 기다린 등록{' '}
              {oldest === null ? '없음' : formatSeconds(oldest)}
            </span>
            {braking && (
              <span className={styles.chipWarn}>
                브레이크 {view?.brakeFactor}× · 올려도 안 빨라져요
              </span>
            )}
          </div>
        </>
      )}

      <div className={styles.divider} />

      <form
        className={styles.speedRow}
        onSubmit={(event) => {
          event.preventDefault()
          if (!canApply || draftValue === null) return
          admission.apply(
            { kind: 'globalCredit', value: draftValue },
            '전역 입장 속도를 바꿨습니다.',
            () => setDraft(''),
          )
        }}
      >
        <div className={styles.speedLabel}>
          <span className={styles.caption}>
            전역 입장 속도 · 모든 상품 합계
          </span>
          <span className={styles.speedValue}>
            {globalSetting?.value == null
              ? '—'
              : `${formatNumber(globalSetting.value)}명/초`}
            {globalSetting && (
              <Tag
                variant="outline"
                size="small"
                color={
                  globalSetting.source === 'OPERATIONAL' ? 'primary' : 'gray'
                }
              >
                {settingSourceLabel[globalSetting.source]}
              </Tag>
            )}
          </span>
        </div>
        <div className={styles.speedInput}>
          <Input
            label="바꿀 속도(명/초)"
            size="small"
            inputMode="numeric"
            value={draft}
            // 숫자만 받는다 — 붙여 넣은 글자·소수점은 버린다.
            onChange={(event) =>
              setDraft(event.target.value.replace(/\D/g, '').slice(0, 5))
            }
            error={
              draft !== '' && !inRange
                ? `1~${formatNumber(maxCredit)} 사이로 적어 주세요`
                : undefined
            }
          />
        </div>
        <Button type="submit" disabled={!canApply}>
          {admission.isPending ? '적용 중…' : '적용'}
        </Button>
      </form>

      <div className={styles.speedFoot}>
        <span className={styles.previewLine} aria-live="polite">
          {nextAdmitting !== null && view ? (
            <>
              바꾸면 · 맨 뒤 대기{' '}
              <span className={styles.previewValue}>
                {waitEstimate(totalWaiting, admitting) ?? '줄 없음'} →{' '}
                {waitEstimate(totalWaiting, nextAdmitting) ?? '줄 없음'}
              </span>
              {note && (
                <>
                  {' · '}
                  <span className={styles.noteText[note.tone]}>
                    {note.text}
                  </span>
                </>
              )}
            </>
          ) : (
            '숫자를 넣으면 바꿨을 때 결과가 먼저 보여요'
          )}
        </span>
        <span className={styles.speedLinks}>
          {globalSetting?.source === 'OPERATIONAL' && (
            <button
              type="button"
              className={styles.linkButton}
              disabled={admission.isPending}
              onClick={() =>
                admission.confirm(
                  '전역 입장 속도를 기본값으로 되돌릴까요?',
                  `${WAITINGROOM_DEFAULTS.globalCredit}명/초로 돌아가고 1초 안에 반영됩니다.`,
                  '되돌리기',
                  () =>
                    admission.apply(
                      { kind: 'globalCredit', value: null },
                      '전역 입장 속도를 기본값으로 되돌렸습니다.',
                    ),
                )
              }
            >
              기본값으로
            </button>
          )}
          <button
            type="button"
            className={styles.linkDanger}
            disabled={admission.isPending || globalSetting?.value === 0}
            onClick={() =>
              admission.confirm(
                '입장을 멈출까요?',
                '모든 사전예약의 입장이 멈춰요. 줄은 그대로 남고, 기본값으로 되돌리면 다시 들어가요.',
                '입장 멈춤',
                () =>
                  admission.apply(
                    { kind: 'globalCredit', value: 0 },
                    '입장을 멈췄습니다.',
                  ),
              )
            }
          >
            입장 멈춤
          </button>
        </span>
      </div>
    </div>
  )
}

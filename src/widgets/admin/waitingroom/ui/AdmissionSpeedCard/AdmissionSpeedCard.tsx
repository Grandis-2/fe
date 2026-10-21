import { useState } from 'react'

import {
  settingSourceLabel,
  waitEstimate,
  WAITINGROOM_DEFAULTS,
  type WaitingroomSetting,
} from '@entities/admin-waitingroom'
import { formatNumber } from '@shared/lib/formatNumber'
import { Button, Input, Skeleton, Tag } from '@shared/ui'

import { previewNote } from '../../lib/admissionVerdict'
import { AdmissionBar } from '../AdmissionBar'

import * as styles from './AdmissionSpeedCard.css'

import type { AdmissionChange } from '../../lib/useAdmissionChange'
import type { AdmissionFlow } from '../../lib/useAdmissionFlow'

export type AdmissionSpeedCardProps = {
  flow: AdmissionFlow
  /** 브레이크 배율 — 바꾼 값에도 곱해 실제 입장을 미리 본다 */
  brakeFactor: number | null
  loading: boolean
  /** 전역 입장 속도 운영값. 못 받았으면 undefined */
  globalSetting: WaitingroomSetting | undefined
  /** 정할 수 있는 최댓값(운영값 조회의 maxGlobalCredit) */
  maxCredit: number
  admission: AdmissionChange
  /** 맨 위 판정의 '속도 낮추기'가 이 칸으로 옮겨 온다 */
  inputId: string
}

/** −/+ 버튼 한 번에 바꾸는 양 */
const STEP = 10

/**
 * 입장 속도 카드 — 색 구간 막대로 지금 위치와 처리 한계를 보이고, 그 아래에서 전역 입장
 * 속도를 바꾼다. 모든 사전예약이 같은 예약 서버·외부 예약 시스템을 쓰므로 전체 기준이다.
 * 숫자를 넣는 순간 바꿨을 때의 맨 뒤 대기와 처리 속도 대비 여유를 먼저 보인다.
 */
export function AdmissionSpeedCard({
  flow,
  brakeFactor,
  loading,
  globalSetting,
  maxCredit,
  admission,
  inputId,
}: AdmissionSpeedCardProps) {
  const { waiting, admitting, processing } = flow
  const [draft, setDraft] = useState('')
  const draftValue = draft === '' ? null : Number(draft)
  const inRange =
    draftValue !== null && draftValue >= 1 && draftValue <= maxCredit
  // 지금 값을 받기 전(조회 중·실패)엔 무엇을 덮어쓰는지 모르니 바꾸지 못하게 한다.
  const canApply =
    globalSetting !== undefined &&
    inRange &&
    draftValue !== globalSetting.value &&
    !admission.isPending
  // 실제 입장은 운영값 × 브레이크 배율 — 서버처럼 내림하고, 0이 아니면 최소 1로 본다.
  const nextAdmitting =
    inRange && draftValue !== null
      ? Math.max(1, Math.floor(draftValue * (brakeFactor ?? 1)))
      : null
  const note =
    nextAdmitting !== null && processing !== null
      ? previewNote(nextAdmitting, processing)
      : null

  const step = (delta: number) => {
    const base = draftValue ?? globalSetting?.value ?? 0
    setDraft(String(Math.min(maxCredit, Math.max(1, base + delta))))
  }

  return (
    <section className={styles.card} aria-labelledby="wr-speed">
      <div className={styles.head}>
        <h2 id="wr-speed" className={styles.title}>
          입장 속도
        </h2>
        <span className={styles.caption}>모든 사전예약 합계</span>
      </div>

      {loading ? (
        <Skeleton height={64} />
      ) : processing === null ? (
        <span className={styles.caption}>
          외부 등록 처리 속도를 재는 중이에요. 30초쯤 지나면 막대가 나와요.
        </span>
      ) : (
        <AdmissionBar
          admitting={admitting}
          processing={processing}
          next={nextAdmitting}
        />
      )}

      <form
        className={styles.control}
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
        <div className={styles.current}>
          <span className={styles.caption}>지금 설정</span>
          <span className={styles.currentValue}>
            {globalSetting?.value == null
              ? '—'
              : formatNumber(globalSetting.value)}
            <span className={styles.unit}>명/초</span>
          </span>
          {globalSetting && (
            <Tag variant="subtle" size="small" color="gray">
              {settingSourceLabel[globalSetting.source]}
            </Tag>
          )}
        </div>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepButton}
            aria-label={`${STEP} 줄이기`}
            onClick={() => step(-STEP)}
          >
            −{STEP}
          </button>
          <div className={styles.stepInput}>
            <Input
              id={inputId}
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
          <button
            type="button"
            className={styles.stepButton}
            aria-label={`${STEP} 늘리기`}
            onClick={() => step(STEP)}
          >
            +{STEP}
          </button>
        </div>
        <Button type="submit" disabled={!canApply}>
          {admission.isPending ? '적용 중…' : '적용'}
        </Button>
      </form>

      {nextAdmitting !== null ? (
        <div
          className={styles.preview[note?.tone ?? 'muted']}
          aria-live="polite"
        >
          <span>
            바꾸면 맨 뒤 대기{' '}
            <b className={styles.previewValue}>
              {waitEstimate(waiting, admitting) ?? '줄 없음'} →{' '}
              {waitEstimate(waiting, nextAdmitting) ?? '줄 없음'}
            </b>
          </span>
          {note && (
            <span className={styles.previewNote[note.tone]}>{note.text}</span>
          )}
        </div>
      ) : (
        <span className={styles.caption} aria-live="polite">
          숫자를 넣으면 바꿨을 때 결과가 먼저 보여요
        </span>
      )}

      <div className={styles.foot}>
        {globalSetting?.source === 'OPERATIONAL' ? (
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
            기본값({WAITINGROOM_DEFAULTS.globalCredit}명/초)으로
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className={styles.stopButton}
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
      </div>
    </section>
  )
}

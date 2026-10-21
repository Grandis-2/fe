import { useState, type ReactNode } from 'react'

import {
  isBraking,
  settingSourceLabel,
  waitEstimate,
  WAITINGROOM_DEFAULTS,
  type WaitingroomSetting,
} from '@entities/admin-waitingroom'
import { formatNumber } from '@shared/lib/formatNumber'
import { Button, InlineAlert, Input, Skeleton, Tag } from '@shared/ui'

import { CONGESTION_WINDOW_MS } from '../../lib/admissionSignals'
import { formatSeconds } from '../../lib/duration'

import * as styles from './AdmissionSpeedCard.css'

import type { AdmissionTone } from '../../lib/admissionVerdict'
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
  /** 전체 상한을 바꾸면 함께 맞출 상품들 */
  productIds: readonly string[]
  admission: AdmissionChange
  /** 맨 위 판정의 '속도 낮추기'가 이 칸으로 옮겨 온다 */
  inputId: string
}

/** −/+ 버튼 한 번에 바꾸는 양 */
const STEP = 5
const WINDOW_SECONDS = CONGESTION_WINDOW_MS / 1000

const round = (value: number) => formatNumber(Math.round(value))

/**
 * 입장 속도 카드 — 접수와 외부 등록 처리 속도를 나란히 놓고, 그 아래에서 전체 상한을 바꾼다.
 * 지금 상태 판정은 맨 위 카드가 한다. 처리 한계는 밀리는 동안 잰 값만 보이고(그때만 최대치다),
 * 밀리거나 서버가 입장을 줄이는 동안엔 지금보다 올리지 못하게 막고 이유를 말한다.
 */
export function AdmissionSpeedCard({
  flow,
  brakeFactor,
  loading,
  globalSetting,
  maxCredit,
  productIds,
  admission,
  inputId,
}: AdmissionSpeedCardProps) {
  const { waiting, admitting, signals } = flow
  const [draft, setDraft] = useState('')
  const draftValue = draft === '' ? null : Number(draft)
  const current = globalSetting?.value ?? null
  const inRange =
    draftValue !== null && draftValue >= 1 && draftValue <= maxCredit

  // 밀리거나 서버가 입장을 줄이는 동안엔 지금보다 올리지 못한다. 멈춘 상태(0)에서 다시 여는 건 된다.
  const hold =
    current !== null && current > 0
      ? isBraking(brakeFactor)
        ? 'braking'
        : signals.congested
          ? 'congested'
          : null
      : null
  const raising =
    draftValue !== null && current !== null && draftValue > current
  const blocked = hold !== null && raising

  // 지금 값을 받기 전(조회 중·실패)엔 무엇을 덮어쓰는지 모르니 바꾸지 못하게 한다.
  const canApply =
    globalSetting !== undefined &&
    inRange &&
    draftValue !== current &&
    !blocked &&
    !admission.isPending
  // 실제 입장은 운영값 × 브레이크 배율 — 서버처럼 내림하고, 0이 아니면 최소 1로 본다.
  const nextAdmitting =
    inRange && draftValue !== null
      ? Math.max(1, Math.floor(draftValue * (brakeFactor ?? 1)))
      : null

  const base = draftValue ?? current ?? 0
  const step = (delta: number) =>
    setDraft(String(Math.min(maxCredit, Math.max(1, base + delta))))
  const canStepUp = hold === null || base + STEP <= (current ?? 0)

  const limit = signals.limit?.perSecond
  const preview = ((): {
    tone: AdmissionTone
    main: ReactNode
    sub?: string
  } | null => {
    if (nextAdmitting === null || blocked || draftValue === current) return null
    const wait = `${waitEstimate(waiting, admitting) ?? '줄 없음'} → ${waitEstimate(waiting, nextAdmitting) ?? '줄 없음'}`
    if (limit === undefined) {
      return {
        tone: 'muted',
        main: (
          <>
            바꾸면 맨 뒤 대기 <b className={styles.previewValue}>{wait}</b>
          </>
        ),
        sub: raising
          ? `한계는 아직 몰라요. 올린 뒤 ${WINDOW_SECONDS}초쯤 외부 등록 대기가 늘지 않는지 지켜보세요.`
          : undefined,
      }
    }
    if (nextAdmitting <= limit) {
      const backlog = signals.backlog ?? 0
      const drain =
        signals.congested && backlog > 0 && nextAdmitting < limit
          ? Math.ceil(backlog / (limit - nextAdmitting))
          : null
      return {
        tone: 'success',
        main: (
          <>
            바꾸면{' '}
            <b className={styles.previewValue}>
              한계(약 {round(limit)}건/초) 안쪽이에요
            </b>
          </>
        ),
        sub: `${drain === null ? '' : `쌓인 외부 등록 대기 ${formatNumber(backlog)}건이 약 ${formatSeconds(drain)} 만에 풀려요 · `}맨 뒤 대기 ${wait}`,
      }
    }
    const over = nextAdmitting - limit
    return {
      tone: 'danger',
      main: (
        <>
          바꾸면{' '}
          <b className={styles.previewValue}>
            한계(약 {round(limit)}건/초)보다 초당 {round(over)}명 빨라요
          </b>
        </>
      ),
      sub: `외부 등록 대기가 분당 약 ${round(over * 60)}건씩 쌓여요 · 맨 뒤 대기 ${wait}`,
    }
  })()

  const rate = (value: number | null) =>
    value === null ? (
      <span className={styles.metricPending}>재는 중</span>
    ) : (
      <span className={styles.metricValue}>
        {round(value)}
        <span className={styles.unit}>건/초</span>
      </span>
    )
  const window =
    signals.coveredSeconds > 0
      ? `최근 ${signals.coveredSeconds}초${signals.judged ? '' : ' · 판단 전'}`
      : null
  const vs = !signals.judged
    ? { kind: 'pending' as const, mark: '·', label: '아직 판단 전' }
    : signals.congested
      ? {
          kind: 'congested' as const,
          mark: '>',
          label: '처리가 접수를 못 따라가요',
        }
      : {
          kind: 'following' as const,
          mark: '≤',
          label: '처리가 접수를 따라가요',
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
        <Skeleton height={96} />
      ) : (
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>접수</span>
            {rate(signals.received)}
            {window && <span className={styles.metricNote}>{window}</span>}
          </div>
          <span className={styles.vs[vs.kind]} role="img" aria-label={vs.label}>
            {vs.mark}
          </span>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>외부 등록 처리</span>
            {rate(signals.processed)}
            {window && <span className={styles.metricNote}>{window}</span>}
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>처리 한계</span>
            {signals.limit ? (
              <span className={styles.metricValue}>
                약 {round(signals.limit.perSecond)}
                <span className={styles.unit}>건/초</span>
              </span>
            ) : (
              <span className={styles.metricPending}>아직 몰라요</span>
            )}
            <span className={styles.metricNote}>
              {!signals.limit
                ? '외부 등록이 밀릴 때 재요'
                : signals.congested || signals.at === null
                  ? '지금 밀리는 중에 잰 값'
                  : `${formatSeconds(Math.round((signals.at - signals.limit.at) / 1000))} 전에 잰 값`}
            </span>
          </div>
        </div>
      )}

      <form
        className={styles.control}
        onSubmit={(event) => {
          event.preventDefault()
          if (!canApply || draftValue === null) return
          admission.apply(
            { kind: 'globalCredit', value: draftValue, productIds },
            '전체 상한과 모든 상품 상한을 바꿨습니다.',
            () => setDraft(''),
          )
        }}
      >
        <div className={styles.current}>
          <span className={styles.caption}>전체 상한 설정</span>
          <span className={styles.currentRow}>
            <span className={styles.currentValue}>
              {current === null ? '—' : formatNumber(current)}
              <span className={styles.unit}>명/초</span>
            </span>
            {globalSetting && (
              <Tag variant="subtle" size="small" color="gray">
                {settingSourceLabel[globalSetting.source]}
              </Tag>
            )}
          </span>
        </div>
        <div className={styles.stepper}>
          <Button
            variant="subtle"
            color="cancel"
            aria-label={`${STEP} 줄이기`}
            onClick={() => step(-STEP)}
          >
            −{STEP}
          </Button>
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
          <Button
            variant="subtle"
            color="cancel"
            aria-label={`${STEP} 늘리기`}
            disabled={!canStepUp}
            onClick={() => step(STEP)}
          >
            +{STEP}
          </Button>
        </div>
        <Button type="submit" disabled={!canApply}>
          {admission.isPending ? '적용 중…' : '적용'}
        </Button>
      </form>

      {blocked ? (
        <InlineAlert status="error">
          <b>
            {hold === 'braking'
              ? '서버가 입장을 줄이는 동안은 올릴 수 없어요.'
              : '밀리는 동안은 올릴 수 없어요.'}
          </b>{' '}
          {hold === 'braking'
            ? `올려도 실제 입장은 ${brakeFactor}배만 늘고, 브레이크가 풀리는 순간 한꺼번에 들어와 다시 밀려요. 브레이크가 풀리면 다시 올릴 수 있어요.`
            : `외부 등록이 한계${limit === undefined ? '' : `(약 ${round(limit)}건/초)`}에 닿아 있어요. 지금 ${formatNumber(current ?? 0)}명/초보다 올리면 대기가 더 쌓여요. 낮추거나 그대로 두고, 외부 등록 대기가 줄기 시작하면 다시 올릴 수 있어요.`}
        </InlineAlert>
      ) : preview ? (
        <div className={styles.preview[preview.tone]} aria-live="polite">
          <span>{preview.main}</span>
          {preview.sub && (
            <span className={styles.previewSub}>{preview.sub}</span>
          )}
        </div>
      ) : (
        <span className={styles.caption} aria-live="polite">
          숫자를 넣으면 바꿨을 때 결과가 먼저 보여요
        </span>
      )}

      <div className={styles.foot}>
        {globalSetting?.source === 'OPERATIONAL' ? (
          <Button
            variant="subtle"
            size="small"
            disabled={admission.isPending}
            onClick={() =>
              admission.confirm(
                '전체 상한을 기본값으로 되돌릴까요?',
                `전체 상한과 모든 상품 상한이 ${WAITINGROOM_DEFAULTS.globalCredit}명/초로 돌아가고 1초 안에 반영됩니다.`,
                '되돌리기',
                () =>
                  admission.apply(
                    { kind: 'globalCredit', value: null, productIds },
                    '전체 상한과 모든 상품 상한을 기본값으로 되돌렸습니다.',
                  ),
              )
            }
          >
            기본값({WAITINGROOM_DEFAULTS.globalCredit}명/초)으로
          </Button>
        ) : (
          <span />
        )}
        <Button
          variant="outline"
          size="small"
          rounded
          // 공통 버튼엔 위험 색이 없어 글자·테두리만 빨강으로 덮는다.
          className={styles.stopButton}
          disabled={admission.isPending || current === 0}
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
        </Button>
      </div>
    </section>
  )
}

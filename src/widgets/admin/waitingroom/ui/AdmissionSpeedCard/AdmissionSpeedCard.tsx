import { useState, type ReactNode } from 'react'

import {
  admissionZone,
  isBraking,
  settingSourceLabel,
  waitEstimate,
  type AdmissionCapacity,
  type AdmissionRateRefusal,
  type WaitingroomSetting,
} from '@entities/admin-waitingroom'
import { formatNumber } from '@shared/lib/formatNumber'
import { Button, InlineAlert, Input, Skeleton, Tag } from '@shared/ui'

import { CONGESTION_WINDOW_MS } from '../../lib/admissionSignals'
import { formatSeconds } from '../../lib/duration'
import { CapacityBar } from '../CapacityBar'

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
  /** 서버 용량(권장 상한·위험선·실제 적용). 못 받았거나 서버가 모르면 null/undefined */
  capacity: AdmissionCapacity | null | undefined
  /** 정할 수 있는 최댓값(운영값 조회의 maxGlobalCredit) */
  maxCredit: number
  /**
   * 전체 상한을 바꾸면 함께 맞출 상품들. 목록을 못 받았으면 null — 빠진 상품의 상한이 남으니
   * 바꾸지 못하게 막는다.
   */
  productIds: readonly string[] | null
  admission: AdmissionChange
  /** 맨 위 판정의 '속도 낮추기'가 이 칸으로 옮겨 온다 */
  inputId: string
}

/** −/+ 버튼 한 번에 바꾸는 양 */
const STEP = 5
const WINDOW_SECONDS = CONGESTION_WINDOW_MS / 1000

const round = (value: number) => formatNumber(Math.round(value))

/**
 * 입장 속도 카드 — 접수와 외부 등록 처리를 나란히 놓고, 그 아래에서 전체 상한을
 * 바꾼다. 지금 상태 판정은 맨 위 카드가 한다.
 *
 * 한계는 서버가 주는 사전예약 서버 용량 하나로 본다 — 권장 상한 안은 바로 반영, 권장~위험선은
 * 확인한 뒤 서버가 늘어나면 반영, 위험선 위는 서버가 받지 않는다. 외부 등록이 밀리거나 서버가
 * 입장을 줄이는 동안엔 용량과 상관없이 지금보다 올리지 못하게 막고 이유를 말한다.
 */
export function AdmissionSpeedCard({
  flow,
  brakeFactor,
  loading,
  globalSetting,
  capacity,
  maxCredit,
  productIds,
  admission,
  inputId,
}: AdmissionSpeedCardProps) {
  const { waiting, admitting, signals } = flow
  const [draft, setDraft] = useState('')
  // 화면이 미리 가른 뒤에도 그사이 용량이 바뀌어 서버가 위험선 위라고 거절한 경우.
  const [refusal, setRefusal] = useState<AdmissionRateRefusal | null>(null)
  const draftValue = draft === '' ? null : Number(draft)
  const current = globalSetting?.value ?? null
  const inRange =
    draftValue !== null && draftValue >= 1 && draftValue <= maxCredit

  const recommendedMax = capacity?.recommendedMax ?? null
  const dangerLine = capacity?.dangerLine ?? null
  // 실제 입장은 서버가 준 값을 먼저 쓰고, 없으면 현황의 값(운영값 × 브레이크)으로 본다.
  const applied = capacity?.appliedCredit ?? admitting

  const zone =
    inRange && draftValue !== null
      ? ((refusal?.kind === 'unreachable' ? 'unreachable' : null) ??
        admissionZone(draftValue, current, capacity))
      : null
  const unreachableLine = refusal?.dangerLine ?? dangerLine

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
    productIds !== null &&
    inRange &&
    draftValue !== current &&
    !blocked &&
    zone !== 'unreachable' &&
    !admission.isPending
  // 서버처럼 권장 상한까지만 들어가고, 브레이크를 곱해 내림하되 0이 아니면 최소 1로 본다.
  const nextAdmitting =
    inRange && draftValue !== null
      ? Math.max(
          1,
          Math.floor(
            Math.min(draftValue, recommendedMax ?? draftValue) *
              (brakeFactor ?? 1),
          ),
        )
      : null

  // +5는 위험선에서 멈춘다 — 그 위는 서버가 받지 않는다.
  const stepMax = Math.min(maxCredit, dangerLine ?? maxCredit)
  const base = draftValue ?? current ?? 0
  const changeDraft = (next: string) => {
    setDraft(next)
    setRefusal(null)
  }
  const step = (delta: number) =>
    changeDraft(String(Math.min(stepMax, Math.max(1, base + delta))))
  const canStepUp =
    base < stepMax && (hold === null || base + STEP <= (current ?? 0))

  const submit = (value: number, ids: readonly string[], confirm: boolean) =>
    admission.apply(
      {
        kind: 'globalCredit',
        value,
        productIds: ids,
        ...(confirm && { confirm }),
      },
      '전체 상한과 모든 상품 상한을 바꿨습니다.',
      () => changeDraft(''),
      (refused) =>
        refused.kind === 'confirm'
          ? askConfirm(value, ids, refused)
          : setRefusal(refused),
    )

  // 권장 상한을 넘겨 올리기 — 서버가 늘어난 뒤에야 반영된다는 걸 알리고 확인받는다.
  const askConfirm = (
    value: number,
    ids: readonly string[],
    limits: Pick<AdmissionRateRefusal, 'recommendedMax' | 'dangerLine'>,
  ) => {
    const recommended =
      limits.recommendedMax === null
        ? null
        : `${formatNumber(limits.recommendedMax)}명/초`
    admission.confirm(
      `권장 상한을 넘겨 ${formatNumber(value)}명/초로 올릴까요?`,
      [
        recommended
          ? `사전예약 서버가 늘어난 뒤에 반영돼요. 그전까지는 약 ${recommended}까지만 들어가요.`
          : '사전예약 서버가 늘어난 뒤에 반영돼요.',
        [
          recommended && `권장 상한 ${recommended}`,
          limits.dangerLine !== null &&
            `위험선 ${formatNumber(limits.dangerLine)}명/초`,
        ]
          .filter(Boolean)
          .join(' · '),
        `모든 상품 상한도 ${formatNumber(value)}명/초로 바뀌어요.`,
      ]
        .filter(Boolean)
        .join('\n'),
      `${formatNumber(value)}명/초로 올리기`,
      () => submit(value, ids, true),
    )
  }

  const preview = ((): {
    tone: AdmissionTone
    main: ReactNode
    sub?: string
  } | null => {
    if (
      nextAdmitting === null ||
      draftValue === null ||
      blocked ||
      zone === 'unreachable' ||
      draftValue === current
    )
      return null
    const wait = `${waitEstimate(waiting, admitting) ?? '줄 없음'} → ${waitEstimate(waiting, nextAdmitting) ?? '줄 없음'}`
    if (zone === 'confirm' && recommendedMax !== null) {
      return {
        tone: 'warning',
        main: (
          <>
            바꾸면{' '}
            <b className={styles.previewValue}>
              권장 상한({formatNumber(recommendedMax)}명/초)을 넘어요
            </b>{' '}
            — 사전예약 서버가 늘어난 뒤에 반영돼요
          </>
        ),
        sub: `그전까지는 약 ${formatNumber(recommendedMax)}명/초까지만 들어가요. 적용하면 한 번 더 확인해요.`,
      }
    }
    // 밀리는 중에 줄이면 쌓인 대기가 풀린다 — 지금 외부 등록 처리 속도와 비교한다.
    const backlog = signals.backlog ?? 0
    const processed = signals.processed
    if (
      signals.congested &&
      backlog > 0 &&
      processed !== null &&
      nextAdmitting < processed
    ) {
      return {
        tone: 'success',
        main: (
          <>
            바꾸면{' '}
            <b className={styles.previewValue}>
              쌓인 외부 등록 대기 {formatNumber(backlog)}건이 약{' '}
              {formatSeconds(Math.ceil(backlog / (processed - nextAdmitting)))}{' '}
              만에 풀려요
            </b>
          </>
        ),
        sub: `외부 등록 처리 ${round(processed)}건/초보다 느리게 들여보내서 줄어들어요 · 맨 뒤 대기 ${wait}`,
      }
    }
    if (zone === 'ok' && raising && recommendedMax !== null) {
      return {
        tone: 'success',
        main: (
          <>
            바꾸면{' '}
            <b className={styles.previewValue}>
              권장 상한({formatNumber(recommendedMax)}명/초) 안이라 1초 안에
              반영돼요
            </b>
          </>
        ),
        sub: `맨 뒤 대기 ${wait}`,
      }
    }
    return {
      tone: 'muted',
      main: (
        <>
          바꾸면 맨 뒤 대기 <b className={styles.previewValue}>{wait}</b>
        </>
      ),
      sub:
        raising && zone === null
          ? `서버 용량을 몰라요. 올린 뒤 ${WINDOW_SECONDS}초쯤 외부 등록 대기가 늘지 않는지 지켜보세요.`
          : undefined,
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

  // 지금 입장 숫자는 맨 위 상태 카드에 있다 — 여기선 설정보다 적게 들어갈 때 그 차이와 이유만
  // 설정 줄에 붙인다(서버 증설 대기 또는 브레이크).
  const shortfall =
    applied !== null && current !== null && current > 0 && applied < current
      ? `지금은 ${formatNumber(applied)}명/초만 적용 중${
          capacity?.scalingPending
            ? ''
            : isBraking(brakeFactor)
              ? ' · 서버가 입장을 줄이는 중'
              : ''
        }`
      : null

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
            {signals.congested ? (
              <span className={styles.metricNoteWarn}>접수를 못 따라가요</span>
            ) : (
              window && <span className={styles.metricNote}>{window}</span>
            )}
          </div>
        </div>
      )}

      <form
        className={styles.control}
        onSubmit={(event) => {
          event.preventDefault()
          if (!canApply || draftValue === null || productIds === null) return
          if (zone === 'confirm')
            askConfirm(draftValue, productIds, { recommendedMax, dangerLine })
          else submit(draftValue, productIds, false)
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
            {capacity?.scalingPending && (
              <Tag variant="subtle" size="small" color="yellow">
                서버 늘어나는 중
              </Tag>
            )}
          </span>
          {shortfall && <span className={styles.shortfall}>{shortfall}</span>}
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
                changeDraft(event.target.value.replace(/\D/g, '').slice(0, 5))
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

      {capacity && recommendedMax !== null ? (
        <CapacityBar
          capacity={{ ...capacity, recommendedMax }}
          setting={current}
          draft={inRange ? draftValue : null}
          applied={capacity.appliedCredit}
        />
      ) : (
        !loading && (
          <span className={styles.caption}>
            서버 용량을 알 수 없어요 — 권장·위험 기준 없이 최대{' '}
            {formatNumber(maxCredit)}명/초까지 바꿀 수 있어요
          </span>
        )
      )}

      {blocked ? (
        <InlineAlert status="error">
          <b>
            {hold === 'braking'
              ? '서버가 입장을 줄이는 동안은 올릴 수 없어요.'
              : '밀리는 동안은 올릴 수 없어요.'}
          </b>{' '}
          {hold === 'braking'
            ? `올려도 실제 입장은 ${brakeFactor}배만 늘고, 브레이크가 풀리는 순간 한꺼번에 들어와 다시 밀려요. 브레이크가 풀리면 다시 올릴 수 있어요.`
            : `외부 등록이 접수를 못 따라가고 있어요. 지금 ${formatNumber(current ?? 0)}명/초보다 올리면 대기가 더 쌓여요. 낮추거나 그대로 두고, 외부 등록 대기가 줄기 시작하면 다시 올릴 수 있어요.`}
        </InlineAlert>
      ) : zone === 'unreachable' ? (
        <InlineAlert status="error">
          <b>서버를 최대로 늘려도 받을 수 없는 값이에요.</b>{' '}
          {unreachableLine === null
            ? '더 낮은 값으로 적어 주세요.'
            : `위험선은 ${formatNumber(unreachableLine)}명/초예요. ${formatNumber(unreachableLine)} 이하로 적어 주세요.`}
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
            disabled={admission.isPending || productIds === null}
            onClick={() => {
              if (productIds === null) return
              admission.confirm(
                '전체 상한을 기본값으로 되돌릴까요?',
                '전체 상한과 모든 상품 상한이 서버 기본값으로 돌아가고 1초 안에 반영됩니다.',
                '되돌리기',
                () =>
                  admission.apply(
                    { kind: 'globalCredit', value: null, productIds },
                    '전체 상한과 모든 상품 상한을 기본값으로 되돌렸습니다.',
                  ),
              )
            }}
          >
            서버 기본값으로
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

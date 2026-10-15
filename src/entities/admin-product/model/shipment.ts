import type { ShipmentBatch, ShipmentBatchesRequest } from '@shared/api/types'
import { parseDateOnly } from '@shared/lib/parseDateOnly'
import type { DateRange } from '@shared/ui'

export type AdminShipmentBatch = ShipmentBatch

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
const weekdayFormatter = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })

/** '2026년 11월 2일 (월)' 형태 */
const formatShipDate = (date: string) => {
  const parsed = parseDateOnly(date)
  if (!parsed) return date
  return `${dateFormatter.format(parsed)} (${weekdayFormatter.format(parsed)})`
}

/** '2026년 11월 2일 (월) ~ 2026년 11월 6일 (금)'. 하루면 날짜 하나만 */
export const formatShipPeriod = (
  batch: Pick<ShipmentBatch, 'estimatedShipStart' | 'estimatedShipEnd'>,
) =>
  batch.estimatedShipStart === batch.estimatedShipEnd
    ? formatShipDate(batch.estimatedShipStart)
    : `${formatShipDate(batch.estimatedShipStart)} ~ ${formatShipDate(batch.estimatedShipEnd)}`

/** '1 ~ 1,000', 상한 없는 마지막 차수는 '1,001 ~' */
export const formatPositionRange = (
  batch: Pick<ShipmentBatch, 'positionFrom' | 'positionTo'>,
) =>
  `${batch.positionFrom.toLocaleString('ko-KR')} ~${
    batch.positionTo === null
      ? ''
      : ` ${batch.positionTo.toLocaleString('ko-KR')}`
  }`

/* ------------------------------------------------------------------ *
 * 편집 중인 차수
 *
 * 차수마다 '몇 번까지인지'(끝 번호)와 배송 기간만 들고, 시작 번호·차수 번호는 순서에서
 * 계산한다. 서버 규칙(1번부터 빈틈·겹침 없이, 상한 없는 차수는 마지막 하나)을 구조로
 * 지키기 위해서다 — 마지막 차수는 늘 '그 뒤 전부'라 끝 번호를 받지 않는다. 남는 검사는
 * '끝 번호가 시작 번호 이상인지'와 기간뿐이다.
 * ------------------------------------------------------------------ */

export type ShipmentBatchDraft = {
  id: string
  /** 이 차수의 마지막 순번. 마지막 차수에서는 쓰지 않는다. 입력 중에 비우면 null */
  positionTo: number | null
  period: DateRange
}

/** 서버가 준 차수를 폼이 편집할 초안으로 바꾼다 — 행 식별용 id를 새로 붙인다 */
export const toBatchDrafts = (batches: ShipmentBatch[]): ShipmentBatchDraft[] =>
  batches.map((batch) => ({
    id: crypto.randomUUID(),
    positionTo: batch.positionTo,
    period: { start: batch.estimatedShipStart, end: batch.estimatedShipEnd },
  }))

/** 빈 차수 한 줄 */
export const createBatchDraft = (): ShipmentBatchDraft => ({
  id: crypto.randomUUID(),
  positionTo: null,
  period: { start: '', end: '' },
})

/**
 * 끝 번호를 앞에서부터 이어 붙여 순번 구간을 만든다 — 시작 번호는 앞 차수 끝 + 1,
 * 마지막 차수는 상한 없음(null). 끝 번호가 비었거나 시작보다 작은 차수는 빈 구간
 * (positionTo < positionFrom)이 되고, 다음 차수는 그 앞의 유효한 끝 번호에 이어진다.
 * 저장은 batchDraftProblem이 막는다.
 */
export function toBatches(drafts: ShipmentBatchDraft[]): ShipmentBatch[] {
  let positionFrom = 1
  return drafts.map((draft, index) => {
    const last = index === drafts.length - 1
    const positionTo = last ? null : (draft.positionTo ?? positionFrom - 1)
    const batch = {
      batchNumber: index + 1,
      positionFrom,
      positionTo,
      estimatedShipStart: draft.period.start,
      estimatedShipEnd: draft.period.end,
    }
    if (positionTo !== null) {
      positionFrom = Math.max(positionFrom, positionTo + 1)
    }
    return batch
  })
}

/** 저장할 수 없는 이유. 저장할 수 있으면 null */
export function batchDraftProblem(drafts: ShipmentBatchDraft[]) {
  if (drafts.length === 0) return '차수를 1개 이상 추가해 주세요.'

  const batches = toBatches(drafts)
  for (const [index, draft] of drafts.entries()) {
    const { batchNumber, positionFrom } = batches[index]
    if (index < drafts.length - 1) {
      if (draft.positionTo === null) {
        return `${batchNumber}차 끝 번호를 입력해 주세요.`
      }
      if (draft.positionTo < positionFrom) {
        return `${batchNumber}차 끝 번호는 ${positionFrom.toLocaleString('ko-KR')} 이상이어야 합니다.`
      }
    }
    const { start, end } = draft.period
    if (!start || !end) return `${batchNumber}차 배송 기간을 정해 주세요.`
    if (end < start) {
      return `${batchNumber}차 배송 종료일은 시작일 이후여야 합니다.`
    }
  }
  return null
}

/**
 * 초안을 교체 요청으로 바꾼다. 차수는 통째로 바꾸는 API라 전체를 함께 보낸다 —
 * 보내기 전에 batchDraftProblem으로 막는다.
 */
export const toShipmentBatchesRequest = (
  drafts: ShipmentBatchDraft[],
): ShipmentBatchesRequest => ({ batches: toBatches(drafts) })

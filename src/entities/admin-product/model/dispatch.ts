import type { DispatchWave, DispatchWindowPutRequest } from '@shared/api/types'
import { parseDateOnly } from '@shared/lib/parseDateOnly'

export type DispatchWaveModel = DispatchWave

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
const weekdayFormatter = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })

/** '2026년 9월 20일 (일)' 형태. 배송일은 미정을 허용한다 */
export const formatDeliveryDate = (date: string | null) => {
  if (!date) return '미정'

  const parsed = parseDateOnly(date)
  if (!parsed) return '미정'
  return `${dateFormatter.format(parsed)} (${weekdayFormatter.format(parsed)})`
}

export const formatSeqRange = (wave: DispatchWave) =>
  `${wave.fromSeq.toLocaleString('ko-KR')} ~ ${wave.toSeq.toLocaleString('ko-KR')}`

/** 다음 차수를 만들 때 쓸 시작 순번 */
export const nextFromSeq = (waves: DispatchWave[]) =>
  waves.length === 0 ? 1 : waves[waves.length - 1].toSeq + 1

/* ------------------------------------------------------------------ *
 * 편집 중인 차수 구성
 *
 * 차수마다 '몇 번까지인지'(끝 번호)만 들고, 시작 번호·차수 번호·미정 시작 순번은
 * 순서에서 계산한다. 시작 번호까지 따로 입력받으면 겹침·빈 구간 같은 잘못된 구성이
 * 만들어질 수 있어서 그걸 하나하나 검사해야 하는데, 끝 번호만 들고 있으면 구간이
 * 항상 앞 차수에 붙어 이어진다 — 남는 검사는 '끝 번호가 시작 번호 이상인지'뿐이다.
 * ------------------------------------------------------------------ */

export type DispatchWaveDraft = {
  id: string
  /** 이 차수의 마지막 순번. 입력 중에 비우면 null */
  toSeq: number | null
  estimatedDeliveryDate: string | null
}

export const toWaveDrafts = (waves: DispatchWave[]): DispatchWaveDraft[] =>
  waves.map((wave) => ({
    id: crypto.randomUUID(),
    toSeq: wave.toSeq,
    estimatedDeliveryDate: wave.estimatedDeliveryDate,
  }))

export const createWaveDraft = (): DispatchWaveDraft => ({
  id: crypto.randomUUID(),
  toSeq: null,
  estimatedDeliveryDate: null,
})

/**
 * 끝 번호를 앞에서부터 이어 붙여 순번 구간을 만든다 — 시작 번호는 앞 차수 끝 + 1.
 * 끝 번호가 비었거나 시작보다 작은 차수는 빈 구간(toSeq < fromSeq)이 되고,
 * 다음 차수는 그 앞의 유효한 끝 번호에 이어진다. 저장은 waveDraftProblem이 막는다.
 */
export function toWaves(drafts: DispatchWaveDraft[]): DispatchWave[] {
  let fromSeq = 1
  return drafts.map((draft, index) => {
    const toSeq = draft.toSeq ?? fromSeq - 1
    const wave = {
      wave: index + 1,
      fromSeq,
      toSeq,
      estimatedDeliveryDate: draft.estimatedDeliveryDate,
    }
    fromSeq = Math.max(fromSeq, toSeq + 1)
    return wave
  })
}

/** 저장할 수 없는 이유. 저장할 수 있으면 null */
export function waveDraftProblem(drafts: DispatchWaveDraft[]) {
  if (drafts.length === 0) return '차수를 1개 이상 추가해 주세요.'

  const waves = toWaves(drafts)
  for (const [index, draft] of drafts.entries()) {
    const { wave, fromSeq } = waves[index]
    if (draft.toSeq === null) return `${wave}차 끝 번호를 입력해 주세요.`
    if (draft.toSeq < fromSeq) {
      return `${wave}차 끝 번호는 ${fromSeq.toLocaleString('ko-KR')} 이상이어야 합니다.`
    }
  }
  return null
}

export function toDispatchWindowRequest(
  drafts: DispatchWaveDraft[],
): DispatchWindowPutRequest {
  const waves = toWaves(drafts)
  // 마지막 차수 다음 순번부터 미정이다.
  return { waves, undeterminedFromSeq: nextFromSeq(waves) }
}

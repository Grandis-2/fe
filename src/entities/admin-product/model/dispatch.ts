import type { DispatchWave, DispatchWindowVersion } from '@shared/api/types'
import { parseDateOnly } from '@shared/lib/parseDateOnly'

export type DispatchWaveModel = DispatchWave
export type DispatchWindowVersionModel = DispatchWindowVersion

/**
 * 화면에 보여줄 버전 하나를 고른다.
 * 게시된 버전이 있으면 그것을, 없으면 가장 최근 초안을 쓴다.
 */
export function pickActiveVersion(versions: DispatchWindowVersion[]) {
  const published = versions.filter((version) => version.status === 'PUBLISHED')
  const candidates = published.length > 0 ? published : versions

  return candidates.toSorted((a, b) => b.version - a.version)[0]
}

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

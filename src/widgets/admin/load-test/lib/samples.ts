/** 폴링으로 받은 값 하나와 받은 시각(ms) */
export type Sample<TValue> = { at: number; value: TValue }

/** 그래프에 남길 최대 표본 수 — 5초 간격이면 5분 */
export const MAX_SAMPLES = 60

/** 새 표본을 뒤에 붙이고 오래된 것은 버린다. 같은 시각이면(같은 응답) 그대로 둔다 */
export function appendSample<TValue>(
  samples: readonly Sample<TValue>[],
  sample: Sample<TValue>,
  max = MAX_SAMPLES,
): Sample<TValue>[] {
  if (samples.at(-1)?.at === sample.at) return [...samples]
  return [...samples, sample].slice(-max)
}

/**
 * 누적 값(예: 확정된 예약 수)의 초당 증가량. 집계가 서버에서 몇 초씩 캐시돼 연속한 두
 * 표본은 같은 값일 때가 많아, 바로 앞이 아니라 windowMs 전 표본과 비교해 고르게 만든다.
 * 표본 i마다 하나씩 — 첫 표본은 비교할 앞이 없어 빠진다.
 */
export function ratePerSecond(
  samples: readonly Sample<number>[],
  windowMs = 30_000,
): number[] {
  return samples.slice(1).map((sample, index) => {
    const base =
      samples
        .slice(0, index + 1)
        .find((prev) => sample.at - prev.at <= windowMs) ?? samples[index]
    const seconds = (sample.at - base.at) / 1000
    // 줄어든 경우(취소로 빠짐)는 처리량이 아니라 0으로 본다.
    return seconds > 0 ? Math.max(0, (sample.value - base.value) / seconds) : 0
  })
}

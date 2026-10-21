/** 폴링으로 받은 값 하나와 받은 시각(ms) */
export type Sample<TValue> = { at: number; value: TValue }

/** 그래프에 남길 최대 표본 수 — 5초 간격이면 30분 */
export const MAX_SAMPLES = 360

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
 * 값의 초당 변화량(늘면 +, 줄면 -). 집계가 서버에서 몇 초씩 캐시돼 연속한 두 표본은
 * 같은 값일 때가 많아, 바로 앞이 아니라 windowMs 전 표본과 비교해 고르게 만든다.
 * 표본 i마다 하나씩 — 첫 표본은 비교할 앞이 없어 빠진다.
 */
export function slopePerSecond(
  samples: readonly Sample<number>[],
  windowMs = 30_000,
): Sample<number>[] {
  // 비교할 앞 표본은 시각 순이라 뒤로만 움직인다 — 표본마다 처음부터 다시 찾지 않는다.
  let from = 0
  return samples.slice(1).map((sample, index) => {
    while (from < index && sample.at - samples[from].at > windowMs) from += 1
    const base = samples[from]
    const seconds = (sample.at - base.at) / 1000
    return {
      at: sample.at,
      value: seconds > 0 ? (sample.value - base.value) / seconds : 0,
    }
  })
}

/** 누적 값(예: 접수된 예약 수)의 초당 증가량. 줄어든 경우는 처리량이 아니라 0으로 본다 */
export const ratePerSecond = (
  samples: readonly Sample<number>[],
  windowMs?: number,
) =>
  slopePerSecond(samples, windowMs).map(({ at, value }) => ({
    at,
    value: Math.max(0, value),
  }))

/**
 * 여러 기록을 하나로 더한다. 기록마다 받은 시각이 달라, 각 시각에 기록마다 그때까지 받은 마지막
 * 값을 더한다. 모든 기록이 첫 값을 받은 뒤부터만 낸다 — 그 전은 일부만 더해져 낮게 보인다.
 */
export function sumSeries(
  series: readonly (readonly Sample<number>[])[],
): Sample<number>[] {
  if (series.length === 0 || series.some((samples) => samples.length === 0))
    return []
  const start = Math.max(...series.map((samples) => samples[0].at))
  const times = [
    ...new Set(series.flatMap((samples) => samples.map(({ at }) => at))),
  ]
    .filter((at) => at >= start)
    .toSorted((a, b) => a - b)
    // 기록마다 시각이 달라 합치면 늘어난다 — 하나일 때와 같은 수만 남긴다.
    .slice(-MAX_SAMPLES)
  const cursors = series.map(() => 0)
  return times.map((at) => ({
    at,
    value: series.reduce((total, samples, k) => {
      while (
        cursors[k] + 1 < samples.length &&
        samples[cursors[k] + 1].at <= at
      )
        cursors[k] += 1
      return total + samples[cursors[k]].value
    }, 0),
  }))
}

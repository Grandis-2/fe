export type PathPoint = { x: number; y: number }

const fixed = (value: number) => Number(value.toFixed(2))

/**
 * 점들을 부드러운 곡선으로 잇는 SVG path(d). 단조 3차 보간(Fritsch–Carlson)이라 점과 점
 * 사이에서 값이 위아래로 튀어나가지 않는다 — 대기 건수가 0 아래로 내려가 보이거나 실제보다
 * 큰 봉우리가 생기지 않는다. 점은 x 순서대로 넘긴다.
 */
export function monotonePath(points: readonly PathPoint[]): string {
  const n = points.length
  if (n === 0) return ''
  const [first] = points
  if (n === 1) return `M${fixed(first.x)},${fixed(first.y)}`

  // 구간마다 기울기, 점마다 접선
  const slopes = points.slice(1).map((point, i) => {
    const dx = point.x - points[i].x
    return dx === 0 ? 0 : (point.y - points[i].y) / dx
  })
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0]
    if (i === n - 1) return slopes[n - 2]
    // 오르다 내리는 꼭짓점에선 평평하게 — 넘치지 않는다
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2
  })
  slopes.forEach((slope, i) => {
    if (slope === 0) {
      tangents[i] = 0
      tangents[i + 1] = 0
      return
    }
    const a = tangents[i] / slope
    const b = tangents[i + 1] / slope
    const sum = a * a + b * b
    if (sum > 9) {
      const k = 3 / Math.sqrt(sum)
      tangents[i] = k * a * slope
      tangents[i + 1] = k * b * slope
    }
  })

  let d = `M${fixed(first.x)},${fixed(first.y)}`
  for (let i = 0; i < n - 1; i += 1) {
    const from = points[i]
    const to = points[i + 1]
    const third = (to.x - from.x) / 3
    d += ` C${fixed(from.x + third)},${fixed(from.y + tangents[i] * third)} ${fixed(to.x - third)},${fixed(to.y - tangents[i + 1] * third)} ${fixed(to.x)},${fixed(to.y)}`
  }
  return d
}

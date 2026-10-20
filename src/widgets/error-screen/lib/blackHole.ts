// 500 장면(시안 Error 500 Black Hole v2.dc.html) — 오른쪽 위로 빨려 드는 중력 우물 격자와,
// 소용돌이를 그리며 떨어지는 신호(ERR 500). 고리 반지름은 R0·q^d로 줄어 깊을수록 촘촘하다.

export const RING_COUNT = 30
export const MERIDIAN_COUNT = 18
export const TRAIL_COUNT = 9

const CENTER = [96, 54]
const DIRECTION = [-0.78, -0.62] // 우물이 깊어지는 방향
const R0 = 820
const Q = 0.87
const PULL = 0.9
const ROT = (-34 * Math.PI) / 180
const SQUASH = 0.82

export const radiusAt = (depth: number) => R0 * Math.pow(Q, depth)

// 반지름 r 고리의 각도 th 지점.
export function wellPoint(r: number, th: number): [number, number] {
  const ex = r * Math.cos(th)
  const ey = SQUASH * r * Math.sin(th)
  const c = Math.cos(ROT)
  const s = Math.sin(ROT)
  return [
    CENTER[0] + DIRECTION[0] * r * PULL + ex * c - ey * s,
    CENTER[1] + DIRECTION[1] * r * PULL + ex * s + ey * c,
  ]
}

const toPath = (points: [number, number][]) =>
  points
    .map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1))
    .join('')

// i번째 고리 — flow(0~1)만큼 안쪽으로 흘러 들어간 위치.
export function ringPath(i: number, flow: number) {
  const r = radiusAt(i + flow)
  return toPath(
    Array.from({ length: 73 }, (_, j) => wellPoint(r, (j / 72) * Math.PI * 2)),
  )
}

// m번째 경선 — 우물 바닥으로 갈수록 살짝 감긴다.
export function meridianPath(m: number, spin: number) {
  const th = spin + (m / MERIDIAN_COUNT) * Math.PI * 2
  return toPath(
    Array.from({ length: RING_COUNT * 2 + 1 }, (_, k) => {
      const i = k / 2
      return wellPoint(radiusAt(i), th + i * 0.012)
    }),
  )
}

// 떨어지는 신호의 위치 — s는 한 번 떨어지는 동안의 진행(0~1).
export function fallAt(t: number, spin: number) {
  const s = (((t * 0.07) % 1) + 1) % 1
  return { s, p: wellPoint(radiusAt(1 + s * 16), 2.2 + s * 9 + spin) }
}

// 우물 바닥(가장 깊은 고리) — 라벨과 별 가림 마스크의 기준점.
export const WELL_BOTTOM = wellPoint(radiusAt(RING_COUNT), 0)

// 매번 같은 하늘이 나오게 고정 시드로 뿌린 별.
export const STARS = (() => {
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  return Array.from({ length: 260 }, () => ({
    x: (-350 + rnd() * 700).toFixed(1),
    y: (-230 + rnd() * 460).toFixed(1),
    r: (0.25 + Math.pow(rnd(), 3) * 0.9).toFixed(2),
    o: (0.3 + rnd() * 0.7).toFixed(2),
  }))
})()

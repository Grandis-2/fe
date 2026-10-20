// 404 장면(시안 Error 404 Orbit.dc.html) — 태양계 궤도를 비스듬히 내려다본 그림과, 궤도를
// 벗어나 밖으로 떠나는 물체(OBJ 404). 궤도 요소는 실제 행성 값을 화면에 맞게 줄인 것이다.

const D = Math.PI / 180
export const TAU = Math.PI * 2

export type Orbit = {
  a: number // 긴반지름
  e: number // 이심률
  inc: number // 기울기
  node: number // 승교점 경도
  peri: number // 근일점 인수
  size: number // 점 반지름 — 0이면 궤도선만 그린다(혜성)
  trail: number // 지나온 꼬리 길이(라디안) — 0이면 꼬리 없음
  ph: number // 시작 위치
  w: number // 각속도 — 바깥일수록 느리다
}

// [a, e, inc°, node°, peri°, size, trail°, ph°] — 수성부터 하우메아, 마지막 둘은 혜성.
const ELEMENTS = [
  [16, 0.2, 7, 48, 29, 1.6, 0, 40],
  [24, 0.01, 3, 76, 55, 2.2, 0, 160],
  [32, 0.02, 0, 0, 102, 2.2, 0, 250],
  [42, 0.09, 2, 50, 286, 1.8, 0, 320],
  [56, 0.08, 10, 80, 73, 1.4, 0, 110],
  [76, 0.05, 1, 100, 14, 3, 0, 200],
  [100, 0.06, 2, 113, 92, 2.8, 0, 60],
  [128, 0.05, 1, 74, 170, 2.4, 60, 300],
  [156, 0.01, 2, 131, 44, 2.4, 70, 15],
  [176, 0.25, 17, 110, 113, 1.8, 80, 140],
  [236, 0.44, 44, 36, 151, 2, 50, 210],
  [194, 0.16, 29, 79, 296, 1.8, 90, 250],
  [186, 0.19, 28, 122, 239, 1.8, 60, 330],
  [520, 0.93, 18, 160, 30, 0, 0, 0],
  [600, 0.95, 62, 20, 210, 0, 0, 0],
]

export const ORBITS: Orbit[] = ELEMENTS.map(
  ([a, e, inc, node, peri, size, trail, ph]) => ({
    a,
    e,
    inc: inc * D,
    node: node * D,
    peri: peri * D,
    size,
    trail: trail * D,
    ph: ph * D,
    w: 0.9 * Math.pow(32 / a, 1.1),
  }),
)

// 내려다보는 각도(기울임·회전)
const TILT = 64 * D
const ROLL = -16 * D

// 궤도 위 진근점 이각 nu의 점을 화면 좌표로 옮긴다.
export function project(o: Orbit, nu: number): [number, number] {
  const r = (o.a * (1 - o.e * o.e)) / (1 + o.e * Math.cos(nu))
  const u = nu + o.peri
  const x = r * Math.cos(u)
  const y0 = r * Math.sin(u)
  const y = y0 * Math.cos(o.inc)
  const z = y0 * Math.sin(o.inc)
  const X = x * Math.cos(o.node) - y * Math.sin(o.node)
  const Y = x * Math.sin(o.node) + y * Math.cos(o.node)
  const Ys = Y * Math.cos(TILT) - z * Math.sin(TILT)
  return [
    X * Math.cos(ROLL) - Ys * Math.sin(ROLL),
    X * Math.sin(ROLL) + Ys * Math.cos(ROLL),
  ]
}

// a0~a1 구간 궤도를 n개 선분으로 그린 path d.
export function arcPath(o: Orbit, a0: number, a1: number, n: number) {
  let d = ''
  for (let i = 0; i <= n; i++) {
    const [x, y] = project(o, a0 + ((a1 - a0) * i) / n)
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)
  }
  return d
}

export const anomalyAt = (o: Orbit, t: number) => o.ph + o.w * t * 0.12

// 궤도를 벗어난 물체 — 26초마다 안쪽에서 나타나 오른쪽 아래로 멀어지며 사라진다.
export const LOST_FROM = { x: 30, y: 40 }
export function lostObjectAt(t: number) {
  const k = (t % 26) / 26
  const s = Math.pow(k, 1.4)
  return {
    x: LOST_FROM.x + s * 260,
    y: LOST_FROM.y + s * 70,
    opacity: k < 0.06 ? k / 0.06 : k > 0.9 ? (1 - k) / 0.1 : 1,
  }
}

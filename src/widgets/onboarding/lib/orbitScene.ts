import { fontFamily } from '@shared/config/theme/tokens/typography/base'

import { palette } from '../model/palette'

// 디자인 시안(Onboarding Web/Mobile.dc.html)의 캔버스 장면을 옮긴 것 — 궤도 링과 행성, 별 위에
// 단계마다 다른 그림(알림 파동 → 모델 선택 → 대기 타이머 → 예약/결제)을 스프링으로 섞어 그린다.

type Spring = { x: number; v: number }

export type SceneInput = {
  step: number
  intro: boolean
  wide: boolean
  // 넓은 화면: 한 단계 안에서 스크롤한 비율(0~1) — 궤도가 스크롤을 따라 조금씩 돈다.
  seg: number
  // 좁은 화면: 스와이프 중 끌어온 거리(px) — 궤도 중심이 손가락을 살짝 따라온다.
  dx: number
  reducedMotion: boolean
}

// 단계별 궤도 배치. 좁은 화면은 문구가 아래에 깔리므로 중심을 위로 올린다(cy - 0.16).
const STEP_LAYOUT = [
  { cy: 0.5, scale: 1.0, tilt: 1.0, rot: 0 },
  { cy: 0.48, scale: 1.12, tilt: 0.42, rot: 1.1 },
  { cy: 0.5, scale: 0.94, tilt: 1.0, rot: 2.2 },
  { cy: 0.5, scale: 1.04, tilt: 0.6, rot: 3.3 },
]

// 시안의 elasticity 기본값(0.6)으로 정한 스프링 강성·감쇠.
const ELASTICITY = 0.6
const K = 120 + ELASTICITY * 140
const C = 2 * Math.sqrt(K) * (0.85 - ELASTICITY * 0.6)
// 대기열 단계에서 보여주는 "순서 유지" 타이머(5분).
const QUEUE_HOLD_SECONDS = 300

const spring = (x: number): Spring => ({ x, v: 0 })

export function createOrbitScene() {
  // 매번 같은 배치가 나오도록 고정 시드 난수를 쓴다.
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

  const rings = Array.from({ length: 16 }, (_, i) => {
    const count = rnd() < 0.45 ? 1 : rnd() < 0.7 ? 2 : 3
    const planets = Array.from({ length: count }, () => ({
      a: rnd() * Math.PI * 2,
      size: rnd() < 0.18 ? 3.5 + rnd() * 3.5 : 1.1 + rnd() * 1.8,
      sp:
        (0.32 / Math.sqrt(i + 1)) *
        (0.7 + rnd() * 0.6) *
        (rnd() < 0.15 ? -1 : 1),
    }))
    return {
      r: 34 + i * 25 + rnd() * 5,
      start: rnd() * 6.28,
      len: rnd() < 0.35 ? Math.PI * (1.3 + rnd() * 0.5) : Math.PI * 2,
      alpha: 0.22 + rnd() * 0.22,
      planets,
    }
  })
  const stars = Array.from({ length: 140 }, () => ({
    x: rnd(),
    y: rnd(),
    s: rnd() * 1.1 + 0.3,
    ph: rnd() * 6.28,
  }))

  const S = {
    cx: spring(0.66),
    cy: spring(0.5),
    dx: spring(0),
    scale: spring(0.4),
    tilt: spring(1),
    rot: spring(-1.2),
    o: [spring(0), spring(0), spring(0), spring(0)],
    sel: [spring(5), spring(5), spring(5)],
  }
  let t = 0
  let queueEnteredAt = performance.now()

  const step = (s: Spring, target: number, dt: number, k = K, c = C) => {
    s.v += (k * (target - s.x) - c * s.v) * dt
    s.x += s.v * dt
  }

  // 단계가 바뀔 때 궤도를 한 번 튕겨 전환을 느끼게 한다.
  function onStepChange(from: number, to: number) {
    if (to === 2) queueEnteredAt = performance.now()
    S.rot.v += (to > from ? 1 : -1) * 0.6
    S.scale.v -= 1.2
  }

  function draw(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    dpr: number,
    dt: number,
    input: SceneInput,
  ) {
    const { step: current, intro, wide, seg, dx, reducedMotion } = input
    // 모션을 줄인 사용자에겐 행성 공전·별 반짝임을 멈춘다(단계 전환 스프링만 남긴다).
    if (!reducedMotion) t += dt
    const layout = STEP_LAYOUT[current]

    step(S.cx, intro ? 0.5 : wide ? 0.66 : 0.5, dt)
    step(S.cy, intro ? 0.5 : wide ? layout.cy : layout.cy - 0.16, dt)
    step(
      S.scale,
      intro ? 0.7 : layout.scale * (wide ? Math.min(1.35, H / 760) : 1),
      dt,
    )
    step(S.tilt, intro ? 1 : layout.tilt, dt)
    step(S.rot, layout.rot + seg * 0.9 + dx * 0.004, dt, K * 0.6, C * 0.75)
    step(S.dx, dx * 0.35, dt)
    S.o.forEach((o, i) =>
      step(o, !intro && current === i ? 1 : 0, dt, K * 0.9, C),
    )
    const selIdx = Math.floor(t / 1.6) % 3
    S.sel.forEach((s, j) =>
      step(s, j === selIdx ? 11 : 5, dt, K * 1.4, C * 0.9),
    )

    const cx = W * S.cx.x + S.dx.x
    const cy = H * S.cy.x
    const sc = Math.max(0.05, S.scale.x)
    const tilt = S.tilt.x
    const rot = S.rot.x

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.globalAlpha = 1
    ctx.fillStyle = palette.bg
    ctx.fillRect(0, 0, W, H)
    const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6)
    g1.addColorStop(0, 'rgba(34,41,109,0.42)')
    g1.addColorStop(0.45, 'rgba(27,32,84,0.2)')
    g1.addColorStop(1, 'rgba(15,18,21,0)')
    ctx.fillStyle = g1
    ctx.fillRect(0, 0, W, H)
    const g2 = ctx.createRadialGradient(
      W * 0.1,
      H * 1.05,
      0,
      W * 0.1,
      H * 1.05,
      Math.max(W, H) * 0.55,
    )
    g2.addColorStop(0, 'rgba(51,40,113,0.3)')
    g2.addColorStop(1, 'rgba(39,31,87,0)')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = palette.ink
    // 좁은 화면은 시안대로 별을 절반만 쓴다.
    for (const s of wide ? stars : stars.slice(0, 70)) {
      ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + s.ph))
      ctx.beginPath()
      ctx.arc(s.x * W, s.y * H, s.s, 0, 6.28)
      ctx.fill()
    }

    const er = (1 - tilt) * -0.38
    const cosE = Math.cos(er)
    const sinE = Math.sin(er)
    const pt = (R: number, a: number): [number, number] => {
      const x = Math.cos(a) * R
      const y = Math.sin(a) * R * tilt
      return [cx + x * cosE - y * sinE, cy + x * sinE + y * cosE]
    }
    const O = S.o.map((o) => o.x)
    const A = O.map((o) => Math.max(0, Math.min(1, o)))
    const innerFade = Math.max(A[0] * 0.55, A[2], A[3] * 0.4)

    ctx.lineWidth = 1
    ctx.strokeStyle = palette.ring
    for (const ring of rings) {
      const R = ring.r * sc
      const fade = R < 100 ? 1 - innerFade * 0.85 : 1
      ctx.globalAlpha = ring.alpha * fade * 1.35
      ctx.beginPath()
      ctx.ellipse(
        cx,
        cy,
        R,
        Math.max(0.1, R * tilt),
        er,
        ring.start + rot * 0.5,
        ring.start + rot * 0.5 + ring.len,
      )
      ctx.stroke()
      for (const p of ring.planets) {
        if (!reducedMotion) p.a += p.sp * dt
        const a = p.a + rot
        const [x, y] = pt(R, a)
        const depth = 1 + Math.sin(a) * (1 - tilt) * 0.5
        ctx.globalAlpha = 0.9 * fade
        ctx.fillStyle = p.size > 3.4 ? palette.accent : palette.ink
        ctx.beginPath()
        ctx.arc(
          x,
          y,
          p.size * Math.max(0.3, depth) * Math.min(1.2, sc),
          0,
          6.28,
        )
        ctx.fill()
      }
    }

    ctx.strokeStyle = palette.ink
    ctx.fillStyle = palette.ink
    const font = (size: number, weight = 400) =>
      `${weight} ${size}px ${fontFamily.pretendard}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // STEP 1 알림 설정: 중심에서 퍼지는 알림 파동.
    if (A[0] > 0.01) {
      const o = O[0]
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.55 + i / 3) % 1
        ctx.globalAlpha = A[0] * (1 - ph) * 0.8
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(cx, cy, (14 + ph * 92) * Math.max(0, o), 0, 6.28)
        ctx.stroke()
      }
      ctx.globalAlpha = A[0]
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(0, (9 + Math.sin(t * 4) * 1.2) * o), 0, 6.28)
      ctx.fill()
      ctx.globalAlpha = A[0] * 0.8
      ctx.font = font(11)
      const labelY = wide
        ? cy + 128 * Math.max(0, o)
        : Math.min(cy + 128 * Math.max(0, o), H - 380)
      if (labelY > cy + 40) ctx.fillText('OPEN 알림 ON', cx, labelY)
    }

    // STEP 2 오픈 & 예약: 궤도를 도는 모델 셋 중 하나씩 선택된다.
    if (A[1] > 0.01) {
      const R = 132 * sc
      ctx.globalAlpha = A[1] * 0.5
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(cx, cy, R, R * tilt, er, 0, 6.28)
      ctx.stroke()
      ;['A', 'B', 'C'].forEach((label, j) => {
        const [x, y] = pt(R, t * 0.18 + j * 2.094 + rot)
        const s = S.sel[j].x * Math.max(0, O[1])
        ctx.globalAlpha = A[1]
        ctx.beginPath()
        ctx.arc(x, y, Math.max(0, s), 0, 6.28)
        ctx.fill()
        const on = Math.max(0, Math.min(1, (S.sel[j].x - 5) / 6))
        if (on > 0.02) {
          ctx.globalAlpha = A[1] * on
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(x, y, s + 8, 0, 6.28)
          ctx.stroke()
        }
        ctx.globalAlpha = A[1] * (0.55 + 0.45 * on)
        ctx.font = font(11, on > 0.5 ? 500 : 400)
        ctx.fillText(`MODEL ${label}`, x, y + s + 22)
      })
    }

    // STEP 3 대기열: 5분 순서 유지 타이머와 앞으로 빠져나가는 대기 행렬.
    if (A[2] > 0.01) {
      const o = Math.max(0, O[2])
      const elapsed = (performance.now() - queueEnteredAt) / 1000
      const remain = Math.max(0, QUEUE_HOLD_SECONDS - elapsed)
      const R = 66 * o * (wide ? 1.2 : 1)
      ctx.globalAlpha = A[2] * 0.2
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, 6.28)
      ctx.stroke()
      const end = -Math.PI / 2 + Math.PI * 2 * (remain / QUEUE_HOLD_SECONDS)
      ctx.globalAlpha = A[2]
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(cx, cy, R, -Math.PI / 2, end)
      ctx.stroke()
      ctx.lineCap = 'butt'
      ctx.beginPath()
      ctx.arc(cx + Math.cos(end) * R, cy + Math.sin(end) * R, 4, 0, 6.28)
      ctx.fill()
      const mm = String(Math.floor(remain / 60)).padStart(2, '0')
      const ss = String(Math.floor(remain % 60)).padStart(2, '0')
      ctx.font = font(wide ? 30 : 26, 500)
      ctx.fillText(`${mm}:${ss}`, cx, cy - 4)
      ctx.globalAlpha = A[2] * 0.65
      ctx.font = font(wide ? 12 : 11, 500)
      ctx.fillText('순서 유지 중', cx, cy + (wide ? 22 : 20))
      const QR = 112 * o * (wide ? 1.2 : 1)
      for (let q = 0; q < 6; q++) {
        const ph = (t * 0.22 + q / 6) % 1
        const a = -Math.PI / 2 - (1 - ph) * 2.4
        ctx.globalAlpha = A[2] * Math.min(1, ph * 4) * Math.min(1, (1 - ph) * 6)
        ctx.beginPath()
        ctx.arc(
          cx + Math.cos(a) * QR,
          cy + Math.sin(a) * QR,
          q === 0 ? 4.5 : 3,
          0,
          6.28,
        )
        ctx.fill()
      }
      ctx.globalAlpha = A[2] * 0.75
      ctx.font = font(10)
      ctx.fillText('MY TURN →', cx, cy - QR - 16)
    }

    // STEP 4 안정성: 예약 완료 → 결제 이어하기로 이어지는 점선.
    if (A[3] > 0.01) {
      const o = Math.max(0, O[3])
      const R = 112 * sc
      const a1 = Math.PI + 0.45
      const a2 = Math.PI * 2 - 0.45
      ctx.globalAlpha = A[3] * 0.9
      ctx.lineWidth = 1.4
      ctx.setLineDash([4, 6])
      ctx.lineDashOffset = -t * 18
      ctx.beginPath()
      ctx.ellipse(
        cx,
        cy,
        R,
        R * tilt,
        er,
        a1,
        a1 + (a2 - a1) * Math.min(1, A[3]),
      )
      ctx.stroke()
      ctx.setLineDash([])
      const [x1, y1] = pt(R, a1)
      const [x2, y2] = pt(R, a2)
      ctx.globalAlpha = A[3]
      ctx.beginPath()
      ctx.arc(x1, y1, 10 * o, 0, 6.28)
      ctx.fill()
      ctx.strokeStyle = palette.bg
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x1 - 4 * o, y1)
      ctx.lineTo(x1 - 1 * o, y1 + 3 * o)
      ctx.lineTo(x1 + 4.5 * o, y1 - 3.5 * o)
      ctx.stroke()
      ctx.strokeStyle = palette.ink
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x2, y2, 10 * o, 0, 6.28)
      ctx.stroke()
      const ph = (t * 0.8) % 1
      ctx.globalAlpha = A[3] * (1 - ph) * 0.7
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x2, y2, (10 + ph * 18) * o, 0, 6.28)
      ctx.stroke()
      ctx.globalAlpha = A[3]
      ctx.font = font(12, 600)
      ctx.fillText('예약 완료', x1, y1 + 28)
      ctx.globalAlpha = A[3] * 0.75
      ctx.fillText('결제 이어하기', x2, y2 + 28)
      ctx.globalAlpha = A[3] * 0.55
      ctx.font = font(10)
      ctx.fillText('MY PAGE', cx, cy)
    }
    ctx.globalAlpha = 1
  }

  return { draw, onStepChange }
}

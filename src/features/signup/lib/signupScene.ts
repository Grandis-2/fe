// 회원가입 배경 캔버스 — 디자인 시안(Signup.dc.html)을 옮긴 것.
// form: 반짝이며 위로 흐르는 별만. welcome: 가운데 빛이 커지고 궤도가 그려지며 행성이
// 나타나고, 입자가 터진 뒤 내 위성이 궤도에 안착한다(혜성이 주기적으로 지나간다).
// failed: 붉은 빛이 깜빡이고 궤도가 조각나 흩어지며 위성이 붉게 떨어진다.
export type SignupScene = 'form' | 'welcome' | 'failed'

// 캔버스는 CSS 변수를 못 읽어서 라이트 테마 토큰 값을 고정해 쓴다(온보딩과 같은 방식).
const INK = '#EBEDF9' // primary.subtler
const RING = '#9099D1' // primary.subtle
const ACCENT = '#AC99D7' // secondary.subtle
const ERROR = '#FF8A8A'
const TAU = Math.PI * 2

const easeOut = (v: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3)

type Star = {
  x: number
  y: number
  r: number
  a: number
  s: number
  p: number
  v: number
  tint: boolean
}
type Particle = { a: number; v: number; s: number; l: number; tint: boolean }
type Satellite = { a0: number; trail: [number, number][] }

export function startSignupScene(
  canvas: HTMLCanvasElement,
  getScene: () => SignupScene,
  reducedMotion: boolean,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  let w = 0
  let h = 0
  let stars: Star[] = []
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    stars = Array.from({ length: Math.round((w * h) / 6500) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() < 0.08 ? 1.4 + Math.random() : 0.4 + Math.random() * 0.8,
      a: 0.3 + Math.random() * 0.7,
      s: 0.5 + Math.random() * 2,
      p: Math.random() * TAU,
      v: 0.02 + Math.random() * 0.08,
      tint: Math.random() < 0.25,
    }))
  }
  resize()
  window.addEventListener('resize', resize)

  // 매번 같은 배치가 나오도록 고정 시드 난수를 쓴다.
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const rings = Array.from({ length: 7 }, (_, i) => {
    const count = rnd() < 0.45 ? 1 : rnd() < 0.7 ? 2 : 3
    const planets = Array.from({ length: count }, () => ({
      a: rnd() * TAU,
      size: rnd() < 0.18 ? 3.5 + rnd() * 3.5 : 1.1 + rnd() * 1.8,
      sp:
        (0.32 / Math.sqrt(i + 1)) *
        (0.7 + rnd() * 0.6) *
        (rnd() < 0.15 ? -1 : 1),
    }))
    return {
      r: 50 + i * 52 + rnd() * 8,
      start: rnd() * TAU,
      len: rnd() < 0.35 ? Math.PI * (1.3 + rnd() * 0.5) : TAU,
      alpha: 0.22 + rnd() * 0.22,
      planets,
    }
  })

  let scene: SignupScene | null = null
  let sceneStart = 0
  let particles: Particle[] | null = null
  let satellite: Satellite | null = null
  let last = performance.now()
  let raf = 0

  const drawStars = (now: number) => {
    ctx.globalAlpha = 1
    for (const star of stars) {
      if (!reducedMotion) star.y -= star.v
      if (star.y < -2) {
        star.y = h + 2
        star.x = Math.random() * w
      }
      const a =
        star.a *
        (reducedMotion
          ? 1
          : 0.55 + 0.45 * Math.sin((now / 1000) * star.s + star.p))
      ctx.fillStyle = star.tint
        ? `rgba(172,153,215,${a})`
        : `rgba(235,237,249,${a})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.r, 0, TAU)
      ctx.fill()
      if (star.r > 1.4) {
        ctx.fillStyle = `rgba(144,153,209,${a * 0.15})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r * 4, 0, TAU)
        ctx.fill()
      }
    }
  }

  const frame = (now: number) => {
    const current = getScene()
    if (current !== scene) {
      scene = current
      sceneStart = now
      particles = null
      satellite = null
    }
    // 모션을 줄인 사용자에겐 연출이 끝난 장면을 멈춘 채로 보여준다.
    const dt = reducedMotion ? 0 : Math.min(0.033, (now - last) / 1000)
    last = now
    const ms = reducedMotion ? 10_000 : now - sceneStart
    const sec = reducedMotion ? 0 : now / 1000
    ctx.clearRect(0, 0, w, h)

    if (scene !== 'form') {
      const welcome = scene === 'welcome'
      const cx = w * 0.5
      const cy = h * 0.36
      const tilt = 0.3
      const tiltAngle = -0.16
      const scale = Math.min(1.3, Math.max(0.8, w / 380))
      const cos = Math.cos(tiltAngle)
      const sin = Math.sin(tiltAngle)
      const spin = sec * (welcome ? 0.08 : 0.03)
      const orbit = (radius: number, angle: number) =>
        [
          cx +
            Math.cos(angle) * radius * cos -
            Math.sin(angle) * radius * tilt * sin,
          cy +
            Math.cos(angle) * radius * sin +
            Math.sin(angle) * radius * tilt * cos,
        ] as const
      const drawSatellite = (
        x: number,
        y: number,
        trailColor: string,
        alpha: number,
      ) => {
        satellite ??= { a0: Math.PI * 0.85, trail: [] }
        satellite.trail.push([x, y])
        if (satellite.trail.length > 28) satellite.trail.shift()
        const { trail } = satellite
        ctx.lineWidth = 1.5
        ctx.strokeStyle = trailColor
        for (let i = 1; i < trail.length; i++) {
          ctx.globalAlpha = (i / trail.length) * 0.45 * alpha
          ctx.beginPath()
          ctx.moveTo(trail[i - 1][0], trail[i - 1][1])
          ctx.lineTo(trail[i][0], trail[i][1])
          ctx.stroke()
        }
      }

      if (welcome) {
        // 가운데 빛 구가 커지며 숨 쉰다.
        const radius =
          150 * scale * easeOut(ms / 1200) * (1 + 0.08 * Math.sin(sec * 2))
        const core = ctx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          Math.max(0.1, radius),
        )
        core.addColorStop(0, 'rgba(235,237,249,0.95)')
        core.addColorStop(0.08, 'rgba(144,153,209,0.75)')
        core.addColorStop(0.35, 'rgba(59,67,145,0.35)')
        core.addColorStop(1, 'rgba(34,41,109,0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = core
        ctx.beginPath()
        ctx.arc(cx, cy, Math.max(0.1, radius), 0, TAU)
        ctx.fill()

        // 궤도가 안쪽부터 차례로 그려지고, 다 그려질 즈음 행성이 나타난다.
        ctx.lineWidth = 1
        ctx.strokeStyle = RING
        rings.forEach((ring, ri) => {
          const radius = ring.r * scale
          const drawn = easeOut((ms - 300 - ri * 140) / 1100)
          if (drawn > 0) {
            ctx.globalAlpha = (ring.alpha + 0.12) * drawn
            ctx.beginPath()
            ctx.ellipse(
              cx,
              cy,
              radius,
              radius * tilt,
              tiltAngle,
              ring.start + spin,
              ring.start + spin + ring.len * drawn,
            )
            ctx.stroke()
          }
          const visible = easeOut((drawn - 0.5) / 0.5)
          for (const planet of ring.planets) {
            planet.a += planet.sp * dt * 1.6
            if (visible <= 0.01) continue
            const angle = planet.a + spin
            const [x, y] = orbit(radius, angle)
            const r =
              planet.size *
              Math.max(0.3, 1 + Math.sin(angle) * (1 - tilt) * 0.5) *
              scale
            if (planet.size > 3.4) {
              const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 5)
              halo.addColorStop(0, `rgba(172,153,215,${0.45 * visible})`)
              halo.addColorStop(1, 'rgba(172,153,215,0)')
              ctx.globalAlpha = 1
              ctx.fillStyle = halo
              ctx.beginPath()
              ctx.arc(x, y, r * 5, 0, TAU)
              ctx.fill()
            }
            ctx.globalAlpha = 0.9 * visible
            ctx.fillStyle = planet.size > 3.4 ? ACCENT : INK
            ctx.beginPath()
            ctx.arc(x, y, r, 0, TAU)
            ctx.fill()
          }
        })

        // 가운데서 퍼지는 입자.
        particles ??= Array.from({ length: 70 }, () => ({
          a: Math.random() * TAU,
          v: 40 + Math.random() * 160,
          s: 0.6 + Math.random() * 1.4,
          l: 0.9 + Math.random() * 0.9,
          tint: Math.random() < 0.3,
        }))
        const elapsed = ms / 1000
        for (const p of particles) {
          const life = elapsed / p.l
          if (life >= 1) continue
          const d = ((p.v * (1 - Math.exp(-elapsed * 2.2))) / 2.2) * scale
          ctx.globalAlpha = (1 - life) * 0.7
          ctx.fillStyle = p.tint ? ACCENT : INK
          ctx.beginPath()
          ctx.arc(
            cx + Math.cos(p.a) * d,
            cy + Math.sin(p.a) * d * (0.5 + tilt),
            p.s,
            0,
            TAU,
          )
          ctx.fill()
        }

        // 내 위성 — 바깥에서 돌며 들어와 네 번째 궤도에 안착한다.
        if (ms > 1800) {
          satellite ??= { a0: Math.PI * 0.85, trail: [] }
          const settle = easeOut((ms - 1800) / 2600)
          const radius = rings[3].r * scale * (1 + 1.6 * (1 - settle))
          const angle =
            satellite.a0 + settle * 2.6 + (Math.max(0, ms - 4400) / 1000) * 0.22
          const [x, y] = orbit(radius, angle)
          drawSatellite(x, y, RING, 1)
          const fade = Math.min(1, (ms - 1800) / 500)
          const pulse = 1 + 0.12 * Math.sin(sec * 2.4)
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 22 * pulse)
          glow.addColorStop(0, `rgba(144,153,209,${0.7 * fade})`)
          glow.addColorStop(1, 'rgba(144,153,209,0)')
          ctx.globalAlpha = 1
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(x, y, 22 * pulse, 0, TAU)
          ctx.fill()
          ctx.globalAlpha = fade
          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.arc(x, y, 3.6, 0, TAU)
          ctx.fill()
        }

        // 8초마다 오른쪽 위에서 왼쪽으로 혜성이 지나간다.
        const period = 8000
        const phase = ((((ms - 3000) % period) + period) % period) / 1400
        if (ms > 3000 && phase < 1) {
          const x0 = w * 1.05
          const y0 = h * 0.04
          const x1 = w * 0.15
          const y1 = h * 0.3
          const hx = x0 + (x1 - x0) * phase
          const hy = y0 + (y1 - y0) * phase
          const len = Math.hypot(x0 - x1, y0 - y1)
          const tx = hx + ((x0 - x1) / len) * 110
          const ty = hy + ((y0 - y1) / len) * 110
          const fade = Math.sin(phase * Math.PI)
          const tail = ctx.createLinearGradient(hx, hy, tx, ty)
          tail.addColorStop(0, `rgba(235,237,249,${0.7 * fade})`)
          tail.addColorStop(1, 'rgba(144,153,209,0)')
          ctx.globalAlpha = 1
          ctx.strokeStyle = tail
          ctx.lineWidth = 1.3
          ctx.beginPath()
          ctx.moveTo(hx, hy)
          ctx.lineTo(tx, ty)
          ctx.stroke()
          ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`
          ctx.beginPath()
          ctx.arc(hx, hy, 1.6, 0, TAU)
          ctx.fill()
        }
      } else {
        // 붉은 빛이 불안하게 깜빡인다.
        const flicker = reducedMotion
          ? 1
          : 0.8 + 0.2 * Math.sin(sec * 6.3) * Math.sin(sec * 2.1)
        const radius = Math.max(0.1, 95 * scale * easeOut(ms / 900))
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        core.addColorStop(0, `rgba(255,190,190,${0.6 * flicker})`)
        core.addColorStop(0.12, `rgba(255,122,122,${0.32 * flicker})`)
        core.addColorStop(1, 'rgba(255,122,122,0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = core
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, TAU)
        ctx.fill()

        // 궤도가 조각으로 나타났다가 벌어지며 흐려진다.
        ctx.strokeStyle = RING
        ctx.lineWidth = 1
        rings.forEach((ring, ri) => {
          const appear = easeOut((ms - 200 - ri * 90) / 700)
          if (appear <= 0) return
          const broken = easeOut((ms - 900 - ri * 70) / 2000)
          const radius = ring.r * scale * (1 + 0.1 * broken)
          const count = 5 + ri
          const arc = TAU / count
          for (let s = 0; s < count; s++) {
            const jitter = Math.sin(ri * 13.1 + s * 7.7) * 0.5
            const from = ring.start + spin + s * arc + broken * jitter
            ctx.globalAlpha = (ring.alpha + 0.1) * appear * (1 - 0.65 * broken)
            ctx.beginPath()
            ctx.ellipse(
              cx,
              cy,
              radius,
              radius * tilt,
              tiltAngle,
              from,
              from + arc * appear * (1 - 0.6 * broken),
            )
            ctx.stroke()
          }
        })

        // 위성이 다가오다 궤도를 벗어나 붉게 떨어진다.
        if (ms > 1600) {
          satellite ??= { a0: Math.PI * 0.85, trail: [] }
          const approach = easeOut((ms - 1600) / 1800)
          const fall = easeOut((ms - 3400) / 2400)
          const radius =
            rings[3].r * scale * (1 + 1.6 * (1 - approach) + 1.4 * fall)
          const angle = satellite.a0 + approach * 2.2 + fall * 0.8
          const [x, y0] = orbit(radius, angle)
          const y = y0 + fall * fall * 120
          const alpha = Math.min(1, (ms - 1600) / 500) * (1 - fall)
          const color = fall > 0 ? ERROR : RING
          drawSatellite(x, y, color, alpha)
          if (alpha > 0.01) {
            ctx.globalAlpha = alpha
            ctx.fillStyle = fall > 0 ? ERROR : '#FFFFFF'
            ctx.beginPath()
            ctx.arc(x, y, 3.2, 0, TAU)
            ctx.fill()
          }
        }
      }
    }

    drawStars(now)
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }
}

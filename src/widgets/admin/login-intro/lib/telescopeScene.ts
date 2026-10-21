// 관리자 로그인 왼쪽 장면 — 디자인 시안(AdminLoginTelescope.dc.html)을 옮긴 것.
// 동심원 궤도를 점들이 돌고, 관측 대상 별 주위를 망원경이 돌며 빛줄기와 신호를 쏜다.

// 캔버스는 CSS 변수를 못 읽어서 토큰 값을 고정해 쓴다(signupScene과 같은 방식).
// 망원경 몸체를 바탕색으로 칠해야 뒤의 궤도선이 비치지 않는다.
const BG = '#0F1215' // backgroundDark.base
const TAU = Math.PI * 2
// 천천히 도는 배경이라 30fps면 충분하다 — 120Hz 화면에서 네 배씩 그리지 않는다.
const FRAME_MS = 1000 / 30
// 선 위주 그림이라 1.5배 위로는 차이가 거의 안 보이고 칠할 면적만 는다.
const MAX_DPR = 1.5

type Dot = { r: number; a: number; s: number; alpha: number }

// 궤도 반지름과 점 배치 — 고정 시드 난수라 늘 같은 하늘이 나온다.
function buildSky() {
  let seed = 23
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const radii: number[] = []
  for (let r = 40; r < 3200; r += r < 300 ? 24 + rnd() * 18 : 44 + rnd() * 50) {
    radii.push(r)
  }
  // 관측 대상 별이 도는 궤도와 망원경 쪽 궤도엔 점을 두지 않는다.
  const targetR = radii.find((r) => r > 420) ?? radii[0]
  const reservedR = radii.find((r) => r > 820)
  const dots: Dot[] = []
  for (const r of radii) {
    const count =
      r < 300 ? 1 + Number(rnd() < 0.7) : 1 + Math.floor(rnd() * 2.6)
    for (let j = 0; j < count; j++) {
      const a = rnd() * TAU
      const s =
        r < 300 ? 2 + rnd() * 2.5 : rnd() < 0.25 ? 9 + rnd() * 9 : 3 + rnd() * 5
      if (r === targetR || r === reservedR) continue
      dots.push({ r, a, s, alpha: 0.7 + rnd() * 0.3 })
    }
  }
  return { radii, targetR, dots }
}

// 바깥 궤도일수록 느리다(케플러 3법칙 꼴).
const omega = (r: number) => 157 / Math.pow(r, 1.5)

export function startTelescopeScene(
  canvas: HTMLCanvasElement,
  reducedMotion: boolean,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const { radii, targetR, dots } = buildSky()
  // 궤도선은 크기가 바뀔 때만 다시 그리고 매 프레임엔 이 그림을 붙여 넣는다.
  const rings = document.createElement('canvas')
  const ringsCtx = rings.getContext('2d')

  let w = 0
  let h = 0
  let dpr = 1
  let u = 1
  let maxR = 0
  let t = 0

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = rings.width = w * dpr
    canvas.height = rings.height = h * dpr
    u = w > h ? h / 1300 : Math.min(w / 1080, h / 1920)
    const cx = w * 0.16
    const cy = h * 0.4
    maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) / u + 40
    if (ringsCtx) {
      ringsCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ringsCtx.translate(cx, cy)
      ringsCtx.scale(u, u)
      ringsCtx.strokeStyle = 'rgba(255,255,255,0.32)'
      ringsCtx.lineWidth = 1.5 / Math.max(u, 0.6)
      for (const r of radii) {
        if (r > maxR) break
        ringsCtx.beginPath()
        ringsCtx.arc(0, 0, r, 0, TAU)
        ringsCtx.stroke()
      }
    }
    draw()
  }

  const drawTelescope = (blink: number) => {
    const shape = (path: () => void, lineWidth = 3.6) => {
      ctx.beginPath()
      path()
      ctx.fillStyle = BG
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = lineWidth
      ctx.stroke()
    }
    const panel = (px: number, py: number, pw: number, ph: number) => {
      shape(() => ctx.rect(px, py, pw, ph), 3.2)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 1; k < 5; k++) {
        ctx.moveTo(px + (pw * k) / 5, py)
        ctx.lineTo(px + (pw * k) / 5, py + ph)
      }
      ctx.moveTo(px, py + ph / 2)
      ctx.lineTo(px + pw, py + ph / 2)
      ctx.stroke()
    }
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    // 태양전지판 지지대와 판
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3.2
    ctx.beginPath()
    ctx.moveTo(10, -30)
    ctx.lineTo(10, -150)
    ctx.moveTo(10, 30)
    ctx.lineTo(10, 150)
    ctx.stroke()
    panel(-60, -232, 140, 82)
    panel(-60, 150, 140, 82)
    // 몸통 — 앞쪽 원통, 뒤쪽 장비 칸, 뒤 덮개
    shape(() => ctx.rect(-150, -34, 150, 68))
    shape(() => ctx.rect(0, -44, 120, 88))
    shape(() => ctx.ellipse(120, 0, 14, 44, 0, 0, TAU))
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (const v of [-100, -50]) {
      ctx.moveTo(v, -34)
      ctx.lineTo(v, 34)
    }
    ctx.moveTo(60, -44)
    ctx.lineTo(60, 44)
    ctx.stroke()
    // 구경과 열린 덮개
    shape(() => ctx.ellipse(-150, 0, 10, 34, 0, 0, TAU))
    shape(() => {
      ctx.moveTo(-150, -34)
      ctx.lineTo(-200, -100)
      ctx.lineTo(-228, -84)
      ctx.lineTo(-170, -20)
      ctx.closePath()
    }, 3.4)
    // 안테나와 깜빡이는 표시등
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3.2
    ctx.beginPath()
    ctx.moveTo(60, -44)
    ctx.lineTo(78, -118)
    ctx.stroke()
    shape(() => ctx.arc(80, -128, 11, 0, TAU), 3.2)
    ctx.fillStyle = `rgba(255,255,255,${blink})`
    ctx.beginPath()
    ctx.arc(80, -128, 5, 0, TAU)
    ctx.fill()
  }

  const draw = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(rings, 0, 0)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.translate(w * 0.16, h * 0.4)
    ctx.scale(u, u)

    // 관측 대상 별과 그 주위를 도는 망원경
    const targetA = -0.55 + t * omega(targetR)
    const gx = targetR * Math.cos(targetA)
    const gy = targetR * Math.sin(targetA)
    const orbitR = 300
    const scopeA = 1.15 + t * 0.12
    const tx = gx + orbitR * Math.cos(scopeA)
    const ty = gy + orbitR * Math.sin(scopeA)
    ctx.setLineDash([3, 9])
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(gx, gy, orbitR, 0, TAU)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#fff'
    for (const dot of dots) {
      if (dot.r > maxR) continue
      const a = dot.a + t * omega(dot.r)
      ctx.globalAlpha = dot.alpha
      ctx.beginPath()
      ctx.arc(dot.r * Math.cos(a), dot.r * Math.sin(a), dot.s, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    const th = Math.atan2(ty - gy, tx - gx)
    const scale = 0.5
    const ux = Math.cos(th)
    const uy = Math.sin(th)
    const nx = -uy
    const ny = ux
    // 망원경 구경 위치 — 빛줄기가 여기로 들어온다.
    const ax = tx - ux * 150 * scale
    const ay = ty - uy * 150 * scale
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2)
    const reticleR = 64

    // 빛줄기와 망원경으로 날아가는 신호
    const beam = ctx.createLinearGradient(ax, ay, gx, gy)
    beam.addColorStop(0, `rgba(255,255,255,${0.08 + 0.05 * pulse})`)
    beam.addColorStop(1, 'rgba(255,255,255,0.02)')
    ctx.beginPath()
    ctx.moveTo(ax + nx * 17, ay + ny * 17)
    ctx.lineTo(gx + nx * reticleR, gy + ny * reticleR)
    ctx.lineTo(gx - nx * reticleR, gy - ny * reticleR)
    ctx.lineTo(ax - nx * 17, ay - ny * 17)
    ctx.closePath()
    ctx.fillStyle = beam
    ctx.fill()
    ctx.setLineDash([6, 8])
    ctx.lineDashOffset = t * 28
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(gx + nx * reticleR, gy + ny * reticleR)
    ctx.lineTo(ax + nx * 17, ay + ny * 17)
    ctx.moveTo(gx - nx * reticleR, gy - ny * reticleR)
    ctx.lineTo(ax - nx * 17, ay - ny * 17)
    ctx.stroke()
    ctx.fillStyle = '#fff'
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.35 + k / 3) % 1
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.9
      ctx.beginPath()
      ctx.arc(gx + (ax - gx) * p, gy + (ay - gy) * p, 2.4, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // 조준선
    ctx.setLineDash([6, 8])
    ctx.lineDashOffset = -t * 14
    ctx.beginPath()
    ctx.arc(gx, gy, reticleR, 0, TAU)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.save()
    ctx.translate(gx, gy)
    ctx.rotate(t * 0.25)
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2
      ctx.moveTo(Math.cos(a) * (reticleR + 8), Math.sin(a) * (reticleR + 8))
      ctx.lineTo(Math.cos(a) * (reticleR + 24), Math.sin(a) * (reticleR + 24))
    }
    ctx.stroke()
    ctx.restore()
    const ping = (t * 0.6) % 1
    ctx.beginPath()
    ctx.arc(gx, gy, 16 + ping * 46, 0, TAU)
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ping)})`
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(gx, gy, 30, 0, TAU)
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(gx, gy, 13, 0, TAU)
    ctx.fill()

    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(th)
    ctx.scale(scale, scale)
    drawTelescope(t % 2 < 0.18 ? 1 : 0.25)
    ctx.restore()
  }

  let raf = 0
  let last = 0
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (now - last < FRAME_MS) return
    // 탭을 오래 가렸다 돌아와도 한 번에 크게 건너뛰지 않는다.
    t += Math.min(0.1, (now - last) / 1000)
    last = now
    draw()
  }
  const play = () => {
    if (raf || reducedMotion) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }
  const pause = () => {
    cancelAnimationFrame(raf)
    raf = 0
  }

  // 모션을 줄인 사용자에겐 멈춘 장면 한 장만 그린다(resize가 다시 그린다).
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  // 모바일에서 폼 아래로 스크롤해 장면이 화면 밖으로 나가면 멈춘다.
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) play()
    else pause()
  })
  intersectionObserver.observe(canvas)

  return () => {
    pause()
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
  }
}

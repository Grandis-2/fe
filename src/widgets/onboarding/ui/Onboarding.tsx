import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

import { Button, Logo } from '@shared/ui'

import { createOrbitScene } from '../lib/orbitScene'

import * as styles from './Onboarding.css'

import type { SceneInput } from '../lib/orbitScene'

const steps = [
  {
    title: '알림 설정',
    description:
      '오픈 전에 알림을 신청하면, 잊지 않고 사전예약을 할 수 있어요.',
  },
  { title: '오픈 & 예약', description: '오픈 시간에 모델을 골라 예약해요.' },
  {
    title: '대기열',
    description:
      '대기열 창을 닫아도 5분 동안은 내 순서가 유지돼요. 그 사이 차례가 되면 예약 페이지로 자동 이동해요.',
  },
  {
    title: '안정성',
    description:
      '결제 버튼 한 번으로 예약과 결제가 함께 진행돼요. 접속이 몰려 결제가 완료되지 않아도 예약은 남아 있어요. 마이페이지에서 이어서 결제하면 돼요.',
  },
]
const LAST = steps.length - 1

// Onboarding.css.ts의 WIDE_QUERY와 같은 경계 — 캔버스 배치와 넘기는 방식(스크롤/스와이프)이 갈린다.
const WIDE_MIN_WIDTH = 860
// 이만큼 넘게 끌어야 다음/이전 단계로 넘어간다.
const SWIPE_THRESHOLD = 60
const SPRING_EASE = 'cubic-bezier(.3,1.65,.45,1)'

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export type OnboardingProps = {
  // 마지막 단계의 "시작하기"
  onFinish: () => void
}

export function Onboarding({ onFinish }: OnboardingProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragStartX = useRef(0)

  const [scene] = useState(createOrbitScene)
  const [reducedMotion] = useState(prefersReducedMotion)
  const [step, setStep] = useState(0)
  // 시작 로고: 0 대기 → 1 보임 → 2 사라지는 중. 모션을 줄인 사용자에겐 건너뛴다.
  const [intro, setIntro] = useState(!reducedMotion)
  const [splashPhase, setSplashPhase] = useState(0)
  const [wide, setWide] = useState(() => window.innerWidth >= WIDE_MIN_WIDTH)
  const [atTop, setAtTop] = useState(true)
  // 스와이프 중 끌어온 거리. null이면 끌고 있지 않다.
  const [dragX, setDragX] = useState<number | null>(null)

  // 캔버스 루프는 매 프레임 최신 값을 읽어야 해서 렌더와 별개로 ref에 둔다.
  const live = useRef<SceneInput>({
    step: 0,
    intro,
    wide,
    seg: 0,
    dx: 0,
    reducedMotion,
  })
  useEffect(() => {
    live.current.intro = intro
  }, [intro])

  const enterStep = (n: number) => {
    if (n === live.current.step) return
    scene.onStepChange(live.current.step, n)
    live.current.step = n
    setStep(n)
  }

  const scrollToStep = (n: number) => {
    const el = scrollerRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = el.offsetHeight - window.innerHeight
    window.scrollTo({
      top: top + span * ((n + 0.15) / steps.length),
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }

  // 넓은 화면은 스크롤 위치가 곧 단계라 스크롤을 옮기고, 좁은 화면은 단계를 바로 바꾼다.
  const goTo = (n: number) => {
    if (live.current.intro) return setIntro(false)
    const target = Math.max(0, Math.min(LAST, n))
    if (live.current.wide) scrollToStep(target)
    else enterStep(target)
  }

  useEffect(() => {
    if (!intro) return
    const timers = [
      setTimeout(() => setSplashPhase(1), 60),
      setTimeout(() => setSplashPhase(2), 2500),
      setTimeout(() => setIntro(false), 3100),
    ]
    return () => timers.forEach(clearTimeout)
  }, [intro])

  // 캔버스 크기 맞추기 + 그리기 루프.
  useEffect(() => {
    const frame = frameRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!frame || !canvas || !ctx) return

    let W = 0
    let H = 0
    let dpr = 1
    const resize = () => {
      const rect = frame.getBoundingClientRect()
      W = rect.width
      H = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = W * dpr
      canvas.height = H * dpr
      live.current.wide = W >= WIDE_MIN_WIDTH
      setWide(live.current.wide)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(frame)

    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      scene.draw(ctx, W, H, dpr, dt, live.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [scene])

  // 넓은 화면: 스크롤 진행률 → 단계. 스크롤을 시작하면 시작 로고도 걷는다.
  const readScroll = useEffectEvent(() => {
    const el = scrollerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const span = rect.height - window.innerHeight
    const progress = span > 0 ? Math.max(0, Math.min(1, -rect.top / span)) : 0
    if (live.current.intro && progress > 0.01) setIntro(false)
    const x = progress * steps.length
    const n = Math.min(LAST, Math.floor(x))
    live.current.seg = Math.min(1, x - n)
    enterStep(n)
    setAtTop(progress < 0.02)
  })
  useEffect(() => {
    if (!wide) return
    const onScroll = () => readScroll()
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [wide])

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    goTo(live.current.step + (e.key === 'ArrowRight' ? 1 : -1))
  })
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKeyDown(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  // 좁은 화면 스와이프. 버튼 위에서 시작한 포인터는 클릭으로 둔다.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (wide || intro || (e.target as Element).closest('button')) return
    dragStartX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragX(0)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragX === null) return
    let d = e.clientX - dragStartX.current
    // 처음/마지막 단계에서 더 갈 데가 없는 쪽으로는 덜 끌려 온다.
    if ((step === 0 && d > 0) || (step === LAST && d < 0)) d *= 0.3
    live.current.dx = d
    setDragX(d)
  }
  const onPointerUp = () => {
    if (dragX === null) return
    live.current.dx = 0
    setDragX(null)
    if (dragX < -SWIPE_THRESHOLD) goTo(step + 1)
    else if (dragX > SWIPE_THRESHOLD) goTo(step - 1)
  }

  const isLast = step === LAST
  const uiOpacity = intro ? 0 : 1
  const textTransition = (delay: number) =>
    dragX !== null
      ? 'none'
      : `transform .85s ${SPRING_EASE} ${delay}s, opacity .35s, filter .4s`
  // 단계 문구는 넓은 화면에선 위아래로, 좁은 화면에선 좌우로 밀려 들어온다.
  const blockMotion = (i: number) => {
    if (intro) return { opacity: 0, offset: [70, 80, 90], blur: 6 }
    const d = i - step
    const base = wide ? d * 48 : d * 70 + (dragX ?? 0) * 0.55
    return {
      opacity: d === 0 ? 1 : 0,
      offset: [base, base * 1.15, base * 1.3],
      blur: d === 0 ? 0 : 6,
    }
  }
  const lineStyle = (motion: ReturnType<typeof blockMotion>, line: number) => ({
    transform: wide
      ? `translateY(${motion.offset[line]}px)`
      : `translateX(${motion.offset[line]}px)`,
    filter: `blur(${motion.blur}px)`,
    transition: textTransition([0, 0.04, 0.09][line]),
  })

  return (
    <div ref={scrollerRef} className={styles.scroller}>
      <div
        ref={frameRef}
        className={styles.frame}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
        <div className={styles.fade} />

        <button
          type="button"
          className={styles.splash}
          aria-label="인트로 건너뛰기"
          aria-hidden={!intro}
          tabIndex={intro ? 0 : -1}
          style={{
            opacity: intro && splashPhase === 1 ? 1 : 0,
            pointerEvents: intro ? 'auto' : 'none',
          }}
          onClick={() => setIntro(false)}
        >
          <Logo className={styles.splashLogo} />
        </button>

        <div className={styles.topBar} style={{ opacity: uiOpacity }}>
          <Logo className={styles.topLogo} />
          {/* 시안의 글자 버튼 모양을 살리려고 공용 Button 대신 직접 그린다. */}
          <button
            type="button"
            className={styles.skip}
            style={{ opacity: isLast ? 0 : 1 }}
            tabIndex={isLast ? -1 : 0}
            onClick={() => goTo(LAST)}
          >
            건너뛰기
          </button>
        </div>

        <div className={styles.textBox}>
          {steps.map(({ title, description }, i) => {
            const motion = blockMotion(i)
            return (
              <div
                key={title}
                className={styles.block}
                style={{ opacity: motion.opacity }}
                aria-hidden={intro || i !== step}
              >
                <div className={styles.kicker} style={lineStyle(motion, 0)}>
                  STEP {String(i + 1).padStart(2, '0')}
                </div>
                <div className={styles.stepTitle} style={lineStyle(motion, 1)}>
                  {title}
                </div>
                <div
                  className={styles.stepDescription}
                  style={lineStyle(motion, 2)}
                >
                  {description}
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.controls} style={{ opacity: uiOpacity }}>
          <div className={styles.pills} aria-hidden>
            {steps.map(({ title }, i) => (
              <div
                key={title}
                className={styles.pill}
                style={{
                  width: i === step ? 24 : 6,
                  opacity: i === step ? 1 : 0.35,
                }}
              />
            ))}
          </div>
          <Button
            size="large"
            rounded
            style={{ minWidth: isLast ? 132 : 96 }}
            onClick={() => (isLast ? onFinish() : goTo(step + 1))}
          >
            {isLast ? '시작하기' : '다음'}
          </Button>
        </div>

        <div
          className={styles.hint}
          style={{ opacity: atTop && !intro ? 1 : 0 }}
          aria-hidden
        >
          <span>SCROLL</span>
          <span className={styles.hintArrow}>↓</span>
        </div>
      </div>
    </div>
  )
}

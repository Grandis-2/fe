import { useEffect, useRef } from 'react'

import SimplexNoise from '@shared/lib/simplexNoise'

import * as styles from './SwirlBackground.css'

// Ported from AmbientCanvasBackgrounds-master (Codrops "Swirl" demo, js/swirl.js + js/util.js).
const PARTICLE_COUNT = 700
const PARTICLE_PROP_COUNT = 9
const PARTICLE_PROPS_LENGTH = PARTICLE_COUNT * PARTICLE_PROP_COUNT
const RANGE_Y = 500
const BASE_TTL = 50
const RANGE_TTL = 150
const BASE_SPEED = 0.1
const RANGE_SPEED = 2
const BASE_RADIUS = 1
const RANGE_RADIUS = 4
const BASE_HUE = 200
const RANGE_HUE = 40
const NOISE_STEPS = 8
const X_OFF = 0.00125
const Y_OFF = 0.00125
const Z_OFF = 0.0005
const BACKGROUND_COLOR = 'hsla(220,40%,5%,1)'
const TAU = 2 * Math.PI

const rand = (n: number) => n * Math.random()
const randRange = (n: number) => n - rand(2 * n)
const lerp = (n1: number, n2: number, speed: number) =>
  (1 - speed) * n1 + speed * n2
const fadeInOut = (t: number, m: number) => {
  const hm = 0.5 * m
  return Math.abs(((t + hm) % m) - hm) / hm
}

export function SwirlBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvasA = document.createElement('canvas')
    const canvasB = document.createElement('canvas')
    canvasB.style.position = 'absolute'
    canvasB.style.top = '0'
    canvasB.style.left = '0'
    canvasB.style.width = '100%'
    canvasB.style.height = '100%'
    container.appendChild(canvasB)

    const rawCtxA = canvasA.getContext('2d')
    const rawCtxB = canvasB.getContext('2d')
    if (!rawCtxA || !rawCtxB) return
    const ctxA = rawCtxA
    const ctxB = rawCtxB

    const center = [0, 0]
    const simplex = new SimplexNoise()
    const particleProps = new Float32Array(PARTICLE_PROPS_LENGTH)
    let tick = 0
    let rafId = 0

    function initParticle(i: number) {
      const x = rand(canvasA.width)
      const y = center[1] + randRange(RANGE_Y)
      const ttl = BASE_TTL + rand(RANGE_TTL)
      const speed = BASE_SPEED + rand(RANGE_SPEED)
      const radius = BASE_RADIUS + rand(RANGE_RADIUS)
      const hue = BASE_HUE + rand(RANGE_HUE)
      particleProps.set([x, y, 0, 0, 0, ttl, speed, radius, hue], i)
    }

    function checkBounds(x: number, y: number) {
      return x > canvasA.width || x < 0 || y > canvasA.height || y < 0
    }

    function drawParticle(
      x: number,
      y: number,
      x2: number,
      y2: number,
      life: number,
      ttl: number,
      radius: number,
      hue: number,
    ) {
      ctxA.save()
      ctxA.lineCap = 'round'
      ctxA.lineWidth = radius
      ctxA.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`
      ctxA.beginPath()
      ctxA.moveTo(x, y)
      ctxA.lineTo(x2, y2)
      ctxA.stroke()
      ctxA.closePath()
      ctxA.restore()
    }

    function updateParticle(i: number) {
      const i2 = 1 + i
      const i3 = 2 + i
      const i4 = 3 + i
      const i5 = 4 + i
      const i6 = 5 + i
      const i7 = 6 + i
      const i8 = 7 + i
      const i9 = 8 + i

      const x = particleProps[i]
      const y = particleProps[i2]
      const n =
        simplex.noise3D(x * X_OFF, y * Y_OFF, tick * Z_OFF) * NOISE_STEPS * TAU
      const vx = lerp(particleProps[i3], Math.cos(n), 0.5)
      const vy = lerp(particleProps[i4], Math.sin(n), 0.5)
      const life = particleProps[i5] + 1
      const ttl = particleProps[i6]
      const speed = particleProps[i7]
      const x2 = x + vx * speed
      const y2 = y + vy * speed
      const radius = particleProps[i8]
      const hue = particleProps[i9]

      drawParticle(x, y, x2, y2, life, ttl, radius, hue)

      particleProps[i] = x2
      particleProps[i2] = y2
      particleProps[i3] = vx
      particleProps[i4] = vy
      particleProps[i5] = life

      if (checkBounds(x, y) || life > ttl) initParticle(i)
    }

    function drawParticles() {
      for (let i = 0; i < PARTICLE_PROPS_LENGTH; i += PARTICLE_PROP_COUNT) {
        updateParticle(i)
      }
    }

    function resize() {
      const width = container!.clientWidth
      const height = container!.clientHeight

      canvasA.width = width
      canvasA.height = height
      ctxA.drawImage(canvasB, 0, 0)

      canvasB.width = width
      canvasB.height = height
      ctxB.drawImage(canvasA, 0, 0)

      center[0] = 0.5 * canvasA.width
      center[1] = 1 * canvasA.height
    }

    function renderGlow() {
      ctxB.save()
      ctxB.filter = 'blur(8px) brightness(200%)'
      ctxB.globalCompositeOperation = 'lighter'
      ctxB.drawImage(canvasA, 0, 0)
      ctxB.restore()

      ctxB.save()
      ctxB.filter = 'blur(4px) brightness(200%)'
      ctxB.globalCompositeOperation = 'lighter'
      ctxB.drawImage(canvasA, 0, 0)
      ctxB.restore()
    }

    function renderToScreen() {
      ctxB.save()
      ctxB.globalCompositeOperation = 'lighter'
      ctxB.drawImage(canvasA, 0, 0)
      ctxB.restore()
    }

    function draw() {
      tick++

      ctxA.clearRect(0, 0, canvasA.width, canvasA.height)

      ctxB.fillStyle = BACKGROUND_COLOR
      ctxB.fillRect(0, 0, canvasA.width, canvasA.height)

      drawParticles()
      renderGlow()
      renderToScreen()

      rafId = window.requestAnimationFrame(draw)
    }

    resize()
    for (let i = 0; i < PARTICLE_PROPS_LENGTH; i += PARTICLE_PROP_COUNT) {
      initParticle(i)
    }
    draw()

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      window.cancelAnimationFrame(rafId)
      canvasB.remove()
    }
  }, [])

  return <div ref={containerRef} className={styles.root} />
}

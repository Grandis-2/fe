import { useCallback, useId, useRef } from 'react'

import {
  fallAt,
  MERIDIAN_COUNT,
  meridianPath,
  RING_COUNT,
  ringPath,
  STARS,
  TRAIL_COUNT,
  WELL_BOTTOM,
} from '../../lib/blackHole'
import { useFrameLoop } from '../../lib/useFrameLoop'

import * as styles from './BlackHoleScene.css'

const [bottomX, bottomY] = WELL_BOTTOM
const labelX = bottomX + 26
const labelY = bottomY - 30

// 500 배경 — 격자가 우물 바닥으로 흘러 들고, 빨간 신호 하나가 소용돌이치며 떨어진다.
export function BlackHoleScene() {
  // 같은 화면에 두 번 그려도(스토리북) 마스크 id가 겹치지 않게 한다.
  const id = useId()
  const fadeId = `${id}-fade`
  const maskId = `${id}-mask`

  const rings = useRef<(SVGPathElement | null)[]>([])
  const meridians = useRef<(SVGPathElement | null)[]>([])
  const trail = useRef<(SVGPathElement | null)[]>([])
  const signal = useRef<SVGCircleElement>(null)

  const draw = useCallback((t: number) => {
    const flow = (t * 0.28) % 1
    const spin = t * 0.05
    rings.current.forEach((el, i) => {
      el?.setAttribute('d', ringPath(i, flow))
      // 맨 바깥 고리는 새로 생겨나는 중이라 흐른 만큼만 보인다.
      el?.setAttribute('stroke-opacity', String((i === 0 ? flow : 1) * 0.9))
    })
    meridians.current.forEach((el, m) =>
      el?.setAttribute('d', meridianPath(m, spin)),
    )

    const cur = fallAt(t, spin)
    const opacity =
      cur.s < 0.05
        ? cur.s / 0.05
        : cur.s > 0.8
          ? Math.max(0, (1 - cur.s) / 0.2)
          : 1
    signal.current?.setAttribute('cx', String(cur.p[0]))
    signal.current?.setAttribute('cy', String(cur.p[1]))
    signal.current?.setAttribute('opacity', String(opacity))

    // 꼬리 — 조금 전 위치들을 이어 그린다. 다시 처음부터 떨어지기 시작한 구간은 끊는다.
    let prev = cur
    trail.current.forEach((el, j) => {
      const q = fallAt(t - (j + 1) * 0.12, spin)
      if (q.s > prev.s) {
        el?.setAttribute('d', '')
      } else {
        el?.setAttribute(
          'd',
          `M${q.p[0].toFixed(1)} ${q.p[1].toFixed(1)}L${prev.p[0].toFixed(1)} ${prev.p[1].toFixed(1)}`,
        )
        el?.setAttribute('opacity', String(opacity * (1 - j / TRAIL_COUNT)))
      }
      prev = q
    })
  }, [])

  useFrameLoop(draw, 3)

  return (
    <svg
      className={styles.root}
      viewBox="-330 -210 660 420"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        {/* 우물 바닥 근처는 별과 격자를 지워 빨려 든 것처럼 보이게 한다. */}
        <radialGradient
          id={fadeId}
          gradientUnits="userSpaceOnUse"
          cx={bottomX}
          cy={bottomY}
          r={170}
        >
          <stop offset="0" stopColor="#000" />
          <stop offset="0.22" stopColor="#000" />
          <stop offset="0.75" stopColor="#fff" />
        </radialGradient>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={-400}
          y={-300}
          width={800}
          height={600}
        >
          <rect
            x={-400}
            y={-300}
            width={800}
            height={600}
            fill={`url(#${fadeId})`}
          />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            className={styles.star}
            fillOpacity={s.o}
          />
        ))}
      </g>
      <g mask={`url(#${maskId})`} className={styles.grid}>
        {Array.from({ length: RING_COUNT }, (_, i) => (
          <path
            key={i}
            ref={(el) => {
              rings.current[i] = el
            }}
          />
        ))}
        {Array.from({ length: MERIDIAN_COUNT }, (_, m) => (
          <path
            key={m}
            ref={(el) => {
              meridians.current[m] = el
            }}
            strokeOpacity={0.85}
          />
        ))}
      </g>

      <g>
        {Array.from({ length: TRAIL_COUNT }, (_, j) => (
          <path
            key={j}
            ref={(el) => {
              trail.current[j] = el
            }}
            className={styles.trail}
            strokeWidth={2.2 - j * 0.15}
          />
        ))}
        <circle ref={signal} r={2.4} className={styles.signal} />
      </g>

      <g>
        <line
          x1={bottomX + 4}
          y1={bottomY - 4}
          x2={labelX}
          y2={labelY}
          className={styles.leader}
        />
        <line
          x1={labelX}
          y1={labelY}
          x2={labelX + 64}
          y2={labelY}
          className={styles.leader}
        />
        <text x={labelX + 4} y={labelY - 5} className={styles.label}>
          ERR 500
        </text>
        <text x={labelX + 4} y={labelY + 9} className={styles.labelAccent}>
          SIGNAL LOST
        </text>
      </g>
    </svg>
  )
}

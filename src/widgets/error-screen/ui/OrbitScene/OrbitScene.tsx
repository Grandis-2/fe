import { useCallback, useRef } from 'react'

import {
  anomalyAt,
  arcPath,
  LOST_FROM,
  lostObjectAt,
  ORBITS,
  project,
  TAU,
} from '../../lib/orbit'
import { useFrameLoop } from '../../lib/useFrameLoop'

import * as styles from './OrbitScene.css'

const TRAIL_SEGMENTS = 8
// 궤도선은 움직이지 않으니 한 번만 계산한다.
const ORBIT_PATHS = ORBITS.map((o) => arcPath(o, 0, TAU, 180) + 'Z')
// 안쪽 행성 궤도일수록 진하게.
const orbitOpacity = (i: number) => (i < 7 ? 0.42 : i < 13 ? 0.3 : 0.2)

// 404 배경 — 행성은 궤도를 돌고, 궤도를 벗어난 물체(OBJ 404) 하나가 밖으로 떠난다.
export function OrbitScene() {
  const dots = useRef<(SVGCircleElement | null)[]>([])
  const trails = useRef<(SVGPathElement | null)[][]>(ORBITS.map(() => []))
  const lost = useRef<SVGGElement>(null)
  const lostTrail = useRef<SVGLineElement>(null)

  const draw = useCallback((t: number) => {
    ORBITS.forEach((o, i) => {
      if (!o.size) return
      const nu = anomalyAt(o, t)
      const [x, y] = project(o, nu)
      dots.current[i]?.setAttribute('cx', String(x))
      dots.current[i]?.setAttribute('cy', String(y))
      // 꼬리는 조각마다 진하기가 달라 TRAIL_SEGMENTS개 path로 나눠 그린다.
      const step = o.trail / TRAIL_SEGMENTS
      trails.current[i].forEach((el, j) => {
        const from = nu - o.trail + j * step
        el?.setAttribute('d', arcPath(o, from, from + step + 0.004, 4))
      })
    })
    const l = lostObjectAt(t)
    lost.current?.setAttribute('transform', `translate(${l.x} ${l.y})`)
    lost.current?.setAttribute('opacity', String(l.opacity))
    lostTrail.current?.setAttribute('x2', String(l.x))
    lostTrail.current?.setAttribute('y2', String(l.y))
    lostTrail.current?.setAttribute('opacity', String(l.opacity * 0.6))
  }, [])

  useFrameLoop(draw, 9)

  return (
    <svg
      className={styles.root}
      viewBox="-330 -210 660 420"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g transform="translate(20 -30)">
        {ORBIT_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            className={styles.line}
            strokeOpacity={orbitOpacity(i)}
          />
        ))}
        {ORBITS.map((o, i) =>
          o.trail ? (
            <g key={i}>
              {Array.from({ length: TRAIL_SEGMENTS }, (_, j) => {
                const k = (j + 1) / TRAIL_SEGMENTS
                return (
                  <path
                    key={j}
                    ref={(el) => {
                      trails.current[i][j] = el
                    }}
                    className={styles.trail}
                    strokeOpacity={0.15 + 0.85 * k}
                    strokeWidth={1 + 1.2 * k}
                  />
                )
              })}
            </g>
          ) : null,
        )}

        <circle r={9} className={styles.line} strokeOpacity={0.35} />
        <circle r={4.6} className={styles.sun} />

        {ORBITS.map((o, i) =>
          o.size ? (
            <circle
              key={i}
              ref={(el) => {
                dots.current[i] = el
              }}
              r={o.size}
              className={o.trail ? styles.planet : styles.innerPlanet}
            />
          ) : null,
        )}

        <line
          ref={lostTrail}
          x1={LOST_FROM.x}
          y1={LOST_FROM.y}
          x2={LOST_FROM.x}
          y2={LOST_FROM.y}
          className={styles.lostPath}
        />
        <g ref={lost}>
          <circle r={7} className={styles.lostGlow} />
          <circle r={2.6} className={styles.lost} />
          <text x={12} y={-2} className={styles.label}>
            OBJ 404
          </text>
          <text x={12} y={7} className={styles.labelAccent}>
            OFF ORBIT
          </text>
        </g>
      </g>
    </svg>
  )
}

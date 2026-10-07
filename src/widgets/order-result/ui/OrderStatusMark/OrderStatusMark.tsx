import { useId, type CSSProperties } from 'react'

import { color, onDark } from '@shared/config/theme'

import * as styles from './OrderStatusMark.css'

export type OrderStatusTone = keyof typeof styles.tone

type OrderStatusMarkProps = {
  tone: OrderStatusTone
}

// 궤도를 도는 점(SMIL)은 CSS 미디어 쿼리로 못 멈춰서 처음 한 번 읽어 둔다.
const reduceMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches

const ellipse = (rx: number, ry: number) =>
  `M ${-rx} 0 A ${rx} ${ry} 0 1 0 ${rx} 0 A ${rx} ${ry} 0 1 0 ${-rx} 0`

// [가로 반지름, 세로 반지름, 한 바퀴 초, 점 반지름, 시작 위치(0~1)] — 바깥 궤도부터.
const ORBITS = [
  [112, 38, 16, 2.4, 0.5],
  [82, 28, 11, 1.8, 0.2],
  [54, 19, 7, 1.6, 0.65],
] as const

const drawStyle = (len: number, dur: number, delay: number, ease?: string) =>
  ({
    '--len': len,
    '--dur': `${dur}s`,
    '--delay': `${delay}s`,
    '--ease': ease,
  }) as CSSProperties

// 행성 고리 — 뒤쪽 반원을 행성보다 먼저, 앞쪽 반원을 나중에 그려 행성을 감싸 보이게 한다.
function Band({ front }: { front?: boolean }) {
  const arc = (rx: number, ry: number) =>
    front
      ? `M ${rx} 0 A ${rx} ${ry} 0 0 1 ${-rx} 0`
      : `M ${-rx} 0 A ${rx} ${ry} 0 0 1 ${rx} 0`
  return (
    <g transform="rotate(-14)" fill="none" stroke="currentColor">
      <path d={arc(42, 9)} strokeWidth={3} strokeOpacity={front ? 0.55 : 0.3} />
      <path
        d={arc(36, 7.5)}
        strokeWidth={1}
        strokeOpacity={front ? 0.3 : 0.18}
      />
    </g>
  )
}

function Glyph({ tone, clipId }: OrderStatusMarkProps & { clipId: string }) {
  if (tone === 'success') {
    return (
      <path
        d="M-8 0.5l5.5 5.5L9 -6"
        className={styles.draw}
        style={drawStyle(26, 0.6, 0.3, 'cubic-bezier(.6,0,.3,1)')}
      />
    )
  }
  if (tone === 'pending') {
    return (
      <g>
        <circle
          r={10}
          className={styles.draw}
          style={drawStyle(63, 0.7, 0.3)}
        />
        <path d="M0 0V-6" className={styles.hand} />
        <path d="M0 0h4" opacity={0.7} />
      </g>
    )
  }
  // 실패 — 행성에 금이 간다.
  return (
    <g clipPath={`url(#${clipId})`}>
      <path
        d="M-4 -25 L-1 -14 L-6 -6 L2 1 L-2 8 L4 15 L1 25"
        strokeWidth={1.8}
        className={styles.draw}
        style={drawStyle(60, 0.7, 0.3, 'cubic-bezier(.7,0,.3,1)')}
      />
      <path
        d="M-6 -6 L-14 -4 L-19 -10"
        strokeWidth={1.2}
        className={styles.draw}
        style={drawStyle(20, 0.3, 0.7)}
      />
      <path
        d="M2 1 L11 -2 L17 3 L24 1"
        strokeWidth={1.2}
        className={styles.draw}
        style={drawStyle(26, 0.35, 0.8)}
      />
      <path
        d="M-2 8 L-10 12"
        strokeWidth={1}
        className={styles.draw}
        style={drawStyle(10, 0.2, 1)}
      />
      <path
        d="M4 15 L10 19"
        strokeWidth={1}
        className={styles.draw}
        style={drawStyle(8, 0.2, 1.05)}
      />
    </g>
  )
}

// 주문 결과 화면 맨 위의 상태 표시 — 궤도를 두른 행성 위에 완료(체크)/대기(시계)/실패(금)를 그린다.
export function OrderStatusMark({ tone }: OrderStatusMarkProps) {
  // 한 화면에 둘 이상 떠도 그라데이션·클립 id가 겹치지 않게 한다.
  const id = useId()
  const isFailure = tone === 'failure'

  return (
    <svg
      // tone이 바뀌면 다시 그려지는 애니메이션을 처음부터 보여 준다.
      key={tone}
      width={260}
      height={150}
      viewBox="-130 -75 260 150"
      aria-hidden="true"
      className={[styles.root, styles.tone[tone]].join(' ')}
    >
      <defs>
        <radialGradient id={`${id}core`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}planet`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.32} />
          <stop
            offset="55%"
            style={{ stopColor: color.backgroundDark.surface }}
          />
          <stop
            offset="100%"
            style={{ stopColor: color.backgroundDark.base }}
          />
        </radialGradient>
        <clipPath id={`${id}clip`}>
          <circle r={23.5} />
        </clipPath>
      </defs>

      <circle r={58} fill={`url(#${id}core)`} />

      <g transform="rotate(-14)">
        {ORBITS.map(([rx, ry, dur, r, phase], index) => {
          const d = ellipse(rx, ry)
          return (
            <g key={rx}>
              <path
                d={d}
                fill="none"
                strokeWidth={1}
                style={{ stroke: onDark(16 - index * 3) }}
                strokeDasharray={
                  index === 0 ? '260 120' : isFailure ? '3 5' : undefined
                }
              />
              {/* 가장 바깥 점만 상태 색, 나머지는 흰 점 — 실패면 멈추고 흐려진다. */}
              <circle
                r={r}
                fill="currentColor"
                style={index === 0 ? undefined : { fill: onDark(90) }}
                opacity={isFailure ? 0.35 : 0.9}
              >
                {!isFailure && !reduceMotion && (
                  <animateMotion
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                    path={d}
                    begin={`-${dur * phase}s`}
                  />
                )}
              </circle>
            </g>
          )
        })}
      </g>

      <Band />
      <circle
        r={24}
        fill={`url(#${id}planet)`}
        stroke="currentColor"
        strokeOpacity={0.35}
        strokeWidth={1}
      />
      <Band front />

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Glyph tone={tone} clipId={`${id}clip`} />
      </g>
    </svg>
  )
}

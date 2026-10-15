import { onDark } from '@shared/config/theme'

import { activeStroke } from '../../lib/activeStroke'
import { useElementWidth } from '../../lib/useElementWidth'
import { REPO, TEAM } from '../../model/team'
import * as orbitStyles from '../FooterOrbit/FooterOrbit.css'
import { GithubMark } from '../GithubMark'

import * as styles from './FooterOrbitMobile.css'

const SIZE = styles.ORBIT_SIZE
const C = SIZE / 2
const RADII = [22, 34, 46, 60, 76, 94, 114, 136, 160, 186, 214, 246]
// 팀원 행성 자리 — [궤도 반지름, 각도(도)]
const POSITIONS: Record<string, [number, number]> = {
  fe0: [60, -50],
  fe1: [76, 130],
  be0: [94, 20],
  be1: [114, -150],
  be2: [136, 80],
  be3: [160, -80],
  be4: [160, 125],
}

// 궤도마다 장식 점 두 개 — 시드 고정 난수라 그릴 때마다 같은 자리다.
const DECO = (() => {
  let seed = 11
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  return RADII.flatMap((r) =>
    [0, 1].map(() => {
      const angle = random() * Math.PI * 2
      return {
        x: C + r * Math.cos(angle),
        y: C + r * Math.sin(angle),
        size: random() < 0.2 ? 3 : 1.2 + random() * 1.3,
      }
    }),
  )
})()

const spinStyle = (seconds: number, reverse = false) => ({
  animationDuration: `${seconds}s`,
  animationDirection: reverse ? 'reverse' : 'normal',
  transformOrigin: `${C}px ${C}px`,
})

export type FooterOrbitMobileProps = {
  activeId: string
  onToggle: (id: string) => void
}

// 모바일 푸터의 원형 궤도 — 웹처럼 행성마다 이름표가 붙고, 행성을 누르면 그 팀원을 고른다.
export function FooterOrbitMobile({
  activeId,
  onToggle,
}: FooterOrbitMobileProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  // 360px 원을 화면 폭에 맞춰 240~360px로 줄인다.
  const size = Math.min(SIZE, Math.max(240, width || SIZE))
  const scale = size / SIZE
  const repoSize = 48 / Math.max(scale, 0.8)
  const activeRadius = POSITIONS[activeId]?.[0]

  return (
    <div ref={ref} className={styles.wrapper}>
      <div className={styles.frame} style={{ width: size, height: size }}>
        <div className={styles.canvas} style={{ transform: `scale(${scale})` }}>
          <svg
            className={styles.svg}
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            aria-hidden="true"
          >
            {RADII.map((r, i) => {
              const isPartial = i % 4 === 2 || i % 5 === 4
              const isActive = r === activeRadius
              const ring = (
                <circle
                  cx={C}
                  cy={C}
                  r={r}
                  fill="none"
                  style={{
                    stroke: isActive
                      ? activeStroke(85)
                      : onDark(28 + (i % 3) * 10),
                  }}
                  strokeWidth={isActive ? 1.4 : 1}
                  pathLength={100}
                  strokeDasharray={isPartial ? '68 32' : undefined}
                />
              )
              // 끊긴 점선 궤도만 돈다.
              return isPartial ? (
                <g key={r} transform={`rotate(${i * 47} ${C} ${C})`}>
                  <g
                    className={orbitStyles.spinning}
                    style={spinStyle(50 + i * 7, i % 2 === 1)}
                  >
                    {ring}
                  </g>
                </g>
              ) : (
                <g key={r}>{ring}</g>
              )
            })}
            <g className={orbitStyles.spinning} style={spinStyle(120)}>
              {DECO.map(({ x, y, size: dot }, index) => (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={dot}
                  style={{ fill: onDark(90) }}
                />
              ))}
            </g>
          </svg>

          {TEAM.map((member) => {
            const [r, degree] = POSITIONS[member.id]
            const angle = (degree * Math.PI) / 180
            const x = C + r * Math.cos(angle)
            const isActive = member.id === activeId
            // 왼쪽 반원 행성은 이름표가 원 밖으로 잘리지 않게 왼쪽에 단다.
            const isLabelLeft = x < C
            return (
              <button
                key={member.id}
                type="button"
                className={orbitStyles.satellite}
                style={{
                  left: x,
                  top: C + r * Math.sin(angle),
                  zIndex: isActive ? 3 : 2,
                }}
                aria-label={`${member.name} 상세 보기`}
                aria-pressed={isActive}
                onClick={() => onToggle(member.id)}
              >
                {/* 줄어든 원에서도 손가락 영역은 44px을 지킨다. */}
                <span
                  className={orbitStyles.centered}
                  style={{ width: 44 / scale, height: 44 / scale }}
                />
                <span className={orbitStyles.planet} />
                <span
                  className={orbitStyles.label}
                  data-side={isLabelLeft ? 'left' : 'right'}
                  style={{
                    transform: `scale(${1 / scale}) translate(${isLabelLeft ? 'calc(-100% - 12px)' : '12px'}, -50%)`,
                  }}
                >
                  <span className={orbitStyles.labelName}>{member.name}</span>
                  <span className={orbitStyles.labelHandle}>
                    @{member.handle}
                  </span>
                </span>
              </button>
            )
          })}

          <a
            href={REPO.url}
            target="_blank"
            rel="noopener noreferrer"
            className={[orbitStyles.repo, styles.repoBorder].join(' ')}
            style={{ left: C, top: C, width: repoSize, height: repoSize }}
            aria-label="GitHub 저장소"
          >
            <GithubMark size={22} />
          </a>
          <span
            className={styles.repoLabel}
            style={{
              left: C,
              top: C + repoSize / 2 + 6,
              transform: `scale(${1 / scale}) translateX(-50%)`,
            }}
          >
            <span className={styles.repoName}>{REPO.label}</span>
            <span className={styles.repoCaption}>github</span>
          </span>
        </div>
      </div>
    </div>
  )
}

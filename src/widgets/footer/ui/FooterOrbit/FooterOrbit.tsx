import { onDark } from '@shared/config/theme'

import { activeStroke } from '../../lib/activeStroke'
import { useElementWidth } from '../../lib/useElementWidth'
import { REPO, TEAM } from '../../model/team'
import { GithubMark } from '../GithubMark'

import * as styles from './FooterOrbit.css'

const W = styles.ORBIT_WIDTH
const H = styles.ORBIT_HEIGHT
// 궤도 중심은 왼쪽에 두고 오른쪽으로 크게 펼친다.
const CX = 150
const CY = 190
const RADII = [
  36, 58, 74, 96, 120, 150, 180, 214, 250, 300, 350, 410, 480, 560, 650, 750,
  860, 980,
]
// 팀원 행성 자리 — [궤도 반지름, 각도(도)]
const POSITIONS: Record<string, [number, number]> = {
  fe0: [214, -31],
  fe1: [250, 28],
  be0: [410, -18],
  be1: [480, 0],
  be2: [410, 18],
  be3: [650, -7],
  be4: [650, 8],
}
const MEMBER_RADII = new Set(Object.values(POSITIONS).map(([r]) => r))

// 궤도 위 장식 점 — 시드 고정 난수라 그릴 때마다 같은 자리다.
const DECO = (() => {
  let seed = 7
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  return RADII.flatMap((r) =>
    Array.from({ length: 1 + Math.floor(random() * 3) }, () => {
      const angle = random() * Math.PI * 2
      const size = random() < 0.2 ? 4 + random() * 3 : 1.2 + random() * 2
      return {
        x: CX + r * Math.cos(angle),
        y: CY + r * Math.sin(angle),
        size,
      }
    }),
  )
})()

const spinStyle = (seconds: number, reverse = false) => ({
  animationDuration: `${seconds}s`,
  animationDirection: reverse ? 'reverse' : 'normal',
  transformOrigin: `${CX}px ${CY}px`,
})

export type FooterOrbitProps = {
  activeId: string
  onHover: (id: string | null) => void
  onToggle: (id: string) => void
}

// 데스크톱 푸터의 궤도 — 행성에 올리면 그 팀원을 미리 보고, 누르면 고정한다.
export function FooterOrbit({ activeId, onHover, onToggle }: FooterOrbitProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  // 1000px 도면을 칸 폭에 맞춰 줄인다. 줄어든 만큼 이름표는 거꾸로 키운다(최대 1.6배).
  const scale = width ? Math.min(1, width / W) : 1
  const labelScale = Math.min(1.6, 1 / scale)
  const activeRadius = POSITIONS[activeId]?.[0]

  return (
    <div ref={ref}>
      <div
        className={styles.frame}
        style={{ width: W * scale, minHeight: H * scale }}
      >
        <div
          className={styles.canvas}
          style={{ transform: `scale(${scale}) translateY(-50%)` }}
        >
          <svg
            className={styles.svg}
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            aria-hidden="true"
          >
            {RADII.map((r, i) => {
              // 팀원이 없는 궤도 몇 개는 끊긴 점선으로 통째 돈다.
              const isPartial =
                (i % 4 === 2 || i % 5 === 4) && !MEMBER_RADII.has(r)
              const isActive = r === activeRadius
              const ring = (
                <circle
                  cx={CX}
                  cy={CY}
                  r={r}
                  fill="none"
                  className={styles.ringStroke}
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
              return (
                <g key={r} transform={`rotate(${i * 47} ${CX} ${CY})`}>
                  {!isPartial && ring}
                  <g
                    className={styles.spinning}
                    style={spinStyle(40 + i * 7, i % 2 === 1)}
                  >
                    {isPartial ? (
                      ring
                    ) : (
                      // 이어진 궤도는 선은 멈춰 있고 짧은 호만 돈다.
                      <circle
                        cx={CX}
                        cy={CY}
                        r={r}
                        fill="none"
                        style={{
                          stroke: isActive ? activeStroke(100) : onDark(85),
                        }}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        pathLength={100}
                        strokeDasharray="7 93"
                      />
                    )}
                  </g>
                </g>
              )
            })}
            <g className={styles.spinning} style={spinStyle(120)}>
              {DECO.map(({ x, y, size }, index) => (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={size}
                  style={{ fill: onDark(90) }}
                />
              ))}
            </g>
          </svg>

          {TEAM.map((member) => {
            const [r, degree] = POSITIONS[member.id]
            const angle = (degree * Math.PI) / 180
            const x = CX + r * Math.cos(angle)
            const isActive = member.id === activeId
            // 오른쪽 끝 행성은 이름표가 잘리지 않게 왼쪽에 단다.
            const isLabelLeft = x > 860
            return (
              <button
                key={member.id}
                type="button"
                className={styles.satellite}
                style={{
                  left: x,
                  top: CY + r * Math.sin(angle),
                  zIndex: isActive ? 3 : 2,
                }}
                aria-label={`${member.name} 상세 보기`}
                aria-pressed={isActive}
                onClick={() => onToggle(member.id)}
                onMouseEnter={() => onHover(member.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(member.id)}
                onBlur={() => onHover(null)}
              >
                <span className={styles.hitArea} />
                <span className={styles.planet} />
                <span
                  className={styles.label}
                  data-side={isLabelLeft ? 'left' : 'right'}
                  style={{
                    transform: `scale(${labelScale}) translate(${isLabelLeft ? 'calc(-100% - 14px)' : '14px'}, -50%)`,
                  }}
                >
                  <span className={styles.labelName}>{member.name}</span>
                  <span className={styles.labelHandle}>@{member.handle}</span>
                </span>
              </button>
            )
          })}

          <a
            href={REPO.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.repo}
            style={{ left: CX, top: CY, width: 52, height: 52 }}
            aria-label="GitHub 저장소"
            title="GitHub 저장소"
          >
            <GithubMark size={26} />
          </a>
          <a
            href={REPO.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
            className={styles.repoLabel}
            style={{
              left: CX,
              top: CY + 34,
              transform: `scale(${labelScale}) translateX(-50%)`,
            }}
          >
            <span className={styles.repoName}>{REPO.label}</span>
            <span className={styles.repoCaption}>github</span>
          </a>
        </div>
      </div>
    </div>
  )
}

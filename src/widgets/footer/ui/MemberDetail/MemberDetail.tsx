import { GithubMark } from '../GithubMark'

import * as styles from './MemberDetail.css'

import type { TeamMember } from '../../model/team'

export type MemberDetailProps = {
  member: TeamMember
  /** false면 흐려지며 내려간다 — 다음 팀원으로 바뀌기 직전 */
  visible: boolean
}

// 고른 팀원의 이름·GitHub·담당 기능. 바뀔 때 이름은 옆에서, 태그는 하나씩 아래에서 들어온다.
export function MemberDetail({ member, visible }: MemberDetailProps) {
  return (
    <div className={styles.root} data-visible={visible} aria-live="polite">
      <div className={styles.identity}>
        <span className={styles.nameRow}>
          <span className={styles.name}>{member.name}</span>
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.githubLink}
            aria-label={`${member.name} GitHub 프로필`}
            title="GitHub 프로필"
          >
            <GithubMark />
          </a>
        </span>
        <span className={styles.meta}>
          @{member.handle} · {member.role}
        </span>
      </div>
      <div className={styles.work}>
        <span className={styles.workLabel}>WORKED ON</span>
        <ul className={styles.features}>
          {member.features.map((feature, index) => (
            <li
              key={feature}
              className={styles.feature}
              style={{ transitionDelay: `${0.08 + index * 0.05}s` }}
            >
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

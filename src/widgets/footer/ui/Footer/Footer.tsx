import { Link } from 'react-router'

import { HOME_PATH } from '@shared/config/routes'
import { Logo } from '@shared/ui'

import { useActiveMember } from '../../lib/useActiveMember'
import { FooterOrbit } from '../FooterOrbit'
import { FooterOrbitMobile } from '../FooterOrbitMobile'
import { MemberDetail } from '../MemberDetail'

import * as styles from './Footer.css'

// 팀원이 궤도의 행성으로 도는 푸터 — 행성을 고르면 그 팀원의 GitHub·담당 기능이 뜬다.
// 데스크톱·모바일 궤도는 모양이 달라 둘 다 그리고 CSS로 한쪽만 보인다.
export function Footer() {
  const { activeId, shownMember, isShownVisible, hover, toggle } =
    useActiveMember()

  return (
    <footer className={styles.root}>
      <div className={styles.topLine} />
      <div className={styles.inner}>
        <div className={styles.main}>
          <div className={styles.orbit}>
            <FooterOrbit
              activeId={activeId}
              onHover={hover}
              onToggle={toggle}
            />
          </div>
          <div className={styles.brand}>
            <Link to={HOME_PATH} className={styles.logo} aria-label="NOVA 홈">
              <Logo />
            </Link>
            <span className={styles.tagline}>
              모든 기기가 머무는 궤도, NOVA
            </span>
          </div>
          <div className={styles.divider} />
          <div className={styles.orbitMobile}>
            <FooterOrbitMobile activeId={activeId} onToggle={toggle} />
          </div>
          <div className={styles.detail}>
            <MemberDetail member={shownMember} visible={isShownVisible} />
          </div>
        </div>
        <div className={styles.bottom}>
          <span className={styles.note}>
            NOVA는 U+유레카 최종 프로젝트 사이트입니다.
          </span>
          <span className={styles.note}>
            © {new Date().getFullYear()} NOVA. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}

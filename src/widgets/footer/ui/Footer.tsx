import { Link } from 'react-router'

import { DRAW_PATH, HOME_PATH, PREORDER_PATH } from '@shared/config/routes'
import { Logo } from '@shared/ui'

import * as styles from './Footer.css'

const links = [
  { label: '사전예약', to: PREORDER_PATH },
  { label: '럭키드로우', to: DRAW_PATH },
]

// 사용자 페이지 공통 하단 영역 — 사용자 페이지는 늘 어둡다(관리자 레이아웃엔 없다).
export function Footer() {
  return (
    <footer className={styles.root}>
      <div className={styles.inner}>
        <Link to={HOME_PATH} className={styles.logo} aria-label="홈으로">
          <Logo />
        </Link>
        <nav className={styles.links} aria-label="푸터 메뉴">
          {links.map(({ label, to }) => (
            <Link key={to} to={to} className={styles.link}>
              {label}
            </Link>
          ))}
        </nav>
        <small className={styles.copyright}>
          © {new Date().getFullYear()} NOVA. All rights reserved.
        </small>
      </div>
    </footer>
  )
}

import { LogOut, Orbit } from 'lucide-react'
import { useNavigate } from 'react-router'

import { logout } from '@entities/auth'
import {
  HOME_PATH,
  MYPAGE_TAB_LABELS,
  type MypageTab,
} from '@shared/config/routes'

import * as styles from './MypageMenu.css'

export type MypageMenuLink = MypageTab

export type MypageMenuProps = {
  /** 프로필을 아직 못 불러왔으면 비워 둔다 — 이름 줄만 빠진다. */
  userName?: string
  email?: string
  activeLink: MypageMenuLink
  onLinkClick?: (link: MypageMenuLink) => void
  className?: string
}

const links: MypageMenuLink[] = [
  'history',
  'preorder-check',
  'draw',
  'cart',
  'address-manage',
  'reviews',
]

// 넓은 화면에선 왼쪽 세로 메뉴, 좁은 화면에선 프로필 아래 가로로 스크롤되는 밑줄 탭이 된다.
// 로그아웃은 탭이 아니라 동작이라 메뉴 줄에 섞지 않고 프로필 옆에 둔다.
export function MypageMenu({
  userName,
  email,
  activeLink,
  onLinkClick,
  className,
}: MypageMenuProps) {
  const navigate = useNavigate()

  // 홈으로 먼저 나간다 — 마이페이지에 남은 채 세션이 지워지면 RequireLogin이
  // 비회원 진입으로 보고 로그인 모달을 띄운다.
  const handleLogout = () => {
    navigate(HOME_PATH)
    void logout()
  }

  return (
    <aside className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.profile}>
        <span className={styles.avatar}>
          <Orbit size={22} strokeWidth={1.6} aria-hidden="true" />
        </span>
        <div className={styles.profileTexts}>
          {userName && <span className={styles.userName}>{userName} 님</span>}
          {email && <span className={styles.email}>{email}</span>}
        </div>
        <button
          type="button"
          className={styles.logout}
          aria-label="로그아웃"
          title="로그아웃"
          onClick={handleLogout}
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
      <nav className={styles.nav} aria-label="마이페이지">
        {links.map((link) => (
          <button
            key={link}
            type="button"
            className={styles.link}
            aria-current={link === activeLink ? 'page' : undefined}
            onClick={() => onLinkClick?.(link)}
          >
            {MYPAGE_TAB_LABELS[link]}
          </button>
        ))}
      </nav>
    </aside>
  )
}

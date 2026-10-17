import { useState } from 'react'

import { LogOut, Orbit } from 'lucide-react'
import { useNavigate } from 'react-router'

import { logout } from '@entities/auth'
import { getErrorMessage } from '@shared/api/client'
import {
  HOME_PATH,
  MYPAGE_TAB_LABELS,
  type MypageTab,
} from '@shared/config/routes'
import { showToast } from '@shared/model/toastStore'

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

  // 서버가 세션을 지운 뒤에만 홈으로 나간다 — 실패하면 마이페이지에 남아 다시 누를 수 있다.
  // 세션이 먼저 지워져도 RequireLogin이 로그아웃으로 보고 로그인 모달 없이 홈으로 보낸다.
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate(HOME_PATH)
    } catch (caught) {
      showToast(
        getErrorMessage(caught, '로그아웃하지 못했어요. 다시 시도해 주세요.'),
      )
      setIsLoggingOut(false)
    }
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
          disabled={isLoggingOut}
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

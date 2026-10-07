import { Orbit } from 'lucide-react'

import type { MypageTab } from '@shared/config/routes'

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

const links: { link: MypageMenuLink; label: string }[] = [
  { link: 'history', label: '주문 내역' },
  { link: 'preorder-check', label: '예약 내역' },
  { link: 'cart', label: '장바구니' },
  { link: 'address-manage', label: '배송지 관리' },
  { link: 'reviews', label: '내 리뷰' },
]

// 넓은 화면에선 왼쪽 세로 메뉴, 좁은 화면에선 프로필 아래 가로로 스크롤되는 탭이 된다.
export function MypageMenu({
  userName,
  email,
  activeLink,
  onLinkClick,
  className,
}: MypageMenuProps) {
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
      </div>
      <nav className={styles.nav} aria-label="마이페이지">
        {links.map(({ link, label }) => (
          <button
            key={link}
            type="button"
            className={styles.link}
            aria-current={link === activeLink ? 'page' : undefined}
            onClick={() => onLinkClick?.(link)}
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

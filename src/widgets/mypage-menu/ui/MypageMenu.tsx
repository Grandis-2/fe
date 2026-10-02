import type { MypageTab } from '@shared/config/routes'

import * as styles from './MypageMenu.css'

export type MypageMenuLink = MypageTab

export type MypageMenuProps = {
  userName: string
  activeLink: MypageMenuLink
  onLinkClick?: (link: MypageMenuLink) => void
  className?: string
}

const sections: {
  title: string
  links: { link: MypageMenuLink; label: string }[]
}[] = [
  {
    title: '쇼핑정보',
    links: [
      { link: 'preorder-check', label: '사전 예약 확인' },
      { link: 'cart', label: '장바구니' },
      { link: 'history', label: '구매 내역' },
    ],
  },
  {
    title: '회원정보',
    links: [{ link: 'address-manage', label: '배송지 관리' }],
  },
]

export function MypageMenu({
  userName,
  activeLink,
  onLinkClick,
  className,
}: MypageMenuProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.heading}>
        <div className={styles.headingLabel}>마이페이지</div>
        <div className={styles.userName}>{userName} 님</div>
      </div>
      <div className={styles.sections}>
        {sections.map(({ title, links }) => {
          const isSectionActive = links.some(({ link }) => link === activeLink)
          return (
            <div key={title} className={styles.section}>
              <div
                className={
                  styles.sectionTitle[isSectionActive ? 'active' : 'inactive']
                }
              >
                {title}
              </div>
              <div className={styles.linkList}>
                {links.map(({ link, label }) => (
                  <button
                    key={link}
                    type="button"
                    className={[
                      styles.link,
                      link === activeLink && styles.linkActive,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onLinkClick?.(link)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

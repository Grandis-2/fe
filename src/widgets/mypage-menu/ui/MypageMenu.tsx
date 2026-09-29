import * as styles from './MypageMenu.css'

export type MypageMenuLink =
  'preorder-check' | 'cart' | 'history' | 'address-manage'

export type MypageMenuProps = {
  userName: string
  activeLink: MypageMenuLink
  onLinkClick?: (link: MypageMenuLink) => void
  className?: string
}

const shoppingLinks: { link: MypageMenuLink; label: string }[] = [
  { link: 'preorder-check', label: '사전 예약 확인' },
  { link: 'cart', label: '장바구니' },
  { link: 'history', label: '구매 내역' },
]

const accountLinks: { link: MypageMenuLink; label: string }[] = [
  { link: 'address-manage', label: '배송지 관리' },
]

export function MypageMenu({
  userName,
  activeLink,
  onLinkClick,
  className,
}: MypageMenuProps) {
  const isShoppingActive = shoppingLinks.some(({ link }) => link === activeLink)
  const isAccountActive = accountLinks.some(({ link }) => link === activeLink)

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.heading}>
        <div className={styles.headingLabel}>마이페이지</div>
        <div className={styles.userName}>{userName} 님</div>
      </div>
      <div className={styles.sections}>
        <div className={styles.section}>
          <div
            className={
              styles.sectionTitle[isShoppingActive ? 'active' : 'inactive']
            }
          >
            쇼핑정보
          </div>
          <div className={styles.linkList}>
            {shoppingLinks.map(({ link, label }) => {
              const isActive = link === activeLink
              return (
                <button
                  key={link}
                  type="button"
                  className={[styles.link, isActive && styles.linkActive]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onLinkClick?.(link)}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <div className={styles.section}>
          <div
            className={
              styles.sectionTitle[isAccountActive ? 'active' : 'inactive']
            }
          >
            회원정보
          </div>
          <div className={styles.linkList}>
            {accountLinks.map(({ link, label }) => {
              const isActive = link === activeLink
              return (
                <button
                  key={link}
                  type="button"
                  className={[styles.link, isActive && styles.linkActive]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onLinkClick?.(link)}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

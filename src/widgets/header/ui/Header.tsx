import { useEffect, useState } from 'react'

import { Bell, LogOut, Search, ShoppingCart, User } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { KakaoLoginModal } from '@/features/kakao-login'
import { useModalStore } from '@/shared/model/modalStore'
import { CategoryNav } from '@/widgets/category-nav'

import * as styles from './Header.css'

export type HeaderProps = {
  isMember?: boolean
  onSearchClick?: () => void
  onCartClick?: () => void
  onNotificationClick?: () => void
  onLogoutClick?: () => void
  className?: string
}

export function Header({
  isMember = false,
  onSearchClick,
  onCartClick,
  onNotificationClick,
  onLogoutClick,
  className,
}: HeaderProps) {
  const openModal = useModalStore((state) => state.open)
  const { pathname } = useLocation()
  const isMainPage = pathname === '/'
  // 어드민은 쇼핑 내비게이션이 필요 없다 — 로고/이동 경로를 바꾸고 알림만 남긴다.
  const isAdminPage = pathname.startsWith('/admin')
  // 메인페이지에서만 헤더가 sticky다(그 외엔 root의 기본 position: relative를 그대로
  // 쓴다). 추후 다른 페이지도 sticky가 필요해지면 이 조건에 OR로 추가한다.
  const isStickyPage = isMainPage
  const [isOnDark, setIsOnDark] = useState(false)

  // 헤더 세로 중앙선 아래 구간의 data-header-theme이 "dark"면 흰 글자로 바꾼다.
  // 페이지는 어두운 구간에 이 속성만 달면 된다(MainPage의 배너·히어로 참고).
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      '[data-header-theme]',
    )
    const probeY = styles.HEADER_HEIGHT / 2
    const update = () => {
      // 구간이 중첩되면 안쪽이 이긴다 — querySelectorAll은 문서 순서(바깥 먼저)라
      // 마지막으로 걸린 게 가장 안쪽이다(어두운 히어로 안의 흰 카드 캐러셀처럼).
      let theme: string | undefined
      for (const section of sections) {
        const { top, bottom } = section.getBoundingClientRect()
        if (top <= probeY && bottom > probeY)
          theme = section.dataset.headerTheme
      }
      setIsOnDark(theme === 'dark')
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [pathname])

  // 어드민과 회원 헤더 양쪽에 들어가므로 한 번만 만들어 둔다.
  const notificationButton = (
    <button
      type="button"
      className={styles.iconButton}
      aria-label="알림"
      onClick={onNotificationClick}
    >
      <Bell className={styles.icon} aria-hidden="true" />
    </button>
  )

  return (
    <header
      className={[
        styles.root,
        styles.border[isMainPage ? 'hidden' : 'visible'],
        isStickyPage && styles.sticky,
        isOnDark && styles.onDark,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.content}>
        <div className={styles.leftGroup}>
          <Link
            to={isAdminPage ? '/admin' : '/'}
            className={[styles.logo, isMember && styles.logoMember]
              .filter(Boolean)
              .join(' ')}
          >
            {isAdminPage ? 'NOVA ADMIN' : 'NOVA'}
          </Link>
          {!isAdminPage && (
            <CategoryNav tone={isOnDark ? 'onDark' : 'default'} />
          )}
        </div>
        <div className={styles.actions}>
          {isAdminPage ? (
            notificationButton
          ) : (
            <>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="검색"
                onClick={onSearchClick}
              >
                <Search className={styles.icon} aria-hidden="true" />
              </button>
              {isMember ? (
                <>
                  {notificationButton}
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="장바구니"
                    onClick={onCartClick}
                  >
                    <ShoppingCart className={styles.icon} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="로그아웃"
                    onClick={onLogoutClick}
                  >
                    <LogOut className={styles.icon} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="계정"
                  onClick={() => openModal(<KakaoLoginModal />)}
                >
                  <User className={styles.icon} aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

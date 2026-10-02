import { Bell, CircleUser, ShoppingCart } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { mypagePath } from '@shared/config/routes'
import { CategoryNav } from '@widgets/category-nav'

import { useHeaderTheme } from '../model/useHeaderTheme'

import * as styles from './Header.css'
import { HeaderSearch } from './HeaderSearch'

export type HeaderProps = {
  isMember?: boolean
  onSearchClick?: () => void
  onCartClick?: () => void
  onNotificationClick?: () => void
  className?: string
}

export function Header({
  isMember = false,
  onSearchClick,
  onCartClick,
  onNotificationClick,
  className,
}: HeaderProps) {
  const { pathname } = useLocation()
  const isMainPage = pathname === '/'
  // 어드민은 쇼핑 내비게이션이 필요 없다 — 로고/이동 경로를 바꾸고 알림만 남긴다.
  const isAdminPage = pathname.startsWith('/admin')
  // 메인페이지에서만 헤더가 sticky다(그 외엔 root의 기본 position: relative를 그대로
  // 쓴다). 추후 다른 페이지도 sticky가 필요해지면 이 조건에 OR로 추가한다.
  const isStickyPage = isMainPage
  const { headerRef, isOnDark } = useHeaderTheme(pathname)

  // 어드민과 일반 헤더 양쪽에 들어가므로 한 번만 만들어 둔다.
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
      ref={headerRef}
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
            <CategoryNav
              tone={isOnDark ? 'onDark' : 'default'}
              className={styles.desktopOnly}
            />
          )}
        </div>
        <div className={styles.actions}>
          {isAdminPage ? (
            notificationButton
          ) : (
            <>
              {/* 모바일은 하단 탭바에 검색·마이페이지가 있어 헤더엔 알림·장바구니만 둔다. */}
              <HeaderSearch onSearchClick={onSearchClick} />
              {notificationButton}
              <button
                type="button"
                className={styles.iconButton}
                aria-label="장바구니"
                onClick={onCartClick}
              >
                <ShoppingCart className={styles.icon} aria-hidden="true" />
              </button>
              <Link
                to={mypagePath('preorder-check')}
                className={[styles.iconButton, styles.desktopOnly].join(' ')}
                aria-label="마이페이지"
              >
                <CircleUser className={styles.icon} aria-hidden="true" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

import { Bell, CircleUser, LogOut, ShoppingCart } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'

import { logout } from '@entities/auth'
import { useCartCount } from '@entities/cart'
import { useUnreadNotificationCount } from '@entities/notification'
import { useMyReservations } from '@entities/preorder'
import { openLoginModal } from '@features/login'
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  HOME_PATH,
  mypagePath,
} from '@shared/config/routes'
import { Button, Logo } from '@shared/ui'
import { CategoryNav } from '@widgets/category-nav'

import { useHeaderTheme } from '../lib/useHeaderTheme'

import * as styles from './Header.css'
import { HeaderNotification } from './HeaderNotification'
import { HeaderSearch } from './HeaderSearch'

export type HeaderProps = {
  isMember?: boolean
  onSearchClick?: () => void
  onNotificationClick?: () => void
  className?: string
}

export function Header({
  isMember = false,
  onSearchClick,
  onNotificationClick,
  className,
}: HeaderProps) {
  const { pathname } = useLocation()
  const isMainPage = pathname === HOME_PATH
  // 어드민은 쇼핑 내비게이션이 필요 없다 — 로고/이동 경로를 바꾸고 알림만 남긴다.
  const isAdminPage = pathname.startsWith(ADMIN_HOME_PATH)
  // 관리자 로그인 화면 — 로그인 전이라 알림도 로그아웃도 누를 데가 없다. 로고만 둔다.
  const isAdminLogin = pathname === ADMIN_LOGIN_PATH
  // 메인페이지에서만 헤더가 sticky다(그 외엔 root의 기본 position: relative를 그대로
  // 쓴다). 추후 다른 페이지도 sticky가 필요해지면 이 조건에 OR로 추가한다.
  const isStickyPage = isMainPage
  // 어드민을 뺀 헤더는 늘 어두운 디자인이다. 뒤가 어두운 구간이면 바탕만 투명하게 둔다.
  const isDark = !isAdminPage
  const { headerRef, isOnDark } = useHeaderTheme(pathname)
  const navigate = useNavigate()

  // 세션을 지우고 로그인 화면으로. 서버 응답이 실패해도 로컬 세션은 비워지므로
  // (logout의 finally) 어느 쪽이든 보낸다 — 관리자 화면에 남겨 두면 다음 요청마다
  // 401을 맞는다. 그래서 실패를 잡는 이유가 '문구 표시'가 아니라 '화면 이동'이다.
  const handleLogout = async () => {
    await logout().catch(() => undefined)
    navigate(ADMIN_LOGIN_PATH, { replace: true })
  }
  // 개수 배지는 회원 쇼핑 화면에서만 — 어드민 종 아이콘은 관리자 알림이라 대상이 다르다.
  const showCounts = isMember && !isAdminPage
  const { data: cartCount = 0 } = useCartCount(showCounts)
  const { data: notificationCount = 0 } = useUnreadNotificationCount(showCounts)
  // 구매 확정(결제)이 필요한 사전예약 수 — 결제 가능해진 예약이다.
  const { data: reservations } = useMyReservations({ enabled: showCounts })
  const pendingPurchaseCount = showCounts
    ? (reservations?.items.filter(
        ({ displayStatus }) => displayStatus === 'PAYABLE',
      ).length ?? 0)
    : 0

  // 아이콘 오른쪽 위 숫자. 0이면 안 그린다(개수는 aria-label에 따로 담는다).
  const countBadge = (count: number, tone?: 'warning') =>
    count > 0 && (
      <span
        className={[
          styles.countBadge,
          tone === 'warning' && styles.countBadgeWarning,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      >
        {count > 99 ? '99+' : count}
      </span>
    )

  return (
    <header
      ref={headerRef}
      className={[
        styles.root,
        isDark ? styles.onDark : styles.admin,
        isDark && !isOnDark && styles.solid,
        isStickyPage && styles.sticky,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.content}>
        <div className={styles.leftGroup}>
          <Link
            to={isAdminPage ? ADMIN_HOME_PATH : HOME_PATH}
            className={[styles.logo, isMember && !isDark && styles.logoMember]
              .filter(Boolean)
              .join(' ')}
          >
            <Logo suffix={isAdminPage ? ' ADMIN' : undefined} />
          </Link>
          {!isAdminPage && (
            <CategoryNav tone="onDark" className={styles.desktopOnly} />
          )}
        </div>
        <div className={styles.actions}>
          {isAdminLogin ? null : isAdminPage ? (
            <>
              {/* 관리자 알림은 회원 알림과 대상이 달라 패널을 열지 않고 밖에 알리기만 한다. */}
              <button
                type="button"
                className={styles.iconButton}
                aria-label="알림"
                onClick={onNotificationClick}
              >
                <Bell className={styles.icon} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="로그아웃"
                onClick={() => void handleLogout()}
              >
                <LogOut className={styles.icon} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              {/* 모바일은 하단 탭바에 검색·마이페이지가 있어 헤더엔 알림·장바구니만 둔다. */}
              <HeaderSearch onSearchClick={onSearchClick} />
              {/* 비회원은 검색과 로그인만 — 알림·장바구니·마이페이지는 회원 전용이다. */}
              {isMember ? (
                <>
                  <HeaderNotification
                    label={
                      notificationCount > 0
                        ? `알림 ${notificationCount}개`
                        : '알림'
                    }
                    badge={countBadge(notificationCount)}
                  />
                  <Link
                    to={mypagePath('cart')}
                    className={[styles.iconButton, styles.badgeAnchor].join(
                      ' ',
                    )}
                    aria-label={
                      cartCount > 0 ? `장바구니 ${cartCount}개` : '장바구니'
                    }
                  >
                    <ShoppingCart className={styles.icon} aria-hidden="true" />
                    {countBadge(cartCount)}
                  </Link>
                  <Link
                    to={mypagePath('preorder-check')}
                    className={[
                      styles.iconButton,
                      styles.badgeAnchor,
                      styles.desktopOnly,
                    ].join(' ')}
                    aria-label={
                      pendingPurchaseCount > 0
                        ? `마이페이지, 구매 확정 대기 ${pendingPurchaseCount}건`
                        : '마이페이지'
                    }
                  >
                    <CircleUser className={styles.icon} aria-hidden="true" />
                    {/* 해야 할 일(구매 확정)이라 개수 배지와 달리 경고색이다. */}
                    {countBadge(pendingPurchaseCount, 'warning')}
                  </Link>
                </>
              ) : (
                // 흰 바탕이라 메인 배너(어두운 구간) 위에서도 그대로 보인다.
                <Button
                  variant="outline"
                  size="small"
                  rounded
                  className={styles.desktopOnly}
                  onClick={() => openLoginModal()}
                >
                  로그인
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

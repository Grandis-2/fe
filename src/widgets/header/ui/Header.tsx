import { useEffect, useRef, useState } from 'react'

import { Bell, CircleUser, Search, ShoppingCart } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'

import { KakaoLoginModal } from '@/features/kakao-login'
import { useModalStore } from '@/shared/model/modalStore'
import { CategoryNav } from '@/widgets/category-nav'

import * as styles from './Header.css'

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
  const openModal = useModalStore((state) => state.open)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const isMainPage = pathname === '/'
  // 어드민은 쇼핑 내비게이션이 필요 없다 — 로고/이동 경로를 바꾸고 알림만 남긴다.
  const isAdminPage = pathname.startsWith('/admin')
  // 메인페이지에서만 헤더가 sticky다(그 외엔 root의 기본 position: relative를 그대로
  // 쓴다). 추후 다른 페이지도 sticky가 필요해지면 이 조건에 OR로 추가한다.
  const isStickyPage = isMainPage
  const [isOnDark, setIsOnDark] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  // 헤더 세로 중앙선 아래 구간의 data-header-theme이 "dark"면 흰 글자로 바꾼다.
  // 페이지는 어두운 구간에 이 속성만 달면 된다(MainPage의 배너·히어로 참고).
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      '[data-header-theme]',
    )
    const update = () => {
      // 헤더 높이가 breakpoint마다 달라서(headerHeight) 매번 실제 높이를 잰다.
      const probeY = (headerRef.current?.offsetHeight ?? 0) / 2
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
              {isSearchOpen ? (
                <form
                  role="search"
                  className={[styles.searchForm, styles.desktopOnly].join(' ')}
                  onSubmit={(event) => {
                    event.preventDefault()
                    const keyword = new FormData(event.currentTarget)
                      .get('keyword')
                      ?.toString()
                      .trim()
                    if (!keyword) return
                    navigate(`/search?${new URLSearchParams({ keyword })}`)
                    setIsSearchOpen(false)
                  }}
                >
                  <Search className={styles.searchIcon} aria-hidden="true" />
                  <input
                    name="keyword"
                    type="search"
                    className={styles.searchInput}
                    placeholder="검색어를 입력해 주세요."
                    aria-label="검색어"
                    autoFocus
                    // 입력 없이 포커스를 잃거나 Esc를 누르면 다시 아이콘으로 접는다.
                    onBlur={(event) => {
                      if (!event.currentTarget.value) setIsSearchOpen(false)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setIsSearchOpen(false)
                    }}
                  />
                </form>
              ) : (
                <button
                  type="button"
                  className={[styles.iconButton, styles.desktopOnly].join(' ')}
                  aria-label="검색"
                  onClick={() => {
                    setIsSearchOpen(true)
                    onSearchClick?.()
                  }}
                >
                  <Search className={styles.icon} aria-hidden="true" />
                </button>
              )}
              {notificationButton}
              <button
                type="button"
                className={styles.iconButton}
                aria-label="장바구니"
                onClick={onCartClick}
              >
                <ShoppingCart className={styles.icon} aria-hidden="true" />
              </button>
              {/* 비회원은 마이페이지 대신 로그인 모달을 연다. */}
              {isMember ? (
                <Link
                  to="/mypage?state=preorder-check"
                  className={[styles.iconButton, styles.desktopOnly].join(' ')}
                  aria-label="마이페이지"
                >
                  <CircleUser className={styles.icon} aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  className={[styles.iconButton, styles.desktopOnly].join(' ')}
                  aria-label="마이페이지"
                  onClick={() => openModal(<KakaoLoginModal />)}
                >
                  <CircleUser className={styles.icon} aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

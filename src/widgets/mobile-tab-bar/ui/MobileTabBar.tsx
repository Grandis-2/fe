import { useCallback, useState } from 'react'

import {
  CalendarCheck,
  CircleUser,
  House,
  LayoutGrid,
  Search,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { useSession } from '@entities/auth'
import { KakaoLoginModal } from '@features/login'
import {
  HOME_PATH,
  MYPAGE_PATH,
  mypagePath,
  PREORDER_PATH,
  SEARCH_PATH,
} from '@shared/config/routes'
import { useModalStore } from '@shared/model/modalStore'
import { MobileMenu } from '@widgets/category-nav'
import { SearchOverlay } from '@widgets/search'

import * as styles from './MobileTabBar.css'

import type { LucideIcon } from 'lucide-react'

type Tab = {
  label: string
  icon: LucideIcon
  to: string
  isActive: (pathname: string) => boolean
}

const tabs: Tab[] = [
  {
    label: '홈',
    icon: House,
    to: HOME_PATH,
    isActive: (p) => p === HOME_PATH,
  },
  {
    label: '사전예약',
    icon: CalendarCheck,
    to: PREORDER_PATH,
    isActive: (p) => p.startsWith(PREORDER_PATH),
  },
  {
    label: '마이페이지',
    icon: CircleUser,
    to: mypagePath('preorder-check'),
    isActive: (p) => p.startsWith(MYPAGE_PATH),
  },
]

// admin은 고객용 탭이 의미 없으므로 숨긴다. 상세 페이지의 하단 고정 바는 탭바 높이만큼
// 아래를 비워 두고(ProductPurchaseBar.css, PreorderDetailPage.css) 탭바가 그 위에 뜬다.
const HIDDEN_PATH = /^\/admin/

// 모바일 전용 하단 플로팅 탭바. 메뉴는 페이지가 아니라 전체 화면 메뉴(MobileMenu)를 연다.
export function MobileTabBar() {
  const { pathname } = useLocation()
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { isLoggedIn } = useSession()
  const openModal = useModalStore((state) => state.open)
  // MobileMenu의 Esc 리스너가 렌더마다 다시 걸리지 않게 같은 함수를 넘긴다.
  const closeMenu = useCallback(() => setIsCategoryOpen(false), [])

  if (HIDDEN_PATH.test(pathname)) return null

  const renderTab = ({ label, icon: Icon, to, isActive }: Tab) => {
    const active = !isCategoryOpen && isActive(pathname)
    return (
      <Link
        key={label}
        to={to}
        className={styles.tab}
        aria-current={active ? 'page' : undefined}
        // 메뉴가 열린 채 다른 탭으로 가면 메뉴를 닫는다.
        onClick={(event) => {
          setIsCategoryOpen(false)
          // 비회원은 마이페이지 대신 로그인 모달을 연다(헤더 마이페이지 아이콘과 같은 규칙).
          if (!isLoggedIn && to.startsWith(MYPAGE_PATH)) {
            event.preventDefault()
            openModal(<KakaoLoginModal />)
          }
        }}
      >
        <Icon className={styles.icon} aria-hidden="true" />
        <span className={styles.label}>{label}</span>
      </Link>
    )
  }

  return (
    <>
      <nav className={styles.root} aria-label="하단 메뉴">
        {/* 검색은 페이지가 아니라 전체 화면 검색창(SearchOverlay)을 연다 — 헤더 검색 아이콘과 같다. */}
        <button
          type="button"
          className={styles.tab}
          aria-haspopup="dialog"
          // 카테고리 둘러보기·검색 결과(/search…) 화면에선 검색 탭이 켜져 있다.
          aria-current={
            !isCategoryOpen && pathname.startsWith(SEARCH_PATH)
              ? 'page'
              : undefined
          }
          onClick={() => {
            setIsCategoryOpen(false)
            setIsSearchOpen(true)
          }}
        >
          <Search className={styles.icon} aria-hidden="true" />
          <span className={styles.label}>검색</span>
        </button>
        <button
          type="button"
          className={styles.tab}
          aria-expanded={isCategoryOpen}
          onClick={() => setIsCategoryOpen((open) => !open)}
        >
          <LayoutGrid className={styles.icon} aria-hidden="true" />
          <span className={styles.label}>메뉴</span>
        </button>
        {tabs.map(renderTab)}
      </nav>
      {isCategoryOpen && <MobileMenu onClose={closeMenu} />}
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
    </>
  )
}

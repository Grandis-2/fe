import { useState } from 'react'

import {
  CalendarCheck,
  CircleUser,
  House,
  LayoutGrid,
  Search,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { typography } from '@/shared/config/theme'
import { BottomSheet } from '@/shared/ui'
import { MobileCategoryNav } from '@/widgets/category-nav'

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
    label: '검색',
    icon: Search,
    to: '/search',
    isActive: (p) => p === '/search',
  },
  { label: '홈', icon: House, to: '/', isActive: (p) => p === '/' },
  {
    label: '사전예약',
    icon: CalendarCheck,
    to: '/preorder',
    isActive: (p) => p.startsWith('/preorder'),
  },
  {
    label: '마이페이지',
    icon: CircleUser,
    to: '/mypage?state=preorder-check',
    isActive: (p) => p.startsWith('/mypage'),
  },
]

// admin은 고객용 탭이 의미 없으므로 숨긴다. 상세 페이지의 하단 고정 바는 탭바 높이만큼
// 아래를 비워 두고(ProductPurchaseBar.css, PreorderDetailPage.css) 탭바가 그 위에 뜬다.
const HIDDEN_PATH = /^\/admin/

// 모바일 전용 하단 플로팅 탭바. 카테고리는 페이지가 아니라 바텀시트(MobileCategoryNav)를 연다.
export function MobileTabBar() {
  const { pathname } = useLocation()
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  if (HIDDEN_PATH.test(pathname)) return null

  const renderTab = ({ label, icon: Icon, to, isActive }: Tab) => {
    const active = !isCategoryOpen && isActive(pathname)
    return (
      <Link
        key={label}
        to={to}
        className={styles.tab}
        aria-current={active ? 'page' : undefined}
        // 시트가 modal={false}라 바깥 클릭으로 안 닫힌다 — 탭 이동 시 직접 닫는다.
        onClick={() => setIsCategoryOpen(false)}
      >
        <Icon className={styles.icon} aria-hidden="true" />
        <span className={styles.label}>{label}</span>
      </Link>
    )
  }

  return (
    <>
      <nav className={styles.root} aria-label="하단 메뉴">
        {renderTab(tabs[0])}
        <button
          type="button"
          className={styles.tab}
          aria-expanded={isCategoryOpen}
          onClick={() => setIsCategoryOpen((open) => !open)}
        >
          <LayoutGrid className={styles.icon} aria-hidden="true" />
          <span className={styles.label}>카테고리</span>
        </button>
        {tabs.slice(1).map(renderTab)}
      </nav>
      <BottomSheet.Root open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <BottomSheet.Content className={styles.sheetContent}>
          <BottomSheet.Title
            className={[typography.title.lgSemibold, styles.sheetTitle].join(
              ' ',
            )}
          >
            카테고리
          </BottomSheet.Title>
          <div className={styles.sheetScroll}>
            <MobileCategoryNav onNavigate={() => setIsCategoryOpen(false)} />
          </div>
        </BottomSheet.Content>
      </BottomSheet.Root>
    </>
  )
}

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
  { label: '홈', icon: House, to: '/', isActive: (p) => p === '/' },
  {
    label: '검색',
    icon: Search,
    to: '/search',
    isActive: (p) => p === '/search',
  },
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

// 상세 페이지(상품/사전예약)는 자체 하단 고정 주문바가 있어 겹치므로 탭바를 숨긴다.
const HIDDEN_PATH = /^\/(admin|products\/|preorder\/)/

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
        aria-label={label}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className={styles.icon} aria-hidden="true" />
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
          aria-label="카테고리"
          aria-expanded={isCategoryOpen}
          onClick={() => setIsCategoryOpen(true)}
        >
          <LayoutGrid className={styles.icon} aria-hidden="true" />
        </button>
        {tabs.slice(1).map(renderTab)}
      </nav>
      <BottomSheet.Root open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <BottomSheet.Content>
          <BottomSheet.Title
            className={[typography.title.lgSemibold, styles.sheetTitle].join(
              ' ',
            )}
          >
            카테고리
          </BottomSheet.Title>
          <MobileCategoryNav onNavigate={() => setIsCategoryOpen(false)} />
        </BottomSheet.Content>
      </BottomSheet.Root>
    </>
  )
}

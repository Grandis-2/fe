import { Link, useLocation } from 'react-router'

import * as styles from './AdminSidebar.css'

const navItems = [
  { path: '/admin', label: '홈' },
  { path: '/admin/products', label: '상품 관리' },
  { path: '/admin/preorders', label: '사전 예약 관리' },
  { path: '/admin/orders', label: '예약 현황' },
  { path: '/admin/consistency-check', label: '정합성 대조' },
  { path: '/admin/load-test', label: '부하 검증' },
  { path: '/admin/notifications', label: '관리자 알림 내역 확인' },
  { path: '/admin/mock-settings', label: 'Mock 설정' },
]

export function AdminSidebar() {
  const { pathname } = useLocation()

  return (
    <nav className={styles.root} aria-label="관리자 메뉴">
      <div className={styles.navList}>
        {navItems.map(({ path, label }) => {
          const isActive = path === pathname
          return (
            <Link
              key={path}
              to={path}
              className={[styles.navItem, isActive && styles.navItemActive]
                .filter(Boolean)
                .join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

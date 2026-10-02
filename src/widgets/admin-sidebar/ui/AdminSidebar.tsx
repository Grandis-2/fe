import { Link, useLocation } from 'react-router'

import {
  ADMIN_CONSISTENCY_CHECK_PATH,
  ADMIN_HOME_PATH,
  ADMIN_LOAD_TEST_PATH,
  ADMIN_MOCK_SETTINGS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_PRODUCTS_PATH,
  ADMIN_PROMOTIONS_PATH,
  ADMIN_RESERVATIONS_PATH,
} from '@shared/config/routes'

import * as styles from './AdminSidebar.css'

const navItems = [
  { path: ADMIN_HOME_PATH, label: '홈' },
  { path: ADMIN_PRODUCTS_PATH, label: '상품 관리' },
  { path: ADMIN_PROMOTIONS_PATH, label: '사전 예약 관리' },
  { path: ADMIN_RESERVATIONS_PATH, label: '예약 현황' },
  { path: ADMIN_CONSISTENCY_CHECK_PATH, label: '정합성 대조' },
  { path: ADMIN_LOAD_TEST_PATH, label: '부하 검증' },
  { path: ADMIN_NOTIFICATIONS_PATH, label: '관리자 알림 내역 확인' },
  { path: ADMIN_MOCK_SETTINGS_PATH, label: 'Mock 설정' },
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

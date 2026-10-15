import { Link, useLocation } from 'react-router'

import {
  ADMIN_DEAD_LETTERS_PATH,
  ADMIN_HOME_PATH,
  ADMIN_LOAD_TEST_PATH,
  ADMIN_MOCK_SETTINGS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_PRODUCTS_PATH,
  ADMIN_PROMOTIONS_PATH,
  ADMIN_RECONCILIATION_PATH,
  ADMIN_RESERVATIONS_PATH,
  readBackTo,
} from '@shared/config/routes'

import * as styles from './AdminSidebar.css'

const navGroups = [
  {
    label: null,
    items: [{ path: ADMIN_HOME_PATH, label: '홈' }],
  },
  {
    label: '백오피스',
    items: [
      { path: ADMIN_PRODUCTS_PATH, label: '상품 관리' },
      { path: ADMIN_PROMOTIONS_PATH, label: '사전예약 관리' },
      { path: ADMIN_RESERVATIONS_PATH, label: '예약 현황' },
      { path: ADMIN_RECONCILIATION_PATH, label: '외부 예약 대조' },
    ],
  },
  {
    label: '개발자 기능',
    items: [
      { path: ADMIN_LOAD_TEST_PATH, label: '부하 검증' },
      { path: ADMIN_DEAD_LETTERS_PATH, label: '이벤트 DLQ' },
      { path: ADMIN_NOTIFICATIONS_PATH, label: '관리자 알림' },
      { path: ADMIN_MOCK_SETTINGS_PATH, label: 'Mock 설정' },
    ],
  },
]

export function AdminSidebar() {
  const location = useLocation()
  // 다른 메뉴에서 넘어온 상세(외부 예약 대조 → 예약 상세)는 들어온 메뉴를 켜 둔다.
  const pathname =
    readBackTo(location.state)?.to.split('?')[0] ?? location.pathname

  return (
    <nav className={styles.root} aria-label="관리자 메뉴">
      {navGroups.map((group) => (
        <div
          key={group.label ?? 'home'}
          className={styles.group}
          // 묶음 이름이 눈에만 보이면 스크린리더에서는 메뉴가 평평하게 읽힌다.
          role={group.label ? 'group' : undefined}
          aria-label={group.label ?? undefined}
        >
          {group.label && (
            <div className={styles.groupLabel}>{group.label}</div>
          )}
          {group.items.map(({ path, label }) => {
            // 상세·등록 같은 하위 화면에서도 그 메뉴를 켜 둔다. 홈(/admin)은 모든 경로의
            // 앞부분이라 정확히 같을 때만 켠다.
            const isActive =
              path === pathname ||
              (path !== ADMIN_HOME_PATH && pathname.startsWith(`${path}/`))
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
      ))}
    </nav>
  )
}

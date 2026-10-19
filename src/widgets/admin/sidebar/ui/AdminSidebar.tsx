import { Link, useLocation } from 'react-router'

import { useReservationStats } from '@entities/admin-reservation'
import {
  ADMIN_DEAD_LETTERS_PATH,
  ADMIN_DRAWS_PATH,
  ADMIN_HOME_PATH,
  ADMIN_LOAD_TEST_PATH,
  ADMIN_MOCK_SETTINGS_PATH,
  ADMIN_PRODUCTS_PATH,
  ADMIN_PROMOTIONS_PATH,
  ADMIN_ORDERS_PATH,
  ADMIN_RECONCILIATION_PATH,
  ADMIN_RESERVATIONS_PATH,
  ADMIN_WAITINGROOM_PATH,
  readBackTo,
} from '@shared/config/routes'
import { srOnly } from '@shared/config/theme'
import { formatNumber } from '@shared/lib/formatNumber'

import * as styles from './AdminSidebar.css'

const BADGE_INTERVAL_MS = 30_000

// 오픈 중에 보는 화면(사전예약)과 등록·일상 업무(상품·판매)를 나눈다 — 관리자의 목적이
// "오픈 순간을 넘기는 관제"라 그 묶음을 위에 둔다.
const navGroups = [
  {
    label: null,
    items: [{ path: ADMIN_HOME_PATH, label: '운영 대시보드' }],
  },
  {
    label: '사전예약',
    items: [
      { path: ADMIN_RESERVATIONS_PATH, label: '예약 현황' },
      { path: ADMIN_WAITINGROOM_PATH, label: '대기열 관리' },
      { path: ADMIN_RECONCILIATION_PATH, label: '외부 예약 대조' },
    ],
  },
  {
    label: '상품·판매',
    items: [
      { path: ADMIN_PRODUCTS_PATH, label: '상품 관리' },
      { path: ADMIN_PROMOTIONS_PATH, label: '사전예약 관리' },
      { path: ADMIN_DRAWS_PATH, label: '럭키드로우 관리' },
      { path: ADMIN_ORDERS_PATH, label: '주문 관리' },
    ],
  },
  {
    label: '개발자 기능',
    items: [
      { path: ADMIN_LOAD_TEST_PATH, label: '부하 검증' },
      { path: ADMIN_DEAD_LETTERS_PATH, label: '이벤트 DLQ' },
      { path: ADMIN_MOCK_SETTINGS_PATH, label: 'Mock 설정' },
    ],
  },
]

export function AdminSidebar() {
  const location = useLocation()
  // 다른 메뉴에서 넘어온 상세(외부 예약 대조 → 예약 상세)는 들어온 메뉴를 켜 둔다.
  const pathname =
    readBackTo(location.state)?.to.split('?')[0] ?? location.pathname
  // 어느 화면에 있든 외부 등록 실패가 쌓이면 메뉴에서 보이게 한다 — 재처리하는 곳이 예약
  // 현황이라 그 메뉴에 단다. 같은 키라 운영 대시보드·예약 현황이 5~10초마다 받은 값을 그대로 읽는다. 구독마다 자동 갱신 타이머가 따로
  // 돌아 겹쳐 묻게 되므로, 배지는 그 화면들이 없을 때만 의미 있는 느린 간격으로 둔다.
  // 못 받았으면 배지를 숨긴다(0건으로 보이지 않게).
  const failures = useReservationStats(undefined, BADGE_INTERVAL_MS).data
    ?.syncJobs.REGISTER.DEAD_LETTER
  const badgeOf = (path: string) =>
    path === ADMIN_RESERVATIONS_PATH && failures ? failures : null

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
            const badge = badgeOf(path)
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
                {badge !== null && (
                  <span className={styles.badge}>
                    {formatNumber(badge)}
                    <span className={srOnly}>건 실패</span>
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

import { Link } from 'react-router'

import {
  ADMIN_CONSISTENCY_CHECK_PATH,
  ADMIN_LOAD_TEST_PATH,
  ADMIN_MOCK_SETTINGS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_PRODUCTS_PATH,
  ADMIN_PROMOTIONS_PATH,
  ADMIN_RESERVATIONS_PATH,
} from '@shared/config/routes'

import * as styles from './AdminHomePage.css'

const sections = [
  {
    path: ADMIN_PRODUCTS_PATH,
    label: '상품 관리',
    description: '상품 등록, 재고 조회, 배송구간 설정(사전예약)',
  },
  {
    path: ADMIN_PROMOTIONS_PATH,
    label: '사전 예약 관리',
    description: '사전예약 상품 관리',
  },
  {
    path: ADMIN_RESERVATIONS_PATH,
    label: '예약 현황',
    description: '주문/예약 현황 확인',
  },
  {
    path: ADMIN_CONSISTENCY_CHECK_PATH,
    label: '정합성 대조',
    description: '데이터 정합성 대조',
  },
  {
    path: ADMIN_LOAD_TEST_PATH,
    label: '부하 검증',
    description: '부하 검증',
  },
  {
    path: ADMIN_NOTIFICATIONS_PATH,
    label: '관리자 알림 내역 확인',
    description: '관리자 알림 내역 확인',
  },
  {
    path: ADMIN_MOCK_SETTINGS_PATH,
    label: 'Mock 설정',
    description: 'Mock 데이터 설정',
  },
]

export function AdminHomePage() {
  return (
    <div className={styles.root}>
      <div className={styles.title}>관리자 홈</div>
      <div className={styles.grid}>
        {sections.map(({ path, label, description }) => (
          <Link key={path} to={path} className={styles.card}>
            <span className={styles.cardTitle}>{label}</span>
            <span className={styles.cardDescription}>{description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

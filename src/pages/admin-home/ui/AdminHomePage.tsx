import { Link } from 'react-router'

import * as styles from './AdminHomePage.css'

const sections = [
  {
    path: '/admin/products',
    label: '상품 관리',
    description: '상품 등록, 재고 조회, 배송구간 설정(사전예약)',
  },
  {
    path: '/admin/preorders',
    label: '사전 예약 관리',
    description: '사전예약 상품 관리',
  },
  {
    path: '/admin/orders',
    label: '예약 현황',
    description: '주문/예약 현황 확인',
  },
  {
    path: '/admin/consistency-check',
    label: '정합성 대조',
    description: '데이터 정합성 대조',
  },
  {
    path: '/admin/load-test',
    label: '부하 검증',
    description: '부하 검증',
  },
  {
    path: '/admin/notifications',
    label: '관리자 알림 내역 확인',
    description: '관리자 알림 내역 확인',
  },
  {
    path: '/admin/mock-settings',
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

import { matchPath } from 'react-router'

import {
  DRAW_PATH,
  drawPath,
  MYPAGE_PATH,
  MYPAGE_TAB_LABELS,
  MYPAGE_TABS,
  PAYMENT_PATH,
  PREORDER_PATH,
  preorderPath,
  productPath,
  REVIEWS_PATH,
  SEARCH_PATH,
  SEARCH_RESULTS_PATH,
  SIGNUP_PATH,
} from '@shared/config/routes'

// 모바일 헤더에 로고 대신 '< 제목'을 띄우는 경로. 여기 없는 경로(홈·결과·404)는 로고 그대로다.
const titles: [pattern: string, title: string][] = [
  [PREORDER_PATH, '사전예약'],
  [preorderPath(':id'), '사전예약'],
  [productPath(':id'), '상품 상세'],
  [DRAW_PATH, '럭키드로우'],
  [drawPath(':id'), '럭키드로우'],
  [REVIEWS_PATH, '구매후기'],
  [SEARCH_PATH, '카테고리'],
  [SEARCH_RESULTS_PATH, '검색 결과'],
  [SIGNUP_PATH, '회원가입'],
]

export function getMobileTitle(pathname: string, search: string) {
  if (pathname === MYPAGE_PATH) {
    // 마이페이지는 탭(?state=)마다 제목이 다르다. 모르는 값이면 Mypage처럼 기본 탭으로 본다.
    const state = new URLSearchParams(search).get('state')
    return MYPAGE_TAB_LABELS[
      MYPAGE_TABS.find((tab) => tab === state) ?? 'preorder-check'
    ]
  }
  if (pathname === PAYMENT_PATH) {
    // 럭키드로우 응모비 결제는 PaymentPage 본문 제목처럼 '응모 / 결제'다.
    return new URLSearchParams(search).has('drawId')
      ? '응모 / 결제'
      : '주문 / 결제'
  }
  return titles.find(([pattern]) => matchPath(pattern, pathname))?.[1]
}

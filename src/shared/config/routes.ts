// 여러 레이어가 같이 참조하는 경로. 페이지끼리 서로 import하지 않도록 shared에 둔다.
// 라우터는 동적 세그먼트를 함수에 ':id' 문자열로 넘겨 패턴을 만든다(productPath(':productId')).
// 카카오·토스 콜백 경로는 SDK 호출과 짝이라 각 feature(login, payment)가 소유한다.
import type { OrderSource } from '@shared/api/types'

export const HOME_PATH = '/'
export const SIGNUP_PATH = '/signup'
export const PAYMENT_PATH = '/payment'
// 결제는 사전예약 하나, 또는 장바구니에서 고른 줄 단위다(order 명세). 새로고침해도 남도록 쿼리에 싣는다.
export const paymentPath = (preorderId: string) =>
  `${PAYMENT_PATH}?${new URLSearchParams({ preorderId })}`
// 럭키 드로우 응모 — 배송지를 받고 응모한 뒤 응모비를 결제한다.
export const drawPaymentPath = (drawId: string) =>
  `${PAYMENT_PATH}?${new URLSearchParams({ drawId })}`
// 장바구니에서 고른 줄(cartItemId)을 결제한다.
export const cartPaymentPath = (cartItemIds: string[]) =>
  `${PAYMENT_PATH}?${new URLSearchParams({ cart: cartItemIds.join(',') })}`
export const REVIEWS_PATH = '/reviews'
// 헤더·탭바 없이 전체 화면으로 뜨는 사전예약 안내(RootLayout 밖).
export const ONBOARDING_PATH = '/onboarding'
// ponytail: 이벤트 페이지가 아직 없어 NotFound로 간다 — 페이지가 생기면 라우터에 등록.
export const EVENTS_PATH = '/events'

export const PREORDER_PATH = '/preorder'
export const preorderPath = (preorderId: string | number) =>
  `${PREORDER_PATH}/${preorderId}`

// 럭키 드로우 — 회차 목록과 회차 상세(응모).
export const DRAW_PATH = '/draws'
export const drawPath = (drawId: string) => `${DRAW_PATH}/${drawId}`

export const PRODUCTS_PATH = '/products'
export const productPath = (productId: string | number) =>
  `${PRODUCTS_PATH}/${productId}`

export const SEARCH_PATH = '/search'
// URLSearchParams가 인코딩까지 해주므로 쿼리를 손으로 붙이지 않는다.
export const searchPath = (params: Record<string, string>) =>
  `${SEARCH_PATH}?${new URLSearchParams(params)}`
// 검색창에서 엔터를 치면 오는 키워드 검색 결과. 위 /search는 카테고리 둘러보기다.
export const SEARCH_RESULTS_PATH = '/search/results'
export const searchResultsPath = (keyword: string) =>
  `${SEARCH_RESULTS_PATH}?${new URLSearchParams({ q: keyword })}`

export const MYPAGE_TABS = [
  'preorder-check',
  'cart',
  'history',
  'address-manage',
  'reviews',
  'draw',
] as const
export type MypageTab = (typeof MYPAGE_TABS)[number]
// 마이페이지 메뉴와 모바일 헤더 제목이 같은 이름을 쓴다.
export const MYPAGE_TAB_LABELS: Record<MypageTab, string> = {
  history: '주문 내역',
  'preorder-check': '사전예약 내역',
  draw: '럭키드로우',
  cart: '장바구니',
  'address-manage': '배송지 관리',
  reviews: '내 리뷰',
}

export const MYPAGE_PATH = '/mypage'
export const mypagePath = (tab: MypageTab) => `${MYPAGE_PATH}?state=${tab}`

// preorder: 예약만 접수(결제 전) / preorder-paid: 사전예약 결제 완료 / paid: 일반 구매 완료 / failed: 결제 실패
export const RESULT_STATUSES = [
  'preorder',
  'preorder-paid',
  'paid',
  'failed',
] as const
export type ResultStatus = (typeof RESULT_STATUSES)[number]

export const RESULT_PATH = '/result'
/** 결제·예약 결과 화면. 어떤 결과를 보여줄지는 쿼리로 넘긴다 */
export const resultPath = (status: ResultStatus) =>
  `${RESULT_PATH}?status=${status}`

// 관리자 경로 — 라우터, 헤더 로고, 사이드바, breadcrumb·이동·제출 후 복귀가
// 같은 문자열을 참조한다.
export const ADMIN_HOME_PATH = '/admin'

export const ADMIN_PRODUCTS_PATH = '/admin/products'
export const ADMIN_PRODUCT_NEW_PATH = '/admin/products/new'
// 상세 화면의 탭. 어느 탭으로 보낼지 정하는 쪽(목록)과 읽는 쪽(상세)이 떨어져 있어
// 값은 여기 두고 양쪽이 같은 것을 쓴다 — 라벨은 상세 화면이 들고 있다.
export const ADMIN_PRODUCT_TABS = ['edit', 'stock', 'shipping'] as const
export type AdminProductTab = (typeof ADMIN_PRODUCT_TABS)[number]

/** 상품 상세. tab을 주면 그 탭으로 바로 연다(안 주면 상세의 기본 탭) */
export const adminProductPath = (productId: string, tab?: AdminProductTab) =>
  `${ADMIN_PRODUCTS_PATH}/${productId}${tab ? `?tab=${tab}` : ''}`

export const ADMIN_PROMOTIONS_PATH = '/admin/preorders'
export const ADMIN_PROMOTION_NEW_PATH = '/admin/preorders/new'
/** 프로모션 상세(수정) */
export const adminPromotionPath = (promotionId: string) =>
  `${ADMIN_PROMOTIONS_PATH}/${promotionId}`

export const ADMIN_DRAWS_PATH = '/admin/draws'
export const ADMIN_DRAW_NEW_PATH = '/admin/draws/new'
/** 럭키 드로우 회차 상세(응모·추첨 진행) */
export const adminDrawPath = (drawId: string) => `${ADMIN_DRAWS_PATH}/${drawId}`

/** 대기열 관리 — 입장 속도·상품별 상한·최대 대기·이탈 유예(바꾸면 바로 회원에게 반영) */
export const ADMIN_WAITINGROOM_PATH = '/admin/waitingroom'
export const ADMIN_RESERVATIONS_PATH = '/admin/reservations'
/** 예약 상세 */
export const adminReservationPath = (preorderId: string) =>
  `${ADMIN_RESERVATIONS_PATH}/${preorderId}`

/** 주문 관리 — 모든 회원의 주문과 배송 단계 */
export const ADMIN_ORDERS_PATH = '/admin/orders'
/** 출처를 걸러서 연다(럭키드로우 회차 → 당첨 주문) */
export const adminOrdersPath = (source?: OrderSource) =>
  source ? `${ADMIN_ORDERS_PATH}?source=${source}` : ADMIN_ORDERS_PATH
export const adminOrderPath = (orderId: string) =>
  `${ADMIN_ORDERS_PATH}/${orderId}`

/**
 * 상세로 들어갈 때 navigate state로 넘기는 '돌아갈 곳'. 예약 상세는 예약 현황 말고
 * 외부 예약 대조에서도 들어오므로 들어온 화면으로 돌려보낸다.
 */
export type BackTo = { label: string; to: string }

/** location.state에서 BackTo를 꺼낸다. 주소로 바로 열면 state가 없다 */
export const readBackTo = (state: unknown): BackTo | undefined => {
  const backTo = (state as { backTo?: Partial<BackTo> } | null)?.backTo
  return typeof backTo?.label === 'string' && typeof backTo.to === 'string'
    ? { label: backTo.label, to: backTo.to }
    : undefined
}

/** 외부 예약 대조 — 우리 예약과 외부 예약 시스템 원장을 맞춰 본다 */
export const ADMIN_RECONCILIATION_PATH = '/admin/reconciliation'
export const ADMIN_LOAD_TEST_PATH = '/admin/load-test'
/** 이벤트 DLQ — 서버끼리 주고받는 메시지 중 처리에 실패해 멈춘 것(개발자 기능) */
export const ADMIN_DEAD_LETTERS_PATH = '/admin/dead-letters'
export const adminDeadLetterPath = (deadLetterId: string) =>
  `${ADMIN_DEAD_LETTERS_PATH}/${deadLetterId}`
// 아직 기능 범위가 안 정해져 placeholder로만 열리는 메뉴.
export const ADMIN_NOTIFICATIONS_PATH = '/admin/notifications'
// 관리자 로그인. 사이드바 없는 단독 화면이라 AdminLayout 밖에 둔다.
export const ADMIN_LOGIN_PATH = '/admin/login'
export const ADMIN_MOCK_SETTINGS_PATH = '/admin/mock-settings'

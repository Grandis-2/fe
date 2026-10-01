// 여러 레이어가 같이 참조하는 경로. 페이지끼리 서로 import하지 않도록 shared에 둔다.
export const SIGNUP_PATH = '/signup'

export const MYPAGE_TABS = [
  'preorder-check',
  'cart',
  'history',
  'address-manage',
] as const
export type MypageTab = (typeof MYPAGE_TABS)[number]

export const mypagePath = (tab: MypageTab) => `/mypage?state=${tab}`

export const RESULT_STATUSES = ['preorder', 'paid', 'failed'] as const
export type ResultStatus = (typeof RESULT_STATUSES)[number]

export const resultPath = (status: ResultStatus) => `/result?status=${status}`

// 관리자 경로 — 라우터와 여러 화면(목록·생성·수정의 breadcrumb, 이동, 제출 후 복귀)이
// 같은 문자열을 참조한다.
export const ADMIN_PRODUCTS_PATH = '/admin/products'
export const ADMIN_PRODUCT_NEW_PATH = '/admin/products/new'
export const adminProductPath = (productId: string) =>
  `${ADMIN_PRODUCTS_PATH}/${productId}`

export const ADMIN_PROMOTIONS_PATH = '/admin/preorders'
export const ADMIN_PROMOTION_NEW_PATH = '/admin/preorders/new'
export const adminPromotionPath = (promotionId: string) =>
  `${ADMIN_PROMOTIONS_PATH}/${promotionId}`

// 예약 현황은 목록 한 페이지뿐이다 — 상세 화면이 없어 개별 경로가 없다.
export const ADMIN_RESERVATIONS_PATH = '/admin/orders'

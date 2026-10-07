// 여러 레이어가 같이 참조하는 경로. 페이지끼리 서로 import하지 않도록 shared에 둔다.
// 라우터는 동적 세그먼트를 함수에 ':id' 문자열로 넘겨 패턴을 만든다(productPath(':productId')).
// 카카오·토스 콜백 경로는 SDK 호출과 짝이라 각 feature(login, payment)가 소유한다.
export const HOME_PATH = '/'
export const SIGNUP_PATH = '/signup'
export const PAYMENT_PATH = '/payment'
export const REVIEWS_PATH = '/reviews'
// 헤더·탭바 없이 전체 화면으로 뜨는 사전예약 안내(RootLayout 밖).
export const ONBOARDING_PATH = '/onboarding'
// ponytail: 이벤트 페이지가 아직 없어 NotFound로 간다 — 페이지가 생기면 라우터에 등록.
export const EVENTS_PATH = '/events'

export const PREORDER_PATH = '/preorder'
export const preorderPath = (preorderId: string | number) =>
  `${PREORDER_PATH}/${preorderId}`

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
] as const
export type MypageTab = (typeof MYPAGE_TABS)[number]

export const MYPAGE_PATH = '/mypage'
export const mypagePath = (tab: MypageTab) => `${MYPAGE_PATH}?state=${tab}`

export const RESULT_STATUSES = ['preorder', 'paid', 'failed'] as const
export type ResultStatus = (typeof RESULT_STATUSES)[number]

export const RESULT_PATH = '/result'
export const resultPath = (status: ResultStatus) =>
  `${RESULT_PATH}?status=${status}`

// 관리자 경로 — 라우터, 헤더 로고, 사이드바, 관리자 홈 카드, breadcrumb·이동·제출 후 복귀가
// 같은 문자열을 참조한다.
export const ADMIN_HOME_PATH = '/admin'

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

// 아직 기능 범위가 안 정해져 placeholder로만 열리는 메뉴들.
export const ADMIN_CONSISTENCY_CHECK_PATH = '/admin/consistency-check'
export const ADMIN_LOAD_TEST_PATH = '/admin/load-test'
export const ADMIN_NOTIFICATIONS_PATH = '/admin/notifications'
export const ADMIN_MOCK_SETTINGS_PATH = '/admin/mock-settings'

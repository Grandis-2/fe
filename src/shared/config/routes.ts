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

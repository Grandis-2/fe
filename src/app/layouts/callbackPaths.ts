import { KAKAO_CALLBACK_PATH } from '@features/login'
import {
  DRAW_PAYMENT_CALLBACK_PATH,
  PAYMENT_CALLBACK_PATH,
} from '@features/payment'

// 외부(카카오·토스)에서 돌아와 처리만 하고 바로 넘어가는 화면 — 헤더·탭바 없이 로딩만 보여 준다.
const CALLBACK_PATHS = [
  KAKAO_CALLBACK_PATH,
  PAYMENT_CALLBACK_PATH,
  DRAW_PAYMENT_CALLBACK_PATH,
]

export const isCallbackPath = (pathname: string) =>
  CALLBACK_PATHS.includes(pathname)

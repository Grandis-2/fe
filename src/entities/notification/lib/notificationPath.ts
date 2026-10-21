import type { NotificationTarget } from '@shared/api/types'
import { drawPath, mypagePath, productPath } from '@shared/config/routes'

// 알림을 눌렀을 때 갈 화면. 모르는 type이면 null — 이동하지 않고 알림만 보여 준다(명세).
// ponytail: 회원용 예약 상세 화면이 없어 PREORDER는 사전예약 내역 탭으로 보낸다 — 상세 화면이 생기면 id로 바꾼다.
export function notificationPath({ type, id }: NotificationTarget) {
  if (type === 'PREORDER') return mypagePath('preorder-check')
  if (type === 'PRODUCT') return productPath(id)
  if (type === 'DRAW') return drawPath(id)
  return null
}

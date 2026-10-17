import { http, HttpResponse, sse } from 'msw'

import { draws } from '../fixtures/draw'
import { products } from '../fixtures/product'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  CountResponse,
  NotificationItem,
  NotificationList,
} from '../../types'
import type { RequestHandler } from 'msw'

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString()

const notificationUuid = (n: number) =>
  `90000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const preorderProductId =
  products.find((product) => product.saleMode === 'PREORDER')?.productId ?? ''

// ponytail: 메모리 목록이라 새로고침하면 읽음이 되돌아간다. 새 알림은 생기지 않는다.
let notifications: NotificationItem[] = [
  {
    notificationId: notificationUuid(1),
    kind: 'PREORDER_OPENED',
    title: '사전예약 오픈',
    message: '알림 신청하신 상품의 사전예약이 시작됐어요.',
    target: { type: 'PRODUCT', id: preorderProductId },
    read: false,
    createdAt: minutesAgo(3),
  },
  {
    notificationId: notificationUuid(2),
    kind: 'PREORDER_REGISTERED',
    title: '사전예약 등록 완료',
    message: '사전예약 등록이 완료됐어요. 24시간 안에 결제해 주세요.',
    target: { type: 'PREORDER', id: crypto.randomUUID() },
    read: false,
    createdAt: minutesAgo(42),
  },
  {
    notificationId: notificationUuid(3),
    kind: 'DRAW_WON',
    title: '럭키 드로우 당첨',
    message: '축하해요! 응모하신 럭키 드로우에 당첨됐어요.',
    target: { type: 'DRAW', id: draws[0]?.drawId ?? '' },
    read: false,
    createdAt: minutesAgo(60 * 5),
  },
  {
    notificationId: notificationUuid(4),
    kind: 'PREORDER_CANCELED',
    title: '사전예약 취소 완료',
    message: '결제 기한이 지나 사전예약이 취소됐어요.',
    target: { type: 'PREORDER', id: crypto.randomUUID() },
    read: true,
    createdAt: minutesAgo(60 * 24 * 3),
  },
]

// 페이지 주소에 ?mock=empty를 붙이면 알림이 하나도 없는 상태가 된다(빈 패널 확인용).
// 실패는 forceErrorHandler의 ?mock=500으로 본다.
const currentNotifications = () =>
  new URLSearchParams(location.search).get('mock') === 'empty'
    ? []
    : notifications

const unreadCount = (): CountResponse => ({
  count: currentNotifications().filter((item) => !item.read).length,
})

const noContent = () => new HttpResponse(null, { status: 204 })

export const notificationHandlers: RequestHandler[] = [
  http.get(url('/api/v1/notifications/unread-count'), () => ok(unreadCount())),
  // 연결하면 지금 수를 한 번 보낸다(새 알림이 생기지 않아 그 뒤로는 오지 않는다). 읽음은 실시간으로 오지 않는다(명세).
  sse<{ unread: CountResponse }>(
    url('/api/v1/notifications/stream'),
    ({ client }) => {
      client.send({ event: 'unread', data: unreadCount() })
    },
  ),
  http.get(url('/api/v1/notifications'), () =>
    ok<NotificationList>({ items: currentNotifications(), nextCursor: null }),
  ),
  // 이미 읽었어도 204. 없는 id는 404.
  http.patch(
    url('/api/v1/notifications/:notificationId/read'),
    ({ params }) => {
      if (
        !notifications.some((it) => it.notificationId === params.notificationId)
      )
        return fail(404, {
          code: 'NOT_FOUND',
          message: '알림을 찾을 수 없습니다.',
        })
      notifications = notifications.map((it) =>
        it.notificationId === params.notificationId
          ? { ...it, read: true }
          : it,
      )
      return noContent()
    },
  ),
  http.post(url('/api/v1/notifications/read-all'), () => {
    notifications = notifications.map((it) => ({ ...it, read: true }))
    return noContent()
  }),
]

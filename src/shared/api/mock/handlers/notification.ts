import { http, HttpResponse, sse } from 'msw'

import { draws } from '../fixtures/draw'
import { products } from '../fixtures/product'
import { fail, invalid, ok } from '../response'
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
  // 패널 끝까지 내려 다음 쪽(20건 뒤)을 받아 보도록 읽은 옛 알림을 채운다.
  ...Array.from({ length: 21 }, (_, i): NotificationItem => ({
    notificationId: notificationUuid(5 + i),
    kind: 'PREORDER_OPENED',
    title: '사전예약 오픈',
    message: `알림 신청하신 상품의 사전예약이 시작됐어요. (${i + 1}일 전)`,
    target: { type: 'PRODUCT', id: preorderProductId },
    read: true,
    createdAt: minutesAgo(60 * 24 * (4 + i)),
  })),
]

const PAGE_SIZE_DEFAULT = 20
const PAGE_SIZE_MAX = 50

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
  // 최신순 커서 페이지 — 커서는 다음 쪽이 시작하는 자리(목업만의 값, 화면은 받은 그대로 돌려보낸다).
  http.get(url('/api/v1/notifications'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const cursor = params.get('cursor')
    const size = Number(params.get('size') ?? PAGE_SIZE_DEFAULT)
    const start = cursor === null ? 0 : Number(cursor)
    const list = currentNotifications()
    const violations = []
    if (
      !Number.isInteger(start) ||
      start < 0 ||
      start >= Math.max(list.length, 1)
    )
      violations.push({ field: 'cursor', message: '잘못된 커서입니다.' })
    if (!Number.isInteger(size) || size < 1 || size > PAGE_SIZE_MAX)
      violations.push({
        field: 'size',
        message: `1~${PAGE_SIZE_MAX} 사이여야 합니다.`,
      })
    if (violations.length > 0) return invalid(violations)
    const end = start + size
    return ok<NotificationList>({
      items: list.slice(start, end),
      nextCursor: end < list.length ? String(end) : null,
    })
  }),
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

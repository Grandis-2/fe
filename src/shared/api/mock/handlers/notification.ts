import { http } from 'msw'

import { mypagePath, PREORDER_PATH } from '@shared/config/routes'

import { ok } from '../response'
import { url } from '../url'

import type {
  CountResponse,
  NotificationItem,
  NotificationList,
} from '../../types'
import type { RequestHandler } from 'msw'

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString()

// ponytail: 알림 API가 아직 없어 고정 목록으로 흉내낸다 — 읽음 처리는 없다.
const NOTIFICATIONS: NotificationItem[] = [
  {
    notificationId: 'n1',
    title: '사전예약 오픈',
    message: '알림 신청하신 아이폰 Duo 사전예약이 시작됐어요.',
    link: PREORDER_PATH,
    read: false,
    createdAt: minutesAgo(3),
  },
  {
    notificationId: 'n2',
    title: '구매 확정 대기',
    message: '맥북 프로 14 주문의 구매를 확정해 주세요.',
    link: mypagePath('preorder-check'),
    read: false,
    createdAt: minutesAgo(42),
  },
  {
    notificationId: 'n3',
    title: '배송 시작',
    message: '갤럭시 워치 주문이 출고됐어요.',
    link: mypagePath('history'),
    read: false,
    createdAt: minutesAgo(60 * 5),
  },
  {
    notificationId: 'n4',
    title: '장바구니 가격 변동',
    message: '장바구니에 담은 에어팟 프로 3 가격이 내려갔어요.',
    link: mypagePath('cart'),
    read: false,
    createdAt: minutesAgo(60 * 20),
  },
  {
    notificationId: 'n5',
    title: '리뷰 작성',
    message: '받으신 상품은 어떠셨나요? 리뷰를 남겨 주세요.',
    link: mypagePath('reviews'),
    read: false,
    createdAt: minutesAgo(60 * 30),
  },
  {
    notificationId: 'n6',
    title: '쿠폰 지급',
    message: '사전예약 알림 신청 쿠폰이 지급됐어요.',
    link: null,
    read: true,
    createdAt: minutesAgo(60 * 24 * 3),
  },
]

export const notificationHandlers: RequestHandler[] = [
  http.get(url('/api/v1/notifications/unread-count'), () =>
    ok<CountResponse>({
      count: NOTIFICATIONS.filter((item) => !item.read).length,
    }),
  ),
  http.get(url('/api/v1/notifications'), () =>
    ok<NotificationList>({ items: NOTIFICATIONS }),
  ),
]

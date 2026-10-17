// 누르면 갈 곳 — 주소는 type·id로 프론트가 만든다. PREORDER(예약 공개 토큰), PRODUCT(상품 id), DRAW(회차 id).
// type은 늘어날 수 있어 string으로 받는다 — 모르는 값이면 이동하지 않고 알림만 보여 준다.
export type NotificationTarget = {
  type: string
  id: string
}

// GET /api/v1/notifications 항목. kind(PREORDER_REGISTERED 등)도 늘어날 수 있다.
export type NotificationItem = {
  notificationId: string
  kind: string
  title: string
  message: string
  target: NotificationTarget
  read: boolean
  createdAt: string
}

// 최신순 커서 페이지. nextCursor가 null이면 마지막 페이지다.
export type NotificationList = {
  items: NotificationItem[]
  nextCursor: string | null
}

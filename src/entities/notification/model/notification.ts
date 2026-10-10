import type { NotificationItem as NotificationItemDto } from '@shared/api/types'

// 응답 모양 그대로 쓴다. 이름을 Notification으로 하면 브라우저 내장 Notification 타입과 겹쳐 Item을 붙인다.
export type NotificationItem = NotificationItemDto

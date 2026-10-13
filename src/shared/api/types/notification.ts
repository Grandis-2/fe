// ponytail: 백엔드 알림 API가 아직 없어 프론트 제안 모양이다(/notifications). 확정되면 맞출 것.
export type NotificationItem = {
  notificationId: string
  title: string
  message: string
  // 누르면 이동할 화면. 없으면 읽기만 하는 알림이다.
  link: string | null
  read: boolean
  createdAt: string
}

export type NotificationList = {
  items: NotificationItem[]
}

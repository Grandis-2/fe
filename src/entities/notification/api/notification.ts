import { apiClient } from '@shared/api/client'
import type { CountResponse, NotificationList } from '@shared/api/types'

// [member] GET /api/v1/notifications/unread-count — 안 읽은 알림 수
export const getUnreadNotificationCount = async (signal?: AbortSignal) => {
  const { count } = await apiClient.request<CountResponse>(
    '/api/v1/notifications/unread-count',
    { signal },
  )
  return count
}

// [member] GET /api/v1/notifications — 내 알림 목록
// ponytail: 첫 페이지(20건)만 받는다 — 패널에 "더 보기"가 필요해지면 nextCursor로 이어 받는다.
export const getNotifications = (signal?: AbortSignal) =>
  apiClient.request<NotificationList>('/api/v1/notifications', { signal })

// [member] PATCH /api/v1/notifications/{notificationId}/read — 알림 읽음 처리
// 204. 이미 읽었어도 204라 다시 보내도 된다. 남의 알림·없는 id는 404.
export const readNotification = (notificationId: string) =>
  apiClient.request<void>(
    `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: 'PATCH' },
  )

// [member] POST /api/v1/notifications/read-all — 알림 모두 읽음
// 204. 안 읽은 알림이 없어도 204다.
export const readAllNotifications = () =>
  apiClient.request<void>('/api/v1/notifications/read-all', { method: 'POST' })

// [member] GET /api/v1/notifications/stream — 안 읽은 수 실시간 연결
// 안 읽은 수 실시간 연결(SSE). 열리면 onOpen, `unread` 이벤트마다 onCount를 부르고, 서버가 닫으면 끝난다(다시 여는 건 호출부).
// 이벤트는 빈 줄로 끝나고, `:`로 시작하는 줄(25초마다 오는 연결 유지용 주석)은 무시한다.
export async function streamUnreadNotificationCount(
  onCount: (count: number) => void,
  onOpen: () => void,
  signal: AbortSignal,
) {
  const body = await apiClient.openStream(
    '/api/v1/notifications/stream',
    signal,
  )
  onOpen()
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '')
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const event of events) {
      let type = ''
      // data 줄이 여러 개면 줄바꿈으로 잇는다(SSE 명세).
      const data: string[] = []
      for (const line of event.split('\n')) {
        const colon = line.indexOf(':')
        const value = line.slice(colon + 1).trimStart()
        if (line.startsWith('event:')) type = value
        else if (line.startsWith('data:')) data.push(value)
      }
      if (type !== 'unread' || data.length === 0) continue
      // 깨진 이벤트 하나로 연결을 끊지 않고 그 이벤트만 버린다.
      let parsed: Partial<CountResponse> | null
      try {
        parsed = JSON.parse(data.join('\n')) as Partial<CountResponse> | null
      } catch {
        continue
      }
      if (typeof parsed?.count === 'number') onCount(parsed.count)
    }
  }
}

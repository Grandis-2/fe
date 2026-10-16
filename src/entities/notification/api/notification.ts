import { apiClient } from '@shared/api/client'
import type { CountResponse, NotificationList } from '@shared/api/types'

export const getUnreadNotificationCount = async (signal?: AbortSignal) => {
  const { count } = await apiClient.request<CountResponse>(
    '/api/v1/notifications/unread-count',
    { signal },
  )
  return count
}

export const getNotifications = (signal?: AbortSignal) =>
  apiClient.request<NotificationList>('/api/v1/notifications', { signal })

// 안 읽은 수 실시간 연결(SSE). `unread` 이벤트마다 onCount를 부르고, 서버가 닫으면 끝난다(다시 여는 건 호출부).
// 이벤트는 빈 줄로 끝나고, `:`로 시작하는 줄(25초마다 오는 연결 유지용 주석)은 무시한다.
export async function streamUnreadNotificationCount(
  onCount: (count: number) => void,
  signal: AbortSignal,
) {
  const body = await apiClient.openStream(
    '/api/v1/notifications/stream',
    signal,
  )
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
      let count: number
      try {
        count = (JSON.parse(data.join('\n')) as CountResponse).count
      } catch {
        // 깨진 이벤트 하나로 연결을 끊지 않고 그 이벤트만 버린다.
        continue
      }
      onCount(count)
    }
  }
}

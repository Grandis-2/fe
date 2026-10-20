import { useEffect, useState } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiRequestError } from '@shared/api/client'
import { pollingRetry, queryPolicy } from '@shared/api/queryPolicy'
import { logWait } from '@shared/api/requestLog'
import { delay } from '@shared/lib/delay'

import {
  getUnreadNotificationCount,
  streamUnreadNotificationCount,
} from './notification'
import { notificationKeys } from './useNotifications'

const queryKey = notificationKeys.unreadCount
// SSE가 끊겨 있는 동안은 60초마다 묻는다(명세: 503이면 unread-count 주기 조회로 돌아간다).
// 실패하면 pollingRetry가 다시 묻는다 — 이미 30초보다 길어 간격은 그대로 두고 지터만 준다.
// 배지는 보조 정보라 실패 안내를 띄우지 않고 마지막 개수를 그대로 둔다.
const POLL_INTERVAL_MS = 60_000
// 연결된 동안에도 실시간으로 오지 못한 알림이 드물게 있어 5분마다 한 번 맞춘다(명세).
const LIVE_SYNC_MS = 5 * 60_000
// 닫히면 0~5초 사이 무작위로 기다렸다 다시 연다. 연달아 실패하면 상한을 두 배씩(최대 1분) 늘린다.
const RECONNECT_MS = 5_000
const RECONNECT_MAX_MS = 60_000

// 헤더 알림 배지용. 비회원은 알림이 없으니 연결·요청하지 않는다(로그아웃하면 연결을 닫는다).
// 첫 수는 조회로 받고, 그 뒤로는 SSE의 unread 이벤트로 캐시를 덮어쓴다.
export const useUnreadNotificationCount = (enabled: boolean) => {
  const queryClient = useQueryClient()
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const { signal } = controller
    const connect = async () => {
      let failures = 0
      while (!signal.aborted) {
        try {
          await streamUnreadNotificationCount(
            (count) => {
              // 이벤트를 받았으면 제대로 이어진 연결이다 — 그때만 실패 횟수를 되돌린다.
              failures = 0
              // 먼저 보낸 조회 응답이 늦게 와서 이 수를 덮지 않게 끊는다.
              void queryClient.cancelQueries({ queryKey })
              queryClient.setQueryData(queryKey, count)
            },
            // 이벤트가 없어도 연결이 살아 있으면 주기 조회를 멈춘다.
            () => setIsLive(true),
            signal,
          )
        } catch (caught) {
          if (signal.aborted) return
          // 관리자 토큰(403)은 알림 대상이 아니다 — 다시 열지 않는다.
          if (caught instanceof ApiRequestError && caught.status === 403) {
            setIsLive(false)
            return
          }
        }
        // 열리자마자 닫히는 것도 실패로 센다 — 안 그러면 재연결 간격이 늘지 않는다.
        failures += 1
        setIsLive(false)
        const maxMs = Math.min(RECONNECT_MS * 2 ** failures, RECONNECT_MAX_MS)
        const waitMs = Math.random() * maxMs
        logWait({
          sse: true,
          waitMs,
          baseMs: RECONNECT_MS,
          failureCount: failures - 1,
          retryAfterMs: 0,
          minMs: 0,
          maxMs,
        })
        await delay(waitMs)
      }
    }
    void connect()
    return () => {
      controller.abort()
      setIsLive(false)
    }
  }, [enabled, queryClient])

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getUnreadNotificationCount(signal),
    enabled,
    ...queryPolicy.live,
    refetchInterval: isLive ? LIVE_SYNC_MS : POLL_INTERVAL_MS,
    ...pollingRetry(() =>
      isLive || queryClient.getQueryData(queryKey) === undefined
        ? null
        : POLL_INTERVAL_MS,
    ),
  })
}

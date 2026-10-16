import { useEffect, useState } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiRequestError } from '@shared/api/client'
import { pollingInterval, queryPolicy } from '@shared/api/queryPolicy'
import { delay } from '@shared/lib/delay'

import {
  getUnreadNotificationCount,
  streamUnreadNotificationCount,
} from './notification'

const queryKey = ['notifications', 'unread-count'] as const
// SSE가 끊겨 있는 동안만 주기적으로 묻는다(명세: 503이면 unread-count 주기 조회로 돌아간다).
// 조회가 실패하면 pollingInterval이 간격을 4배로 늘린다.
const POLL_INTERVAL_MS = 60_000
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
          await streamUnreadNotificationCount((count) => {
            failures = 0
            setIsLive(true)
            queryClient.setQueryData(queryKey, count)
          }, signal)
        } catch (caught) {
          if (signal.aborted) return
          // 관리자 토큰(403)은 알림 대상이 아니다 — 다시 열지 않는다.
          if (caught instanceof ApiRequestError && caught.status === 403) {
            setIsLive(false)
            return
          }
          failures += 1
        }
        setIsLive(false)
        await delay(
          Math.random() *
            Math.min(RECONNECT_MS * 2 ** failures, RECONNECT_MAX_MS),
        )
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
    refetchInterval: isLive ? false : pollingInterval(POLL_INTERVAL_MS),
  })
}

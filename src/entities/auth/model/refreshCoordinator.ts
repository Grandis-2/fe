import { ApiRequestError, configureApiAuth } from '@/shared/api/client'
import type { Session } from '@/shared/api/types'

import { refreshSession } from '../api/auth'

import { useSessionStore } from './sessionStore'

// 탭 간에 재발급 결과를 공유한다 — 브로드캐스트를 받은 탭은 자기가 다시
// 네트워크를 안 타도 된다(아래 CROSS_TAB_FRESH_WINDOW_MS 참고).
const CHANNEL_NAME = 'nova-auth'
const LOCK_NAME = 'nova-auth-refresh'
// 락을 기다리는 동안 다른 탭이 이미 갱신했으면, 이 창(ms) 안이면 나는 다시 안 부른다.
const CROSS_TAB_FRESH_WINDOW_MS = 5000

type BroadcastMessage =
  { type: 'session-updated'; session: Session } | { type: 'session-cleared' }

let channel: BroadcastChannel | null = null
let lastRefreshedAt = 0

function getChannel() {
  if (channel) return channel
  if (typeof BroadcastChannel === 'undefined') return null

  channel = new BroadcastChannel(CHANNEL_NAME)
  channel.addEventListener(
    'message',
    (event: MessageEvent<BroadcastMessage>) => {
      if (event.data.type === 'session-updated') {
        useSessionStore.getState().setSession(event.data.session)
        lastRefreshedAt = Date.now()
      } else {
        useSessionStore.getState().clearSession()
      }
    },
  )
  return channel
}

// 다른 탭에도 세션이 끊겼음을 알린다 — logout()처럼 이 파일 바깥에서 세션을
// 지우는 경로도 재발급 실패와 같은 프로토콜을 타야 탭 간 상태가 어긋나지 않는다.
export function broadcastSessionCleared() {
  getChannel()?.postMessage({
    type: 'session-cleared',
  } satisfies BroadcastMessage)
}

async function performRefresh(): Promise<boolean> {
  try {
    const session = await refreshSession()
    useSessionStore.getState().setSession(session)
    lastRefreshedAt = Date.now()
    getChannel()?.postMessage({
      type: 'session-updated',
      session,
    } satisfies BroadcastMessage)
    return true
  } catch (caught) {
    // 인증이 실제로 끊긴 경우(401)만 세션을 지운다 — 일시적 네트워크 오류까지
    // 로그아웃 처리하면 멀쩡한 세션이 끊긴다.
    if (caught instanceof ApiRequestError && caught.status === 401) {
      useSessionStore.getState().clearSession()
      broadcastSessionCleared()
    }
    return false
  }
}

// 이 탭 안에서 여러 곳이 동시에 불러도 진행 중인 Promise 하나를 공유한다
// (single-flight). 11-frontend-guide.md §4의 필수 계약이다 — 같은 쿠키로 재발급을
// 두 번 보내면 둘째가 토큰 재사용 공격으로 판정돼 세션이 끊긴다.
let inFlight: Promise<boolean> | null = null

export function ensureFreshSession(): Promise<boolean> {
  if (!inFlight) {
    inFlight = runRefresh().finally(() => {
      inFlight = null
    })
  }
  return inFlight
}

async function runRefresh(): Promise<boolean> {
  getChannel() // 리스너를 미리 붙여 둔다.

  // navigator.locks 미지원 환경(구형 브라우저)에서는 탭 하나만 쓴다고 보고 그냥 수행한다.
  if (typeof navigator === 'undefined' || !('locks' in navigator)) {
    return performRefresh()
  }

  return navigator.locks.request(LOCK_NAME, async () => {
    // 락을 기다리는 동안 다른 탭이 이미 갱신을 끝냈으면(브로드캐스트로 반영됨)
    // 내가 또 네트워크를 타지 않는다.
    if (Date.now() - lastRefreshedAt < CROSS_TAB_FRESH_WINDOW_MS) return true
    return performRefresh()
  })
}

// shared/api/client는 entities를 import할 수 없어서(FSD 경계) 여기서 역으로
// 훅을 등록한다 — entities/auth가 앱 부팅 시 이 모듈을 로드하기만 하면 이 아래
// 코드가 실행되어 등록이 끝난다.
configureApiAuth({
  getAuthHeaders: (): Record<string, string> => {
    const token = useSessionStore.getState().sessionToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
  onUnauthorized: ensureFreshSession,
})

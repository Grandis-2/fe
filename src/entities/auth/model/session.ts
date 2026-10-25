import { ApiRequestError } from '@shared/api/client'
import type { AdminLoginRequest, KakaoCallbackRequest } from '@shared/api/types'

import { deleteSession, postAdminSession, postKakaoCallback } from '../api/auth'

import {
  broadcastSessionCleared,
  broadcastSessionUpdated,
  ensureFreshSession,
} from './refreshCoordinator'
import { useSessionStore, type SessionState } from './sessionStore'

// 화면(features/pages)은 DTO를 직접 import할 수 없어 여기서 다시 내보낸다.
export type { AdminLoginRequest } from '@shared/api/types'

// 위젯이 매번 네 필드를 따로 select하지 않도록 묶어 둔다.
export function useSession() {
  const sessionToken = useSessionStore((state) => state.sessionToken)
  const displayName = useSessionStore((state) => state.displayName)
  const role = useSessionStore((state) => state.role)
  const profileComplete = useSessionStore((state) => state.profileComplete)
  const isAuthReady = useSessionStore((state) => state.isAuthReady)
  const hasSession = sessionToken !== null
  return {
    // 회원 = 카카오 인증 + 추가 정보 입력까지 끝난 사용자. 카카오만 마친 사용자는
    // 세션은 있어도 회원이 아니다 — 회원 화면/헤더는 이 값만 본다. 관리자 세션도 회원이 아니다
    // (회원 API·화면을 쓰면 /me가 실패하고 빈 값이 보인다).
    isLoggedIn: hasSession && role === 'USER' && profileComplete,
    // 카카오 인증은 됐지만 추가 정보를 아직 안 낸 상태. /signup의 PUT에 세션이
    // 필요해서 세션은 살려 두되, 이 상태로 /signup 밖에 있으면 가입 취소로 본다.
    isSignupPending: hasSession && !profileComplete,
    isAuthReady,
    displayName,
    role,
    profileComplete,
  }
}

// pages/signup이 /me/profile PUT 성공 후 로컬 상태만 갱신할 때 쓴다.
export const markProfileComplete = () =>
  useSessionStore.getState().markProfileComplete()

// 세션이 있다가 없어지거나(로그아웃·가입 취소·재발급 실패·다른 탭 로그아웃) 다른 역할로 바뀔 때(회원 탭에서 관리자
// 로그인) 한 번 부른다 — 앞 사람의 캐시(예약·주문)가 다음 세션에 보이지 않게. 재발급은 역할이 같아 부르지 않는다.
// 지우는 경로가 여럿이라 각자 챙기지 않고 스토어 변화 하나로 잡는다.
export function onSessionCleared(listener: () => void) {
  const identity = () => {
    const { sessionToken, role } = useSessionStore.getState()
    return sessionToken === null ? null : String(role)
  }
  let before = identity()
  return useSessionStore.subscribe(() => {
    const now = identity()
    if (before !== null && now !== before) listener()
    before = now
  })
}

// 앱 시작 시 한 번 — 메모리에 세션이 없으면 리프레시 쿠키로 되살려 본다
// (11-frontend-guide.md §4의 트리거 (b)). refreshCoordinator를 import하는 것만으로
// shared/api/client에 인증 헤더/401 처리 훅이 등록된다.
export async function initAuth() {
  try {
    if (useSessionStore.getState().sessionToken) return
    await ensureFreshSession()
  } finally {
    // 실패(비로그인)여도 판단은 끝났다 — 로그인 필요 화면이 기다리지 않게 한다.
    useSessionStore.getState().markAuthReady()
  }
}

/**
 * 관리자 로그인. 성공하면 서버가 관리자 리프레시 쿠키를 심고 회원 쿠키를 지운다 —
 * 한 브라우저에서 회원과 관리자를 같이 쓸 수 없다.
 *
 * 응답에는 sessionToken과 role만 온다. 스토어는 회원과 같은 모양을 쓰므로 나머지를
 * 여기서 채운다 — 관리자는 표시할 이름이 없고(null), 채울 추가 정보도 없다(true).
 *
 * 열려 있는 다른 탭은 회원 쿠키가 지워진 걸 모르므로 세션 해제를 알린다.
 */
export async function loginAsAdmin(body: AdminLoginRequest) {
  const { sessionToken, role } = await postAdminSession(body)
  broadcastSessionCleared()
  useSessionStore.getState().setSession({
    sessionToken,
    role,
    displayName: null,
    profileComplete: true,
  })
}

// 503 뒤처리를 보내기까지 기다리는 시간.
const LOGOUT_CLEANUP_DELAY_MS = 3000

export async function logout() {
  // 뒤처리에 쓸 토큰을 미리 들고 있는다 — 아래에서 스토어를 비운다.
  const sessionToken = useSessionStore.getState().sessionToken

  try {
    await deleteSession()
  } catch (caught) {
    // 503은 쿠키는 지워졌지만 서버 정리가 덜 끝난 상태다. 그대로 두면 끊겼어야 할
    // 액세스 토큰이 만료까지(약 30분) 살아남아 관리자 API를 계속 부를 수 있다.
    // 명세대로 잠시 뒤 토큰을 직접 실어 한 번 더 보내 정리를 마친다 — 사용자에게는
    // 이미 로그아웃이므로 결과를 기다리지 않고, 실패해도 알리지 않는다.
    const isUnfinished =
      caught instanceof ApiRequestError && caught.status === 503
    // 그 밖의 실패는 쿠키가 남았을 수 있다 — 로컬 세션을 먼저 지우면 새로고침 때
    // 되살아난다. 호출부가 안내하도록 그대로 던진다.
    if (!isUnfinished) throw caught

    if (sessionToken) {
      setTimeout(() => {
        void deleteSession(sessionToken).catch(() => undefined)
      }, LOGOUT_CLEANUP_DELAY_MS)
    }
  }
  // 서버가 리프레시 쿠키를 지운 뒤에만 로컬 세션을 지운다.
  useSessionStore.getState().clearSession()
  // 다른 탭도 refreshCoordinator와 같은 프로토콜로 세션 해제를 알아야 한다.
  broadcastSessionCleared()
}

// 카카오 인가 코드로 로그인하고 세션을 메모리에 올린다. 호출부가 다음 화면을 고를 수 있게
// profileComplete만 돌려준다 — 토큰 등 나머지는 스토어 밖으로 나가지 않는다.
export async function loginWithKakao(
  body: KakaoCallbackRequest,
): Promise<Pick<SessionState, 'profileComplete'>> {
  const session = await postKakaoCallback(body)
  useSessionStore.getState().setSession(session)
  // 가입 진행 중 세션은 알리지 않는다 — 받은 탭은 /signup 밖이라 RootLayout이 가입 취소로
  // 보고 로그아웃시켜 버린다.
  if (session.profileComplete) broadcastSessionUpdated(session)
  return { profileComplete: session.profileComplete }
}

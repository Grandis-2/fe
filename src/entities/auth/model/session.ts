import type { KakaoCallbackRequest } from '@shared/api/types'

import { deleteSession, postKakaoCallback } from '../api/auth'

import {
  broadcastSessionCleared,
  ensureFreshSession,
} from './refreshCoordinator'
import { useSessionStore, type SessionState } from './sessionStore'

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
    // 세션은 있어도 회원이 아니다 — 회원 화면/헤더는 이 값만 본다.
    isLoggedIn: hasSession && profileComplete,
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

export async function logout() {
  try {
    await deleteSession()
  } finally {
    // 로그아웃 응답은 항상 204다 — 실패해도 로컬 상태는 반드시 지운다.
    useSessionStore.getState().clearSession()
    // 다른 탭도 refreshCoordinator와 같은 프로토콜로 세션 해제를 알아야 한다.
    broadcastSessionCleared()
  }
}

// 카카오 인가 코드로 로그인하고 세션을 메모리에 올린다. 호출부가 다음 화면을 고를 수 있게
// profileComplete만 돌려준다 — 토큰 등 나머지는 스토어 밖으로 나가지 않는다.
export async function loginWithKakao(
  body: KakaoCallbackRequest,
): Promise<Pick<SessionState, 'profileComplete'>> {
  const session = await postKakaoCallback(body)
  useSessionStore.getState().setSession(session)
  return { profileComplete: session.profileComplete }
}

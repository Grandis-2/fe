import type { KakaoCallbackRequest } from '@/shared/api/types'

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
  return {
    isLoggedIn: sessionToken !== null,
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
  if (useSessionStore.getState().sessionToken) return
  await ensureFreshSession()
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

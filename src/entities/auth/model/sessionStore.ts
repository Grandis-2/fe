import type { Session, SessionRole } from '@/shared/api/types'
import { createStore } from '@/shared/lib/createStore'

export type SessionState = {
  displayName: string | null
  role: SessionRole | null
  // 로그아웃 상태에선 의미 없는 값이라 true(게이트 안 걸림)로 둔다 — 실제 분기는
  // 항상 sessionToken과 같이 본다.
  profileComplete: boolean
}

type SessionStore = SessionState & {
  // 메모리에만 둔다 — localStorage/sessionStorage에 넣지 않는다
  // (11-frontend-guide.md §3). 새로고침하면 사라지고 재발급으로 되살린다.
  sessionToken: string | null
  setSession: (session: Session) => void
  clearSession: () => void
  // /me/profile PUT 성공 후 로컬로만 반영한다 — 그 응답엔 profileComplete 필드가
  // 없고, sessionToken도 새로 발급되지 않는다(재로그인 없음).
  markProfileComplete: () => void
}

export const useSessionStore = createStore<SessionStore>((set) => ({
  sessionToken: null,
  displayName: null,
  role: null,
  profileComplete: true,
  setSession: ({ sessionToken, displayName, role, profileComplete }) =>
    set({ sessionToken, displayName, role, profileComplete }),
  clearSession: () =>
    set({
      sessionToken: null,
      displayName: null,
      role: null,
      profileComplete: true,
    }),
  markProfileComplete: () => set({ profileComplete: true }),
}))

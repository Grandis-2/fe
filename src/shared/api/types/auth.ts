export type SessionRole = 'USER' | 'ADMIN'

// 리프레시 토큰은 본문에 없다(HttpOnly 쿠키로 온다) — 프론트가 만질 값이 아니라
// 타입에도 없다.
export type Session = {
  sessionToken: string
  displayName: string
  role: SessionRole
  // 이름·이메일·연락처(entities/profile)가 다 채워졌는지 — 로그인/재발급/세션조회
  // 세 응답에 다 실려 온다. ADMIN은 항상 true.
  profileComplete: boolean
}

export type KakaoCallbackRequest = {
  code: string
  redirectUri: string
}

// 세션 조회는 토큰을 돌려주지 않는다 — 이미 갖고 있는 값이다.
export type SessionInfo = Pick<
  Session,
  'displayName' | 'role' | 'profileComplete'
>

export type AdminLoginRequest = {
  username: string
  password: string
}

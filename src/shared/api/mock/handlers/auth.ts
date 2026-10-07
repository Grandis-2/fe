import { http } from 'msw'

import { fail, ok } from '../response'
import { url } from '../url'
import { codePointLength } from '../validate'

import type {
  AdminLoginRequest,
  ApiViolation,
  KakaoCallbackRequest,
  ProfileInfo,
  Session,
  SessionInfo,
  UpdateProfileRequest,
} from '../../types'
import type { RequestHandler } from 'msw'

// ponytail: 실제 인증 서버가 없어 메모리로 흉내낸다. 핸들러는 SW가 아니라 페이지
// 컨텍스트에서 실행되므로(MSW v2 구조) 새로고침하면 이 파일의 모듈도 다시 평가된다 —
// 그래서 DB를 localStorage에 태워 새로고침에도 살아남게 한다.
// localStorage인 이유: 이건 앱이 저장하는 값이 아니라 서버 DB 흉내다. 실제 서버의
// 리프레시 토큰 기록은 모든 탭이 공유하므로, sessionStorage(탭별)에 두면 쿠키는 있는데
// 새 탭에서 재발급이 401이 난다. 앱 쪽 저장 규칙(state는 sessionStorage, 토큰은 메모리)과는 별개.
//
// ponytail: 스키마 버전이 없다 — 예전 형식의 기록이 남아 있으면 로그아웃(또는
// localStorage의 nova-auth-mock-db 지우기)하고 새로 로그인. 반복적으로 문제되면 버전 필드 추가.
type SessionRecord = {
  displayName: string
  role: Session['role']
  profileComplete: boolean
}
type DB = {
  sessions: [string, SessionRecord][]
  refreshTokens: [string, SessionRecord][]
  usedCodes: string[]
  profile: ProfileRecord
}

const DB_KEY = 'nova-auth-mock-db'

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as DB
  } catch {
    // 파싱 실패 시 빈 DB로 시작한다.
  }
  return {
    sessions: [],
    refreshTokens: [],
    usedCodes: [],
    profile: { name: null, email: null, phoneNumber: null },
  }
}

let sessions = new Map<string, SessionRecord>()
let refreshTokens = new Map<string, SessionRecord>()
let usedCodes = new Set<string>()

const MOCK_USER: SessionRecord = {
  displayName: '기매진',
  role: 'USER',
  profileComplete: false,
}
// 로컬 개발용 관리자 계정. 실제 값이 아니다.
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin1234'
const MOCK_ADMIN: SessionRecord = {
  displayName: '관리자',
  role: 'ADMIN',
  profileComplete: true,
}

// ponytail: 로그인 목업과 마찬가지로 메모리 저장 — 실제 회원(카카오 회원번호)별로
// 갈리지 않고 전역 하나뿐이다(entities/address의 defaultAddress와 같은 이유).
type ProfileRecord = {
  name: string | null
  email: string | null
  phoneNumber: string | null
}
let profile: ProfileRecord

function syncDB() {
  const db = loadDB()
  sessions = new Map(db.sessions)
  refreshTokens = new Map(db.refreshTokens)
  usedCodes = new Set(db.usedCodes)
  profile = db.profile
}
syncDB()
// 다른 탭이 로그인·재발급으로 DB를 바꾸면 이 탭 메모리도 맞춘다 — 안 그러면 이 탭이
// 다음에 저장할 때 옛 메모리로 덮어써 다른 탭의 세션을 지운다. (storage 이벤트는 다른 탭에서만 온다.)
// ponytail: 두 탭이 같은 순간에 쓰면 나중 것이 이긴다 — 목업이라 감수.
addEventListener('storage', (event) => {
  if (event.key === DB_KEY) syncDB()
})

function saveDB() {
  const db: DB = {
    sessions: [...sessions.entries()],
    refreshTokens: [...refreshTokens.entries()],
    usedCodes: [...usedCodes],
    profile,
  }
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

const PROFILE_LIMITS: Record<keyof UpdateProfileRequest, number> = {
  name: 50,
  email: 255,
  phoneNumber: 20,
}
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const hasCompleteProfile = () =>
  Boolean(profile.name && profile.email && profile.phoneNumber)

function validateProfile(body: Partial<UpdateProfileRequest> | null) {
  const violations: ApiViolation[] = []
  const required = ['name', 'email', 'phoneNumber'] as const

  for (const field of required) {
    const value = body?.[field]
    if (!value || codePointLength(value) > PROFILE_LIMITS[field]) {
      violations.push({
        field,
        message: !value
          ? '필수 값입니다.'
          : `${PROFILE_LIMITS[field]}자 이하로 입력해 주세요.`,
      })
      continue
    }
    // 이메일만 형식을 검사한다 — 연락처는 길이만 본다(11-frontend-guide.md와 같은 계약).
    if (field === 'email' && !EMAIL_PATTERN.test(value)) {
      violations.push({ field, message: '이메일 형식이 올바르지 않습니다.' })
    }
  }
  return violations
}

const REFRESH_COOKIE: Record<Session['role'], string> = {
  USER: 'refresh_token',
  ADMIN: 'admin_refresh_token',
}

function parseCookies(header: string): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map((pair) => {
      const [key, ...rest] = pair.trim().split('=')
      return [key, rest.join('=')]
    }),
  )
}

// 서버와 같은 계약 — `Authorization: Bearer <sessionToken>`에서 토큰만 뗀다.
function readSessionToken(request: Request) {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

function issueSession(record: SessionRecord) {
  const sessionToken = `mock-session-${crypto.randomUUID()}`
  const refreshToken = `mock-refresh-${crypto.randomUUID()}`
  sessions.set(sessionToken, record)
  refreshTokens.set(refreshToken, record)
  saveDB()

  // HttpOnly는 여기 못 붙인다 — browser.ts가 이 값을 document.cookie로 심는데,
  // document.cookie로는 애초에 HttpOnly를 켤 수 없다(로컬 목업만의 한계).
  const cookie = `${REFRESH_COOKIE[record.role]}=${refreshToken}; Path=/; SameSite=Strict`

  return { sessionToken, refreshToken, cookie }
}

export const authHandlers: RequestHandler[] = [
  http.post(url('/api/v1/auth/kakao/callback'), async ({ request }) => {
    const body = (await request
      .json()
      .catch(() => null)) as Partial<KakaoCallbackRequest> | null

    if (!body?.code || !body.redirectUri) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '요청 값이 올바르지 않습니다.',
        violations: [
          !body?.code
            ? { field: 'code', message: '필수 값입니다.' }
            : { field: 'redirectUri', message: '필수 값입니다.' },
        ].filter((v): v is { field: string; message: string } => v !== null),
      })
    }

    if (usedCodes.has(body.code)) {
      return fail(400, {
        code: 'INVALID_OAUTH_CALLBACK',
        message: '이미 사용된 코드입니다. 다시 로그인해 주세요.',
      })
    }
    usedCodes.add(body.code)
    saveDB()

    // 이미 가입(프로필 입력)을 마친 회원은 다시 로그인해도 profileComplete: true다 —
    // MOCK_USER는 새로고침마다 false로 다시 만들어지는데 프로필은 localStorage DB에 남아 있어서,
    // 그대로 쓰면 가입을 마친 뒤 재로그인할 때마다 /signup으로 되돌려진다.
    const record: SessionRecord = {
      ...MOCK_USER,
      profileComplete: hasCompleteProfile(),
    }
    const { sessionToken, cookie } = issueSession(record)
    const response = ok<Session>({ sessionToken, ...record })
    response.headers.set('X-Mock-Set-Cookie', cookie)
    return response
  }),

  http.post(url('/api/v1/session/refresh'), () => {
    // 인터셉트된 Request의 headers에서는 Cookie를 읽을 수 없다(Service Worker Fetch
    // API의 의도된 제약 — SW가 쿠키를 훔쳐볼 수 없게 막는다. 실서버는 이 제약이 없다).
    // 이 핸들러는 페이지 컨텍스트에서 실행되므로 document.cookie로 직접 읽는다.
    const cookies = parseCookies(document.cookie)
    // 재발급은 회원 쿠키를 먼저 본다(11-frontend-guide.md §6).
    const refreshToken =
      cookies[REFRESH_COOKIE.USER] ?? cookies[REFRESH_COOKIE.ADMIN]
    const record = refreshToken ? refreshTokens.get(refreshToken) : undefined

    if (!record) {
      return fail(401, {
        code: 'UNAUTHENTICATED',
        message: '로그인이 필요합니다.',
      })
    }

    refreshTokens.delete(refreshToken)
    const { sessionToken, cookie } = issueSession(record)
    const response = ok<Session>({ sessionToken, ...record })
    response.headers.set('X-Mock-Set-Cookie', cookie)
    return response
  }),

  http.get(url('/api/v1/session'), ({ request }) => {
    const token = readSessionToken(request)
    const record = token ? sessions.get(token) : undefined
    if (!record) {
      return fail(401, {
        code: 'UNAUTHENTICATED',
        message: '로그인이 필요합니다.',
      })
    }
    return ok<SessionInfo>(record)
  }),

  http.delete(url('/api/v1/session'), ({ request }) => {
    const token = readSessionToken(request)
    const record = token ? sessions.get(token) : undefined
    if (token) sessions.delete(token)
    saveDB()

    const cookieName = REFRESH_COOKIE[record?.role ?? 'USER']
    const response = new Response(null, { status: 204 })
    response.headers.set(
      'X-Mock-Set-Cookie',
      `${cookieName}=; Path=/; SameSite=Strict; Max-Age=0`,
    )
    return response
  }),

  http.post(url('/api/v1/admin/session'), async ({ request }) => {
    const body = (await request
      .json()
      .catch(() => null)) as Partial<AdminLoginRequest> | null

    if (body?.username !== ADMIN_USERNAME || body.password !== ADMIN_PASSWORD) {
      return fail(401, {
        code: 'INVALID_CREDENTIALS',
        message: '아이디 또는 비밀번호가 올바르지 않습니다.',
      })
    }

    const { sessionToken, cookie } = issueSession(MOCK_ADMIN)
    const response = ok<Session>({ sessionToken, ...MOCK_ADMIN })
    response.headers.set('X-Mock-Set-Cookie', cookie)
    return response
  }),

  http.get(url('/api/v1/me/profile'), ({ request }) => {
    const token = readSessionToken(request)
    const record = token ? sessions.get(token) : undefined
    if (!record) {
      return fail(401, {
        code: 'UNAUTHENTICATED',
        message: '로그인이 필요합니다.',
      })
    }
    return ok<ProfileInfo>({ displayName: record.displayName, ...profile })
  }),

  http.put(url('/api/v1/me/profile'), async ({ request }) => {
    const token = readSessionToken(request)
    const record = token ? sessions.get(token) : undefined
    if (!record) {
      return fail(401, {
        code: 'UNAUTHENTICATED',
        message: '로그인이 필요합니다.',
      })
    }

    const body = (await request
      .json()
      .catch(() => null)) as Partial<UpdateProfileRequest> | null

    const violations = validateProfile(body)
    if (violations.length > 0) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '요청 값이 올바르지 않습니다.',
        violations,
      })
    }

    profile = {
      name: body!.name!,
      email: body!.email!,
      phoneNumber: body!.phoneNumber!,
    }
    // 세 칸이 다 채워졌으니 이 회원은 이제 profileComplete: true다. 저장소에서 다시 읽은
    // 두 맵은 같은 객체를 공유하지 않으므로 양쪽을 다 고친다 — 안 그러면 새 탭의 재발급이
    // false를 돌려줘 가입 화면으로 되돌아간다. 프로필이 전역 하나라 USER 기록은 모두 같은 회원이다.
    for (const r of [...sessions.values(), ...refreshTokens.values()]) {
      if (r.role === 'USER') r.profileComplete = true
    }
    saveDB()

    return ok<ProfileInfo>({ displayName: record.displayName, ...profile })
  }),
]

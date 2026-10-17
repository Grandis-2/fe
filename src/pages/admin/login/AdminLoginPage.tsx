import { Navigate, useNavigate, useSearchParams } from 'react-router'

import { useSession } from '@entities/auth'
import { AdminLoginForm } from '@features/login'
import { ADMIN_HOME_PATH } from '@shared/config/routes'

import * as styles from './AdminLoginPage.css'

// 헤더(로고)만 있고 사이드바는 없다 — 로그인 전에는 메뉴도 알림도 누를 수 없고, 누를 수
// 없는 것을 보여 주면 막힌 화면으로 읽힌다. 헤더의 알림·로그아웃은 Header가 숨긴다.

// 돌아갈 곳이 관리자 화면인지 확인한다 — next에 아무 경로나 넣어 보낼 수 있다.
const safeNext = (next: string | null) =>
  next?.startsWith('/admin') && !next.startsWith('//') ? next : ADMIN_HOME_PATH

export function AdminLoginPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthReady, role } = useSession()
  const next = safeNext(params.get('next'))
  // next는 RequireAdmin이 튕길 때만 붙는다 — 이 화면에 직접 들어온 사람에게도
  // 띄우면 로그인하러 왔을 뿐인데 거부당한 것처럼 읽힌다.
  const redirected = params.get('next') !== null

  // 이미 관리자면 로그인 화면을 보여줄 이유가 없다.
  if (isAuthReady && role === 'ADMIN') return <Navigate to={next} replace />

  return (
    <div className={styles.root}>
      <AdminLoginForm
        notice={
          redirected && role === 'USER'
            ? '관리자 계정으로 로그인해 주세요.'
            : undefined
        }
        onLoggedIn={() => navigate(next, { replace: true })}
      />
    </div>
  )
}

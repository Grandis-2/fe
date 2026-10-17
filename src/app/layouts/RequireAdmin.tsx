import { Navigate, Outlet, useLocation } from 'react-router'

import { useSession } from '@entities/auth'
import { ADMIN_LOGIN_PATH } from '@shared/config/routes'

/**
 * 관리자 라우트를 감싸는 레이아웃. 관리자 토큰이 없으면 관리자 API가 전부 403이라,
 * 사이드바를 포함한 관리자 화면 자체를 그리지 않고 로그인 화면으로 보낸다 —
 * 빈 표만 보여주면 조회 실패와 구분이 안 된다.
 *
 * 회원 모달(RequireLogin)과 달리 전용 페이지로 보낸다. 로그인 전에는 관리자 화면에
 * 볼 것이 없어서 뒤에 깔 화면이 없다.
 */
export function RequireAdmin() {
  const { isAuthReady, role } = useSession()
  const { pathname, search } = useLocation()

  // 새로고침 직후엔 리프레시 쿠키로 세션을 되살리는 중이다 — 그 사이에 그리면
  // 로그인한 관리자에게도 로그인 화면이 깜빡인다.
  if (!isAuthReady) return null

  if (role !== 'ADMIN') {
    return (
      <Navigate
        to={`${ADMIN_LOGIN_PATH}?next=${encodeURIComponent(`${pathname}${search}`)}`}
        replace
      />
    )
  }

  return <Outlet />
}

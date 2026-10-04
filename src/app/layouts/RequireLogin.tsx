import { useEffect } from 'react'

import { Outlet, useLocation, useNavigate } from 'react-router'

import { useSession } from '@entities/auth'
import { KakaoLoginModal } from '@features/login'
import { HOME_PATH } from '@shared/config/routes'
import { useModalStore } from '@shared/model/modalStore'

// 로그인 필요 라우트를 감싸는 레이아웃. 비회원이 주소로 직접 들어오면 홈으로 보내고
// 로그인 모달을 띄운다 — 로그인하면 원래 가려던 경로로 돌아온다.
export function RequireLogin() {
  const { isLoggedIn, isAuthReady } = useSession()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const openModal = useModalStore((state) => state.open)
  const isBlocked = isAuthReady && !isLoggedIn

  useEffect(() => {
    if (!isBlocked) return
    openModal(<KakaoLoginModal returnTo={`${pathname}${search}`} />)
    navigate(HOME_PATH, { replace: true })
  }, [isBlocked, pathname, search, navigate, openModal])

  // 새로고침 직후 세션 복구 중엔 아무것도 그리지 않는다 — 회원이 잠깐 튕기지 않게.
  if (!isAuthReady || !isLoggedIn) return null
  return <Outlet />
}

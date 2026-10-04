import { useEffect } from 'react'

import { Outlet, useLocation } from 'react-router'

import { logout, useSession } from '@entities/auth'
import { KAKAO_CALLBACK_PATH } from '@features/login'
import { SIGNUP_PATH } from '@shared/config/routes'
import { useModalStore } from '@shared/model/modalStore'
import { useToastStore } from '@shared/model/toastStore'
import { Modal, ToastViewport } from '@shared/ui'
import { Header } from '@widgets/header'
import { MobileTabBar } from '@widgets/mobile-tab-bar'

export function RootLayout() {
  const { isLoggedIn, isSignupPending } = useSession()
  const isModalOpen = useModalStore((state) => state.isOpen)
  const modalContent = useModalStore((state) => state.content)
  const closeModal = useModalStore((state) => state.close)
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismiss)
  const location = useLocation()

  // react-router는 페이지 이동 시 스크롤 위치를 유지한다 — 목록 스크롤 후 상세로
  // 들어가면 새 페이지가 그 위치에서 시작해 버리므로 경로가 바뀔 때마다 맨 위로 올린다.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // 가입 진행 중(카카오만 마침)인 사용자가 /signup을 벗어나면 가입 취소로 보고 세션을
  // 지운다 — 링크 이동이든 주소창 이동(새로고침 → 재발급으로 세션이 되살아남)이든 여기
  // 한 곳에서 잡는다. 다시 로그인하면 카카오 콜백이 /signup으로 보낸다.
  // role 체크는 따로 안 한다 — ADMIN의 profileComplete는 계약상 항상 true다.
  //
  // location(useLocation의 값)이 아니라 window.location을 읽는다 — 카카오 콜백 페이지가
  // 세션을 넣고 /signup으로 navigate하는 사이에 이 effect가 콜백 경로 스냅샷으로 예약될
  // 수 있다. 실행 시점의 실제 위치를 다시 읽고, 콜백 경로도 제외해 그 틈에 갓 받은
  // 세션을 지우지 않게 한다.
  useEffect(() => {
    if (!isSignupPending) return
    const { pathname } = window.location
    if (pathname === SIGNUP_PATH || pathname === KAKAO_CALLBACK_PATH) return
    void logout()
  }, [isSignupPending, location])

  return (
    <>
      <Header isMember={isLoggedIn} />
      <Outlet />
      <MobileTabBar />
      <Modal open={isModalOpen} onClose={closeModal}>
        {modalContent}
      </Modal>
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

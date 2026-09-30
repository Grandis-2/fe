import { useEffect } from 'react'

import { Outlet, useLocation, useNavigate } from 'react-router'

import { useSession } from '@/entities/auth'
import { SIGNUP_PATH } from '@/shared/config/routes'
import { useModalStore } from '@/shared/model/modalStore'
import { Modal } from '@/shared/ui'
import { Header } from '@/widgets/header'
import { MobileTabBar } from '@/widgets/mobile-tab-bar'

export function RootLayout() {
  const { isLoggedIn, profileComplete } = useSession()
  const isModalOpen = useModalStore((state) => state.isOpen)
  const modalContent = useModalStore((state) => state.content)
  const closeModal = useModalStore((state) => state.close)
  const location = useLocation()
  const navigate = useNavigate()

  // react-router는 페이지 이동 시 스크롤 위치를 유지한다 — 목록 스크롤 후 상세로
  // 들어가면 새 페이지가 그 위치에서 시작해 버리므로 경로가 바뀔 때마다 맨 위로 올린다.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // profileComplete는 로그인/재발급/세션조회 세 경로 어디로 채워지든 여기 한 곳에서만
  // 본다 — 경로별로 나눠 검사하면 새로고침(재발급) 경로로 돌아온 사용자가 이 검사를
  // 건너뛴다. role 체크는 따로 안 한다 — ADMIN의 profileComplete는 계약상 항상 true다.
  //
  // location(useLocation의 값)이 아니라 window.location을 읽는다 — 세션 스토어 갱신과
  // 카카오 콜백 페이지 자신의 navigate가 같은 틱에 연달아 일어나면 이 effect가 그 사이의
  // 스냅샷(아직 콜백 경로인 location)으로 한 번 더 예약될 수 있다. 그 stale한 예약이
  // 나중에 실행되더라도 그때 브라우저의 실제 위치는 이미 최종 목적지로 옮겨져 있으므로,
  // window.location을 그 시점에 다시 읽으면 잘못된 from으로 덮어쓰는 일이 없다.
  useEffect(() => {
    if (!isLoggedIn || profileComplete) return
    const { pathname, search } = window.location
    if (pathname === SIGNUP_PATH) return
    navigate(SIGNUP_PATH, {
      replace: true,
      state: { from: `${pathname}${search}` },
    })
  }, [isLoggedIn, profileComplete, location, navigate])

  return (
    <>
      <Header isMember={isLoggedIn} />
      <Outlet />
      <MobileTabBar />
      <Modal open={isModalOpen} onClose={closeModal}>
        {modalContent}
      </Modal>
    </>
  )
}

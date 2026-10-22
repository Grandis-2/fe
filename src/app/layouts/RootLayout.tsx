import { lazy, Suspense, useEffect } from 'react'

import { Outlet, useLocation, useNavigate } from 'react-router'

import { logout, useSession } from '@entities/auth'
import { KAKAO_CALLBACK_PATH } from '@features/login'
import { PreorderQueue, usePreorderQueueStore } from '@features/preorder-queue'
import { isMockEnabled } from '@shared/api/mock'
import { ADMIN_LOGIN_PATH, SIGNUP_PATH } from '@shared/config/routes'
import { useModalStore } from '@shared/model/modalStore'
import { showToast, useToastStore } from '@shared/model/toastStore'
import { Modal, ToastViewport } from '@shared/ui'
import { Header } from '@widgets/header'
import { MobileTabBar } from '@widgets/mobile-tab-bar'

import { isCallbackPath } from './callbackPaths'

// 개발 도구라 켜지는 환경에서만 따로 받는다 — 바로 import하면 조건과 상관없이 운영 첫 번들에 실린다.
// 요청 기록은 requestLog가 모으므로 늦게 마운트돼도 빠지는 요청이 없다.
const RequestMonitor = lazy(() =>
  import('@widgets/request-monitor').then((m) => ({
    default: m.RequestMonitor,
  })),
)

// 운영에서도 주소에 ?monitor=1을 붙이면 켜진다(?monitor=0이면 끈다). 한 번 켜면 이 브라우저에서는 계속 보인다.
const MONITOR_KEY = 'request-monitor-enabled'
const isMonitorEnabled = (() => {
  if (import.meta.env.DEV || isMockEnabled) return true
  try {
    const param = new URLSearchParams(window.location.search).get('monitor')
    if (param === '1') localStorage.setItem(MONITOR_KEY, 'true')
    if (param === '0') localStorage.removeItem(MONITOR_KEY)
    return localStorage.getItem(MONITOR_KEY) === 'true'
  } catch {
    return false
  }
})()

export function RootLayout() {
  const { isSignupPending } = useSession()
  const isModalOpen = useModalStore((state) => state.isOpen)
  const modalContent = useModalStore((state) => state.content)
  const modalOpenCount = useModalStore((state) => state.openCount)
  const closeModal = useModalStore((state) => state.close)
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismiss)
  const queueTicket = usePreorderQueueStore((state) => state.ticket)
  const clearQueue = usePreorderQueueStore((state) => state.clear)
  const admitQueue = usePreorderQueueStore((state) => state.admit)
  const location = useLocation()
  const navigate = useNavigate()
  const isCallbackPage = isCallbackPath(location.pathname)
  // 관리자 로그인은 화면을 둘로 나눠 왼쪽 장면에 로고를 둔다 — 헤더를 그리지 않는다.
  const isAdminLogin = location.pathname === ADMIN_LOGIN_PATH

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
      {!isCallbackPage && !isAdminLogin && <Header />}
      <Outlet />
      {!isCallbackPage && <MobileTabBar />}
      {modalContent && (
        <Modal
          key={modalOpenCount}
          {...modalContent}
          open={isModalOpen}
          onClose={closeModal}
        />
      )}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      {/* 백오프·재전송이 실제로 일어나는 걸 보여 주는 창 — 결제 콜백에서도 보여야 해서 경로와 상관없이 그린다.
          개발 도구라 로컬·목 배포에선 늘 띄우고, 실서버에 붙은 운영 화면에선 ?monitor=1로 켰을 때만 띄운다. */}
      {isMonitorEnabled && (
        <Suspense fallback={null}>
          <RequestMonitor />
        </Suspense>
      )}
      {queueTicket && (
        <PreorderQueue
          key={queueTicket.joinedAt}
          productId={queueTicket.productId}
          productName={queueTicket.productName}
          onComplete={(admission) => {
            admitQueue(admission)
            clearQueue()
            navigate(queueTicket.to)
          }}
          onFail={(message) => {
            clearQueue()
            showToast(message)
          }}
          onLeave={clearQueue}
        />
      )}
    </>
  )
}

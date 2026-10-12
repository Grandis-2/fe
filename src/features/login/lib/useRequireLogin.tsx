import { useSession } from '@entities/auth'

import { openLoginModal } from './openLoginModal'

// 회원만 할 수 있는 행동(사전예약·결제 등)을 감싼다 — 비회원이면 행동 대신 로그인 모달을 연다.
// 로그인하면 모달을 연 지금 화면으로 돌아오므로 같은 버튼을 다시 누르면 된다.
export function useRequireLogin() {
  const { isLoggedIn } = useSession()

  return (action: () => void) => {
    if (isLoggedIn) action()
    else openLoginModal()
  }
}

import { useSession } from '@entities/auth'
import { useModalStore } from '@shared/model/modalStore'

import { KakaoLoginModal } from '../ui/KakaoLoginModal/KakaoLoginModal'

// 회원만 할 수 있는 행동(사전예약·결제 등)을 감싼다 — 비회원이면 행동 대신 로그인 모달을 연다.
// 로그인하면 모달을 연 지금 화면으로 돌아오므로 같은 버튼을 다시 누르면 된다.
export function useRequireLogin() {
  const { isLoggedIn } = useSession()
  const openModal = useModalStore((state) => state.open)

  return (action: () => void) => {
    if (isLoggedIn) action()
    else openModal(<KakaoLoginModal />)
  }
}

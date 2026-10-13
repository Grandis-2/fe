import { openModal } from '@shared/model/modalStore'

import { KakaoLoginModal } from '../ui/KakaoLoginModal/KakaoLoginModal'

// 로그인 모달을 여는 곳이 여러 군데라(헤더·탭바·로그인 필요 라우트·회원 전용 버튼)
// 제목·문구를 한 곳에 둔다.
export const openLoginModal = (returnTo?: string) =>
  openModal({
    title: '로그인',
    description: '카카오 계정으로 간편하게 시작하세요',
    children: <KakaoLoginModal returnTo={returnTo} />,
  })

import { useKakaoCallback } from '@features/login'

export function KakaoCallbackPage() {
  const { status, message } = useKakaoCallback()

  return (
    <div>
      {status === 'processing' ? '카카오 로그인 처리 중입니다…' : message}
    </div>
  )
}

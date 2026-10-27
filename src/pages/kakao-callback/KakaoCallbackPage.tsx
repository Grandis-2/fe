import { useKakaoCallback } from '@features/login'
import { Container, InlineAlert, LoadingScreen } from '@shared/ui'

export function KakaoCallbackPage() {
  const { status, message } = useKakaoCallback()

  if (status === 'processing')
    return <LoadingScreen>카카오 로그인 처리 중이에요</LoadingScreen>

  return (
    <Container>
      <InlineAlert status="error" variant="big">
        {message}
      </InlineAlert>
    </Container>
  )
}

import { LoaderCircle } from 'lucide-react'

import { useKakaoCallback } from '@features/login'
import { Container, InlineAlert } from '@shared/ui'

export function KakaoCallbackPage() {
  const { status, message } = useKakaoCallback()

  return (
    <Container>
      {status === 'processing' ? (
        <InlineAlert status="info" variant="big" icon={LoaderCircle}>
          카카오 로그인 처리 중이에요
        </InlineAlert>
      ) : (
        <InlineAlert status="error" variant="big">
          {message}
        </InlineAlert>
      )}
    </Container>
  )
}

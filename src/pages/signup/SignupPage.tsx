import { useState } from 'react'

import { Navigate, useLocation, useNavigate } from 'react-router'

import { markProfileComplete, useSession } from '@entities/auth'
import { useProfile, useUpdateProfile } from '@entities/profile'
import { getErrorMessage } from '@shared/api/client'
import { HOME_PATH } from '@shared/config/routes'
import { useFormFields } from '@shared/lib/useFormFields'
import { Button, Container, InlineAlert, Input } from '@shared/ui'

import * as styles from './SignupPage.css'

const GENERIC_ERROR = '처리 중 문제가 발생했습니다. 다시 시도해 주세요.'

// 세 칸 모두 가입을 막는 필수 입력이다.
const REQUIRED_KEYS = ['name', 'email', 'phoneNumber'] as const

export function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthReady, isSignupPending } = useSession()
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile } = useUpdateProfile()
  const [error, setError] = useState<string | null>(null)

  // 이전에 일부만 채우고 이탈한 사용자를 위해 기존 값을 기본값으로 깐다 — 실패해도
  // 빈 폼으로 계속 진행(가입 직후엔 애초에 다 null이라 실패가 아니다).
  const form = useFormFields(
    {
      name: profile?.name ?? '',
      email: profile?.email ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
    },
    REQUIRED_KEYS,
  )
  const { field } = form

  const handleSubmit = async () => {
    form.markSubmitted()
    setError(null)
    if (!form.requiredFilled) return

    try {
      const saved = await updateProfile(form.values)
      // PUT 응답엔 profileComplete 필드가 없다 — 실제로 세 칸이 다 채워져 왔는지
      // 보고서만 로컬로 반영한다(성공 200만 보고 믿지 않는다).
      if (saved.name && saved.email && saved.phoneNumber) {
        markProfileComplete()
      }
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from, { replace: true })
    } catch (caught) {
      setError(getErrorMessage(caught, GENERIC_ERROR))
    }
  }

  // 가입 진행 중(카카오만 마침)인 사용자만 이 화면을 쓴다 — 비회원은 PUT할 세션이
  // 없고, 회원은 이미 가입을 마쳤다.
  if (isAuthReady && !isSignupPending) {
    return <Navigate to={HOME_PATH} replace />
  }

  return (
    <Container>
      <div className={styles.root}>
        <div className={styles.title}>회원가입</div>
        <div className={styles.description}>
          서비스 이용을 위해 추가 정보를 입력해 주세요.
        </div>

        {error && <InlineAlert status="error">{error}</InlineAlert>}

        <div className={styles.form}>
          <Input {...field('name', '이름')} />
          <Input {...field('email', '이메일')} inputMode="email" />
          <Input
            {...field('phoneNumber', "휴대폰 ('-'을 제외한 숫자만)")}
            inputMode="numeric"
          />
        </div>

        <Button className={styles.submit} onClick={() => void handleSubmit()}>
          완료
        </Button>
      </div>
    </Container>
  )
}

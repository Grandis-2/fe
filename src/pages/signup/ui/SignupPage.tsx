import { useState, type ChangeEvent } from 'react'

import { useLocation, useNavigate } from 'react-router'

import { markProfileComplete } from '@/entities/auth'
import { useProfile, useUpdateProfile } from '@/entities/profile'
import { getErrorMessage } from '@/shared/api/client'
import { Button, Container, InlineAlert, Input } from '@/shared/ui'

import * as styles from './SignupPage.css'

const GENERIC_ERROR = '처리 중 문제가 발생했습니다. 다시 시도해 주세요.'

const initialForm = { name: '', email: '', phoneNumber: '' }
type FormKey = keyof typeof initialForm

export function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile } = useUpdateProfile()
  const [edits, setEdits] = useState<Partial<typeof initialForm>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 이전에 일부만 채우고 이탈한 사용자를 위해 기존 값을 기본값으로 깐다 — 실패해도
  // 빈 폼으로 계속 진행(가입 직후엔 애초에 다 null이라 실패가 아니다). 사용자가 고친
  // 칸(edits)이 항상 우선한다.
  const form = {
    name: profile?.name ?? '',
    email: profile?.email ?? '',
    phoneNumber: profile?.phoneNumber ?? '',
    ...edits,
  }

  const requiredFilled = (Object.keys(initialForm) as FormKey[]).every((key) =>
    form[key].trim(),
  )

  const field = (
    key: FormKey,
    label: string,
    inputMode?: 'email' | 'numeric',
  ) => ({
    label,
    value: form[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setEdits((prev) => ({ ...prev, [key]: event.target.value })),
    required: true,
    invalid: submitted && !form[key].trim(),
    inputMode,
  })

  const handleSubmit = async () => {
    setSubmitted(true)
    setError(null)
    if (!requiredFilled) return

    try {
      const saved = await updateProfile(form)
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

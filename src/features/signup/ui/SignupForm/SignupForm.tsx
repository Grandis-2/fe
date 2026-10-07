import { useState, type FormEvent } from 'react'

import { markProfileComplete } from '@entities/auth'
import { useProfile, useUpdateProfile } from '@entities/profile'
import { ApiRequestError } from '@shared/api/client'
import { useFormFields } from '@shared/lib/useFormFields'
import { ActionButton } from '@shared/ui'

import * as styles from './SignupForm.css'

type FieldKey = 'name' | 'email' | 'phoneNumber'

// 세 칸 모두 가입을 막는 필수 입력이다.
const REQUIRED_KEYS: readonly FieldKey[] = ['name', 'email', 'phoneNumber']

const FIELDS: {
  key: FieldKey
  label: string
  name: string
  placeholder: string
  type: 'text' | 'email' | 'tel'
  autoComplete: string
  /** 서버 길이 제한(PROFILE_LIMITS)과 같게 — 휴대폰은 숫자만 11자로 직접 자른다. */
  maxLength?: number
}[] = [
  {
    key: 'name',
    label: 'NAME',
    name: '이름',
    placeholder: '이름',
    type: 'text',
    autoComplete: 'name',
    maxLength: 50,
  },
  {
    key: 'email',
    label: 'EMAIL',
    name: '이메일',
    placeholder: '이메일',
    type: 'email',
    autoComplete: 'email',
    maxLength: 255,
  },
  {
    key: 'phoneNumber',
    label: 'PHONE',
    name: '휴대폰 번호',
    placeholder: "'-'을 제외한 숫자만",
    type: 'tel',
    autoComplete: 'tel',
  },
]

// 칸 순서대로 첫 오류부터 보여준다.
function getErrors({ name, email, phoneNumber }: Record<FieldKey, string>) {
  const errors: [FieldKey, string][] = []
  if (!name.trim()) errors.push(['name', '이름을 입력해 주세요.'])
  if (!email.trim()) errors.push(['email', '이메일을 입력해 주세요.'])
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push(['email', '올바른 이메일 형식이 아닙니다.'])
  if (!phoneNumber) errors.push(['phoneNumber', '휴대폰 번호를 입력해 주세요.'])
  else if (!/^01\d{8,9}$/.test(phoneNumber))
    errors.push(['phoneNumber', '올바른 휴대폰 번호가 아닙니다.'])
  return errors
}

const isFieldKey = (field: string): field is FieldKey =>
  (REQUIRED_KEYS as readonly string[]).includes(field)

// 서버가 칸을 짚어 거절한 오류. 그 칸을 고치면(제출 때 값과 달라지면) 사라진다.
type ServerFieldError = { key: FieldKey; message: string; value: string }

export type SignupFormProps = {
  /** 저장이 끝나면 저장된 이름으로 불린다. */
  onComplete: (name: string) => void
  /** 입력값 오류가 아닌 저장 실패(네트워크·서버 오류)면 불린다 — 페이지가 실패 화면으로
   *  바꾸고, 다시 시도하면 입력값 그대로 돌아온다. */
  onFail: () => void
}

// 카카오 로그인 직후 이름·이메일·휴대폰을 받아 프로필을 채운다. 입력칸은 이 화면 전용
// 디자인(유리 카드 한 장에 세 줄)이라 공용 Input을 쓰지 않는다.
export function SignupForm({ onComplete, onFail }: SignupFormProps) {
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile()
  // 이전에 일부만 채우고 이탈한 사용자를 위해 기존 값을 기본값으로 깐다 — 실패해도
  // 빈 폼으로 계속 진행(가입 직후엔 애초에 다 null이라 실패가 아니다).
  const { values, setValues } = useFormFields(
    {
      name: profile?.name ?? '',
      email: profile?.email ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
    },
    REQUIRED_KEYS,
  )
  const [focused, setFocused] = useState<FieldKey | null>(null)
  // 제출을 시도했을 때 틀렸던 칸 — 고치면 그 칸의 빨간 표시가 바로 사라진다.
  const [flagged, setFlagged] = useState<FieldKey[]>([])
  const [serverErrors, setServerErrors] = useState<ServerFieldError[]>([])

  const clientErrors = getErrors(values).filter(([key]) =>
    flagged.includes(key),
  )
  const stillServerErrors = serverErrors
    .filter(({ key, value }) => values[key] === value)
    .map(({ key, message }): [FieldKey, string] => [key, message])
  // 칸 순서대로 — 앞 칸의 오류 문구가 먼저 보인다.
  const shownErrors = [...clientErrors, ...stillServerErrors].sort(
    ([a], [b]) => REQUIRED_KEYS.indexOf(a) - REQUIRED_KEYS.indexOf(b),
  )
  const isInvalid = (key: FieldKey) => shownErrors.some(([k]) => k === key)
  const message = shownErrors[0]?.[1] ?? null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = getErrors(values)
    setFlagged(errors.map(([key]) => key))
    setServerErrors([])
    if (errors.length > 0) return

    try {
      const saved = await updateProfile(values)
      // 완료 처리보다 먼저 알린다 — 완료가 먼저 반영되면 페이지가 "가입 진행 중이 아님"으로 보고
      // 환영 화면을 띄우기 전에 홈으로 돌려보낸다.
      onComplete(saved.name ?? values.name)
      // PUT 응답엔 profileComplete 필드가 없다 — 실제로 세 칸이 다 채워져 왔는지
      // 보고서만 로컬로 반영한다(성공 200만 보고 믿지 않는다).
      if (saved.name && saved.email && saved.phoneNumber) {
        markProfileComplete()
      }
    } catch (caught) {
      // 입력값 오류(칸 정보 포함)는 폼에서 그 칸을 짚어 보여주고, 그 밖의 실패만 실패 화면으로 보낸다.
      const violations =
        caught instanceof ApiRequestError &&
        caught.error.code === 'VALIDATION_FAILED'
          ? (caught.error.details?.violations ?? [])
          : []
      const fieldErrors = violations.flatMap(({ field, message }) =>
        isFieldKey(field)
          ? [{ key: field, message, value: values[field] }]
          : [],
      )
      if (fieldErrors.length === 0) onFail()
      else setServerErrors(fieldErrors)
    }
  }

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className={styles.eyebrow}>SIGN UP</div>
      <h1 className={styles.title}>회원가입</h1>
      <div className={styles.description}>
        서비스 이용을 위해 추가 정보를 입력해주세요.
        <br />
        최초 1회 설정 후 바로 이용하실 수 있습니다.
      </div>

      <div className={styles.cardBorder}>
        <div className={styles.card}>
          {FIELDS.map(
            ({
              key,
              label,
              name,
              placeholder,
              type,
              autoComplete,
              maxLength,
            }) => (
              <label
                key={key}
                className={[styles.row, focused === key && styles.rowFocused]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span
                  className={
                    styles.label[
                      isInvalid(key)
                        ? 'invalid'
                        : focused === key
                          ? 'focused'
                          : 'idle'
                    ]
                  }
                >
                  {label} *
                </span>
                <input
                  className={styles.input}
                  type={type}
                  inputMode={key === 'phoneNumber' ? 'numeric' : undefined}
                  autoComplete={autoComplete}
                  maxLength={maxLength}
                  placeholder={placeholder}
                  aria-label={name}
                  aria-required
                  aria-invalid={isInvalid(key)}
                  value={values[key]}
                  // maxLength를 걸면 '-'까지 세어 붙여넣은 번호가 잘린다 — 숫자만 남긴 뒤 11자로 자른다.
                  onChange={(event) => {
                    const { value } = event.target
                    setValues({
                      [key]:
                        key === 'phoneNumber'
                          ? value.replace(/\D/g, '').slice(0, 11)
                          : value,
                    })
                  }}
                  onFocus={() => setFocused(key)}
                  onBlur={() => setFocused(null)}
                />
              </label>
            ),
          )}
        </div>
      </div>
      {message && (
        <div className={styles.error} role="alert">
          {message}
        </div>
      )}

      <ActionButton
        type="submit"
        fullWidth
        className={styles.submit}
        disabled={isPending}
      >
        가입 완료
      </ActionButton>
    </form>
  )
}

import { useState, type ChangeEvent } from 'react'

// 폼 칸들의 "기본값 + 사용자가 고친 칸" 상태와, <Input {...field(key, label)} />로 펼쳐 쓸
// props를 만든다. 서버에서 받은 값(프로필·배송지)을 defaults로 넘기면 응답이 늦게 와도
// 입력 중인 값을 덮어쓰지 않는다.
//
// requiredKeys는 한 곳에서만 적는다 — 칸마다 required를 따로 넘기면 "결제를 막는 칸"과
// 화면의 별표가 어긋난다.
export function useFormFields<T extends Record<string, string>>(
  defaults: T,
  requiredKeys: readonly (keyof T & string)[],
) {
  const [edits, setEdits] = useState<Partial<T>>({})
  const [submitted, setSubmitted] = useState(false)

  const values: T = { ...defaults, ...edits }
  const setValues = (partial: Partial<T>) =>
    setEdits((prev) => ({ ...prev, ...partial }))

  // 필수 입력은 제출을 한 번 시도한 뒤에만 빨갛게 표시한다 — 처음부터 빨간 화면을 보여주지
  // 않는다. 라벨 뒤 별표와 에러 문구는 Input이 required/invalid를 보고 스스로 만든다.
  const field = (key: keyof T & string, label: string) => ({
    label,
    value: values[key],
    required: requiredKeys.includes(key),
    invalid: submitted && !values[key].trim(),
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setValues({ [key]: event.target.value } as Partial<T>),
  })

  return {
    values,
    setValues,
    field,
    requiredFilled: requiredKeys.every((key) => values[key].trim()),
    markSubmitted: () => setSubmitted(true),
    // 사용자가 고친 칸과 제출 표시를 비우고 기본값으로 되돌린다.
    reset: () => {
      setEdits({})
      setSubmitted(false)
    },
  }
}

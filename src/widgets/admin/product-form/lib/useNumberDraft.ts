import { useState } from 'react'

import { formatNumber } from '@shared/lib/formatNumber'

/**
 * 숫자 입력칸의 "입력 중 문자열"을 관리한다.
 * type="number"는 화살표가 붙고 값을 다 지우면 0으로 되돌아가므로,
 * text 입력에 숫자만 남기는 방식으로 대신한다.
 * 칸에는 천 단위 콤마를 넣어 보여 주고, 밖으로는 콤마 없는 숫자만 넘긴다.
 */
export function useNumberDraft(
  value: number,
  onChange: (value: number) => void,
) {
  const toDraft = (next: number) => (next === 0 ? '' : formatNumber(next))

  const [draft, setDraft] = useState(() => toDraft(value))
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(toDraft(value))
  }

  const handleInput = (raw: string) => {
    // 숫자 외 문자(콤마 포함)는 버리고, 다 지우면 빈 칸으로 둔 채 0으로 취급한다.
    // 15자리까지만 받는다 — 넘으면 Number가 정밀도를 잃어 칸에 보이는 값이 바뀐다.
    const digits = raw.replace(/\D/g, '').slice(0, 15)
    const next = Number(digits) || 0
    setDraft(digits === '' ? '' : formatNumber(next))
    setLastValue(next)
    onChange(next)
  }

  return { draft, handleInput }
}

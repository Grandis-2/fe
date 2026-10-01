import { useId } from 'react'

import { useNumberDraft } from '../../model/useNumberDraft'

import * as styles from './ExtraPriceField.css'

export type ExtraPriceFieldProps = {
  value: number
  onChange: (value: number) => void
  /** 스크린리더용 이름 */
  label: string
}

/**
 * 기본 가격에 더할 금액. 앞에 `+`, 뒤에 `₩`가 붙는 형태라
 * 라벨이 안쪽에 뜨는 Input 대신 따로 만든다.
 */
export function ExtraPriceField({
  value,
  onChange,
  label,
}: ExtraPriceFieldProps) {
  const { draft, handleInput } = useNumberDraft(value, onChange)
  const inputId = useId()

  return (
    <div className={styles.root}>
      <span className={styles.affix} aria-hidden="true">
        +
      </span>
      <input
        id={inputId}
        className={styles.input}
        type="text"
        inputMode="numeric"
        aria-label={label}
        placeholder="0"
        value={draft}
        onChange={(event) => handleInput(event.target.value)}
      />
      <span className={styles.affix} aria-hidden="true">
        ₩
      </span>
    </div>
  )
}

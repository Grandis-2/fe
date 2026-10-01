import { useId, type InputHTMLAttributes } from 'react'

import { AlertCircle } from 'lucide-react'

import * as styles from './Input.css'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  size?: 'medium' | 'small'
  required?: boolean
  invalid?: boolean
}

export function Input({
  label,
  size = 'medium',
  required,
  invalid,
  className,
  placeholder,
  id,
  ...rest
}: InputProps) {
  // label과 input을 묶어줘야 스크린리더가 필드 이름을 읽는다.
  // 호출부가 id를 직접 주면 그걸 우선한다.
  const generatedId = useId()
  const inputId = id ?? generatedId
  const showError = Boolean(required && invalid)
  const errorMessage = showError ? `${label}을(를) 필수로 작성해주세요` : null

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div
        className={[styles.box[size], showError && styles.boxError]
          .filter(Boolean)
          .join(' ')}
      >
        <input
          id={inputId}
          className={[styles.field[size], showError && styles.fieldError]
            .filter(Boolean)
            .join(' ')}
          placeholder={placeholder ?? ' '}
          required={required}
          {...rest}
        />
        <label
          htmlFor={inputId}
          className={[styles.label[size], showError && styles.labelError]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
          {required && ' *'}
        </label>
      </div>
      {errorMessage && (
        <div className={styles.errorRow}>
          <AlertCircle className={styles.errorIcon[size]} aria-hidden="true" />
          <span className={styles.errorText[size]}>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}

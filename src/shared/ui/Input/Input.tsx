import { useId, type InputHTMLAttributes } from 'react'

import { AlertCircle } from 'lucide-react'

import * as styles from './Input.css'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  size?: 'medium' | 'small'
  // floating: 라벨이 칸 안에 있다가 입력하면 위로 뜬다. stacked: 라벨이 칸 위에 따로 있고
  // placeholder가 보인다(Checkout.dc.html — 어두운 카드 안의 움푹 들어간 칸).
  variant?: 'floating' | 'stacked'
  required?: boolean
  invalid?: boolean
}

export function Input({
  label,
  size = 'medium',
  variant = 'floating',
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
  const stacked = variant === 'stacked'
  const labelText = (
    <>
      {label}
      {required && ' *'}
    </>
  )

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {stacked && (
        <label htmlFor={inputId} className={styles.stackedLabel}>
          {labelText}
        </label>
      )}
      <div
        className={[
          styles.box[size],
          stacked && styles.stackedBox,
          showError && styles.boxError,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input
          id={inputId}
          className={[
            styles.field[size],
            stacked && styles.stackedField,
            showError && styles.fieldError,
          ]
            .filter(Boolean)
            .join(' ')}
          // floating 라벨은 :placeholder-shown으로 비었는지 보므로 빈 칸이라도 한 칸을 깐다.
          placeholder={stacked ? placeholder : (placeholder ?? ' ')}
          required={required}
          {...rest}
        />
        {!stacked && (
          <label
            htmlFor={inputId}
            className={[styles.label[size], showError && styles.labelError]
              .filter(Boolean)
              .join(' ')}
          >
            {labelText}
          </label>
        )}
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

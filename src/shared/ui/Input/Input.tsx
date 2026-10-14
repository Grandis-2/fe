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
  /**
   * 칸 아래에 띄울 오류 문구. 주면 invalid와 상관없이 오류 모양이 된다 — 필수 누락
   * 말고도 형식·길이 오류를 그 칸에 붙일 때 쓴다.
   */
  error?: string
}

export function Input({
  label,
  size = 'medium',
  variant = 'floating',
  required,
  invalid,
  error,
  className,
  placeholder,
  id,
  ...rest
}: InputProps) {
  // label과 input을 묶어줘야 스크린리더가 필드 이름을 읽는다.
  // 호출부가 id를 직접 주면 그걸 우선한다.
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = useId()
  const errorMessage =
    error ?? (required && invalid ? `${label}을(를) 필수로 작성해주세요` : null)
  const showError = Boolean(errorMessage)
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
          // 스크린리더가 칸에 들어왔을 때 오류도 같이 읽는다.
          aria-invalid={showError || undefined}
          aria-describedby={showError ? errorId : undefined}
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
        <div id={errorId} className={styles.errorRow}>
          <AlertCircle className={styles.errorIcon[size]} aria-hidden="true" />
          <span className={styles.errorText[size]}>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}

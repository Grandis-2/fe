import { AlertCircle } from 'lucide-react'

import * as styles from './FieldError.css'

export type FieldErrorProps = {
  /** 없으면 아무것도 그리지 않는다 — 호출부가 조건문을 쓰지 않아도 된다 */
  message?: string
  id?: string
}

/**
 * 칸 아래의 오류 문구. Input은 스스로 그리지만 드롭다운·표·기간처럼 Input이 아닌 칸에
 * 같은 모양으로 붙인다.
 */
export function FieldError({ message, id }: FieldErrorProps) {
  if (!message) return null
  return (
    <div id={id} className={styles.root}>
      <AlertCircle className={styles.icon} aria-hidden="true" />
      <span className={styles.text}>{message}</span>
    </div>
  )
}

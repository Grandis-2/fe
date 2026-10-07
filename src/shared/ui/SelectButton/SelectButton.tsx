import type { ButtonHTMLAttributes } from 'react'

import * as styles from './SelectButton.css'

export type SelectButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'medium' | 'small'
  selected?: boolean
  // 라벨 오른쪽 끝에 붙는 보조 문구(추가금액 등). 한 줄로 길게 놓이는 medium에서 쓴다.
  extra?: string
}

export function SelectButton({
  size = 'small',
  selected = false,
  extra,
  className,
  children,
  ...rest
}: SelectButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[styles.size[size], selected && styles.selected, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
      {extra && <span className={styles.extra}>{extra}</span>}
    </button>
  )
}

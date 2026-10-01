import type { InputHTMLAttributes } from 'react'

import { Check } from 'lucide-react'

import * as styles from './Checkbox.css'

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> & {
  checked?: boolean
}

export function Checkbox({
  checked = false,
  className,
  ...rest
}: CheckboxProps) {
  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        {...rest}
      />
      <span className={styles.box}>
        {checked && <Check className={styles.icon} aria-hidden="true" />}
      </span>
    </span>
  )
}

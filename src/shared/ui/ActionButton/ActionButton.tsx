import type { ButtonHTMLAttributes } from 'react'

import { Handbag } from 'lucide-react'

import * as styles from './ActionButton.css'

export type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  // primary: 결제하기, cart: 장바구니(가방 아이콘이 앞에 붙는다).
  variant?: 'primary' | 'cart'
  size?: 'lg' | 'md'
  fullWidth?: boolean
  // 아이콘만 있는 정사각형 버튼 — aria-label을 같이 넘긴다.
  iconOnly?: boolean
  // 장바구니에 담은 뒤 상태(cart 전용).
  added?: boolean
}

export function ActionButton({
  variant = 'primary',
  size = 'lg',
  fullWidth,
  iconOnly,
  added,
  className,
  children,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={[
        styles.root,
        styles.size[size],
        styles.variant[variant],
        fullWidth && styles.fullWidth,
        iconOnly && styles.iconOnly,
        added && styles.added,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {variant === 'cart' && (
        <Handbag className={styles.icon} strokeWidth={1.8} aria-hidden="true" />
      )}
      {children}
    </button>
  )
}

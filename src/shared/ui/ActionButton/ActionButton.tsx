import type { ButtonHTMLAttributes } from 'react'

import { Handbag } from 'lucide-react'

import * as styles from './ActionButton.css'

export type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  // primary: 결제하기, cart: 장바구니(가방 아이콘이 앞에 붙는다), neutral: cart와 같은 바탕에 아이콘 없음(주소 찾기 등).
  variant?: 'primary' | 'cart' | 'neutral'
  size?: 'lg' | 'md'
  fullWidth?: boolean
  // 아이콘만 있는 정사각형 버튼 — aria-label을 같이 넘긴다.
  iconOnly?: boolean
  // 장바구니에 담은 뒤 상태(cart 전용).
  added?: boolean
}

// 어두운 사용자 화면에서 그라디언트를 쓰는 핵심 행동 버튼(결제·담기·가입)만 쓴다.
// 그 밖의 보조 버튼은 범용 Button을 쓴다 — 여기에 variant를 늘려 두 번째 범용 버튼이 되지 않게 한다.
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

import type { ButtonHTMLAttributes } from 'react'

import { spacing } from '@shared/config/theme'

import * as styles from './Button.css'

import type { LucideIcon } from 'lucide-react'

type ButtonColor = 'primary' | 'secondary' | 'cancel' | 'close'
type ButtonVariant = 'solid' | 'outline' | 'subtle'
type ButtonSize = 'large' | 'medium' | 'small'

const variantStyles = {
  solid: styles.solid,
  outline: styles.outline,
  subtle: styles.subtle,
}

const iconSize: Record<ButtonSize, string> = {
  small: spacing[16],
  medium: spacing[20],
  large: spacing[24],
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: ButtonColor
  variant?: ButtonVariant
  size?: ButtonSize
  rounded?: boolean
  // 아이콘 컴포넌트를 넘긴다(icon={Plus}) — 이름 문자열로 받으면 lucide 아이콘 전체를 동적으로 불러와야 한다.
  icon?: LucideIcon
}

export function Button({
  color = 'primary',
  variant = 'solid',
  size = 'medium',
  rounded,
  icon: Icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const variantClassName = variantStyles[variant][color]

  return (
    <button
      type="button"
      className={[
        styles.size[size],
        variantClassName,
        rounded && styles.rounded,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {Icon && <Icon size={iconSize[size]} className={styles.icon} />}
      {children}
    </button>
  )
}

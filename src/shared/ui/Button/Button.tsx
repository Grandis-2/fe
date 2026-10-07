import type { ButtonHTMLAttributes } from 'react'

import { DynamicIcon, type IconName } from 'lucide-react/dynamic'

import { spacing } from '@shared/config/theme'

import * as styles from './Button.css'

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
  icon?: IconName
}

export function Button({
  color = 'primary',
  variant = 'solid',
  size = 'medium',
  rounded,
  icon,
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
      {icon && (
        <DynamicIcon
          name={icon}
          size={iconSize[size]}
          className={styles.icon}
        />
      )}
      {children}
    </button>
  )
}

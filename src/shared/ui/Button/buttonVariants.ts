import { spacing } from '@shared/config/theme'

import * as styles from './Button.css'

// Button과 ButtonLink(버튼 모양 링크)가 같은 모양을 쓴다.
export type ButtonColor = 'primary' | 'secondary' | 'cancel' | 'close'
export type ButtonVariant = 'solid' | 'outline' | 'subtle'
export type ButtonSize = 'large' | 'medium' | 'small'

export const variantStyles = {
  solid: styles.solid,
  outline: styles.outline,
  subtle: styles.subtle,
}

export const iconSize: Record<ButtonSize, string> = {
  small: spacing[16],
  medium: spacing[20],
  large: spacing[24],
}

import type { HTMLAttributes } from 'react'

import {
  outline,
  shape as shapeStyles,
  sizer,
  sizerGhost,
  sizerLabel,
  solid,
  subtle,
} from './Tag.css'

type TagColor =
  'primary' | 'secondary' | 'blue' | 'green' | 'yellow' | 'red' | 'gray'
type TagVariant = 'solid' | 'subtle' | 'outline'
type TagSize = 'small' | 'medium'

const variantStyles = { solid, subtle, outline }

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  color?: TagColor
  variant?: TagVariant
  size?: TagSize
  rounded?: boolean
  /**
   * 이 자리에 나올 수 있는 모든 문구. 표의 상태 열처럼 행마다 다른 Tag가
   * 번갈아 나오는 자리에 넘기면, 그중 가장 긴 문구에 너비가 맞춰져 모든 Tag가
   * 같은 폭으로 보인다.
   */
  widthOptions?: readonly string[]
}

export function Tag({
  color = 'primary',
  variant = 'solid',
  size = 'small',
  rounded = true,
  widthOptions,
  className,
  children,
  ...rest
}: TagProps) {
  const variantClassName = variantStyles[variant][color]

  return (
    <span
      className={[
        shapeStyles[size][rounded ? 'full' : 'rect'],
        variantClassName,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {widthOptions ? (
        <span className={sizer}>
          <span className={sizerLabel}>{children}</span>
          {widthOptions.map((option) => (
            <span key={option} className={sizerGhost} aria-hidden="true">
              {option}
            </span>
          ))}
        </span>
      ) : (
        children
      )}
    </span>
  )
}

import type { TextareaHTMLAttributes } from 'react'

import * as styles from './Textarea.css'

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'rows'
> & {
  /**
   * 스크린리더가 읽을 이름. 화면에 보이는 제목은 호출부가 따로 두는 경우가
   * 많아서(폼의 섹션 제목 등) 여기서는 그리지 않고 aria-label로만 붙인다.
   */
  label: string
  size?: 'medium' | 'small'
  /** 기본 높이를 줄 수로 정한다 */
  rows?: number
}

export function Textarea({
  label,
  size = 'medium',
  rows = 3,
  className,
  ...rest
}: TextareaProps) {
  return (
    <textarea
      aria-label={label}
      rows={rows}
      className={[styles.size[size], className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
}

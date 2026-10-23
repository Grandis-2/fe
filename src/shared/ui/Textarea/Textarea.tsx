import type { TextareaHTMLAttributes } from 'react'

import { formatNumber } from '@shared/lib/formatNumber'

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

/**
 * 여러 줄 입력칸. maxLength를 주면 칸 안 오른쪽 아래에 'N / 최대'를 띄운다 — 화면마다
 * 글자 수를 칸 밖에 따로 그리던 걸 한 모양으로 맞춘다.
 * ponytail: 글자 수는 value로 센다 — defaultValue만 주는 비제어 칸은 0으로 보인다.
 */
export function Textarea({
  label,
  size = 'medium',
  rows = 3,
  maxLength,
  className,
  ...rest
}: TextareaProps) {
  const counted = maxLength !== undefined
  const textarea = (
    <textarea
      aria-label={label}
      rows={rows}
      maxLength={maxLength}
      className={[styles.size[size], counted && styles.counted, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  )

  if (!counted) return textarea

  return (
    <div className={styles.root}>
      {textarea}
      <span className={styles.count}>
        {formatNumber(String(rest.value ?? '').length)} /{' '}
        {formatNumber(maxLength)}
      </span>
    </div>
  )
}

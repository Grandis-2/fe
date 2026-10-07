import type { ReactNode } from 'react'

import { formatNumber } from '@shared/lib/formatNumber'

import * as styles from './PreorderModelSummary.css'

import type { PreorderModel } from '../../model/preorder'

export type PreorderModelSummaryProps = {
  model: Pick<PreorderModel, 'name' | 'imageSrc' | 'price'>
  imageAlt?: string
  /** 이름 아래 한 줄 — 출시일·예약 오픈일·도착 안내처럼 상태마다 다르다. */
  caption: string
  /** 오른쪽 버튼 자리 — 예약하기·알림 받기·구매하기는 쓰는 쪽이 정한다. */
  action: ReactNode
  className?: string
}

// 바텀시트 안 모델 한 줄(어두운 시트 전용). 사진 · 이름/안내/가격 · 버튼.
export function PreorderModelSummary({
  model: { name, imageSrc, price },
  imageAlt = '',
  caption,
  action,
  className,
}: PreorderModelSummaryProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.thumbnail}>
        {imageSrc && (
          <img src={imageSrc} alt={imageAlt} className={styles.image} />
        )}
      </div>
      <div className={styles.body}>
        <span className={styles.name}>{name}</span>
        <span className={styles.caption}>{caption}</span>
        <span className={styles.price}>
          {formatNumber(price)}
          <span className={styles.priceUnit}> 원부터</span>
        </span>
      </div>
      {action}
    </div>
  )
}

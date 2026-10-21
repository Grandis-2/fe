import { Chip } from '@shared/ui'

import * as styles from './OpenPreorderPicker.css'

import type { OpenPreorder } from '../../lib/useOpenPreorders'

export type OpenPreorderPickerProps = {
  items: readonly Pick<OpenPreorder, 'productId' | 'name'>[]
  /** 고른 사전예약. null이면 전체 */
  selected: string | null
  onSelect: (productId: string | null) => void
}

/** 화면을 어느 사전예약 기준으로 볼지 고르는 칩 줄. 처음엔 전체 */
export function OpenPreorderPicker({
  items,
  selected,
  onSelect,
}: OpenPreorderPickerProps) {
  if (items.length === 0) {
    return <div className={styles.empty}>지금 접수 중인 사전예약이 없어요.</div>
  }

  return (
    <div className={styles.root} role="group" aria-label="볼 사전예약">
      <Chip
        className={styles.chip}
        selected={selected === null}
        onClick={() => onSelect(null)}
      >
        전체
      </Chip>
      {items.map((item) => (
        <Chip
          key={item.productId}
          className={styles.chip}
          selected={selected === item.productId}
          onClick={() => onSelect(item.productId)}
        >
          {item.name}
        </Chip>
      ))}
    </div>
  )
}

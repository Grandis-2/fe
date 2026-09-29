import { typography } from '@/shared/config/theme'

import * as styles from './AddressCard.css'

// 주소록이 배송지 하나(기본 배송지)로 줄어서 id/label/isDefault가 필요 없다 —
// 여러 배송지가 부활하면 그때 다시 붙인다.
export type AddressCardData = {
  recipientName: string
  phone: string
  fullAddress: string
}

export type AddressCardProps = {
  address: AddressCardData
  onEdit?: () => void
  className?: string
}

export function AddressCard({ address, onEdit, className }: AddressCardProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={[typography.body.defaultMedium, styles.label].join(' ')}>
        기본 배송지
      </div>
      <div className={[typography.body.sub, styles.recipient].join(' ')}>
        {address.recipientName} · {address.phone}
      </div>
      <div className={[typography.body.sub, styles.fullAddress].join(' ')}>
        {address.fullAddress}
      </div>
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.action}
          onClick={() => onEdit?.()}
        >
          수정
        </button>
      </div>
    </div>
  )
}

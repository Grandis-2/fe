import { typography } from '@/shared/config/theme'

import * as styles from './AddressCard.css'

import type { DefaultAddress } from '../../model/defaultAddress'

export type AddressCardProps = {
  address: DefaultAddress
  onEdit?: () => void
  className?: string
}

export function AddressCard({ address, onEdit, className }: AddressCardProps) {
  const fullAddress = [address.line1, address.line2].filter(Boolean).join(' ')

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={[typography.body.defaultMedium, styles.label].join(' ')}>
        기본 배송지
      </div>
      <div className={[typography.body.sub, styles.recipient].join(' ')}>
        {address.name} · {address.phone}
      </div>
      <div className={[typography.body.sub, styles.fullAddress].join(' ')}>
        {fullAddress}
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

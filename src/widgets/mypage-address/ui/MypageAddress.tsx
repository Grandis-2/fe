import { useEffect, useState } from 'react'

import { MapPin, Plus } from 'lucide-react'

import {
  AddressCard,
  getDefaultAddress,
  type AddressCardData,
} from '@/entities/address'
import { Button } from '@/shared/ui'

import * as styles from './MypageAddress.css'

export function MypageAddress() {
  const [address, setAddress] = useState<AddressCardData | null>(null)

  useEffect(() => {
    getDefaultAddress()
      .then(({ shippingAddress }) =>
        setAddress(
          shippingAddress
            ? {
                recipientName: shippingAddress.name,
                phone: shippingAddress.phone,
                fullAddress: [shippingAddress.line1, shippingAddress.line2]
                  .filter(Boolean)
                  .join(' '),
              }
            : null,
        ),
      )
      .catch(() => {})
  }, [])

  if (!address) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <MapPin className={styles.emptyPin} aria-hidden="true" />
          <span className={styles.emptyBadge}>
            <Plus className={styles.emptyBadgeIcon} aria-hidden="true" />
          </span>
        </div>
        <div className={styles.emptyText}>
          <div className={styles.emptyTitle}>등록된 배송지가 없습니다.</div>
          <div className={styles.emptyDescription}>
            자주 받는 곳을 미리 등록하면 주문할 때 더 빠르게 선택할 수 있어요.
          </div>
        </div>
        <Button className={styles.emptyButton}>주소 찾기</Button>
        <div className={styles.emptyCaption}>
          결제 단계에서 다른 배송지로 수정할 수 있습니다.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <AddressCard address={address} />
    </div>
  )
}

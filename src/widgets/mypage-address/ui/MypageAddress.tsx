import { useState } from 'react'

import { MapPin, Plus } from 'lucide-react'

import { AddressCard, useDefaultAddress } from '@entities/address'
import { ActionButton } from '@shared/ui'

import { AddressForm } from './AddressForm'
import * as styles from './MypageAddress.css'

export function MypageAddress() {
  // 저장하면 useSaveDefaultAddress가 캐시를 갱신하므로 여기서 다시 조회하지 않는다.
  const { data: address } = useDefaultAddress()
  const [editing, setEditing] = useState(false)

  return (
    <div className={styles.root}>
      <div className={styles.intro}>
        <h1 className={styles.title}>배송지 관리</h1>
        <span className={styles.description}>
          배송지는 1개만 등록할 수 있어요. 결제할 때 이 주소가 자동으로
          입력돼요.
        </span>
      </div>

      {editing ? (
        <AddressForm onClose={() => setEditing(false)} />
      ) : address ? (
        <AddressCard address={address} onEdit={() => setEditing(true)} />
      ) : (
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
          <div className={styles.emptyCaption}>
            결제 단계에서 다른 배송지로 수정할 수 있습니다.
          </div>
          <ActionButton
            size="md"
            className={styles.emptyButton}
            onClick={() => setEditing(true)}
          >
            주소 추가
          </ActionButton>
        </div>
      )}
    </div>
  )
}

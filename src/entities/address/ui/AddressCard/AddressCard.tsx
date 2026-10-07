import { Button, Tag } from '@shared/ui'

import * as styles from './AddressCard.css'

import type { DefaultAddress } from '../../model/defaultAddress'

export type AddressCardProps = {
  address: DefaultAddress
  onEdit?: () => void
  className?: string
}

// 01012345678 → 010-1234-5678. 이미 하이픈이 있거나 자릿수가 다르면 그대로 둔다.
const formatPhone = (phone: string) =>
  phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3')

export function AddressCard({ address, onEdit, className }: AddressCardProps) {
  const rows = [
    { label: '받는 분', value: address.name },
    { label: '연락처', value: formatPhone(address.phone) },
    {
      label: '주소',
      value: [address.line1, address.line2, `(${address.postalCode})`]
        .filter(Boolean)
        .join(' '),
    },
  ]

  return (
    <article className={[styles.root, className].filter(Boolean).join(' ')}>
      <header className={styles.header}>
        {/* 배송지명이 없으면(서버가 아직 안 보냄) 이름 자리에 '기본 배송지'만 둔다. */}
        {address.label || '기본 배송지'}
        {address.label && (
          <Tag
            color="primary"
            variant="subtle"
            rounded={false}
            className={styles.tag}
          >
            기본 배송지
          </Tag>
        )}
      </header>
      <dl className={styles.rows}>
        {rows.map((row) => (
          <div key={row.label} className={styles.row}>
            <dt className={styles.rowLabel}>{row.label}</dt>
            <dd className={styles.rowValue}>{row.value}</dd>
          </div>
        ))}
      </dl>
      {onEdit && (
        <footer className={styles.footer}>
          <Button
            variant="subtle"
            color="cancel"
            className={styles.action}
            onClick={onEdit}
          >
            배송지 수정
          </Button>
        </footer>
      )}
    </article>
  )
}

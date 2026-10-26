import { useState } from 'react'

import {
  CONVERSION_DISCOUNT_MAX,
  type AdminProductDetailModel,
} from '@entities/admin-product'
import { Input, ModalActions, Tag } from '@shared/ui'

import * as styles from './ConvertToInStockForm.css'

type Variant = Pick<
  AdminProductDetailModel['variants'][number],
  'variantId' | 'title' | 'status'
>

export type ConversionValue = {
  stocks: { variantId: string; stock: number }[]
  discountRate: number
}

export type ConvertToInStockFormProps = {
  /** 이 상품의 옵션 전부 — 판매 중지 옵션도 빠짐없이 재고를 넣어야 서버가 받는다 */
  variants: Variant[]
  onConfirm: (value: ConversionValue) => void
  onCancel: () => void
}

const isWhole = (value: string) => /^\d+$/.test(value.trim())

/**
 * 일반 상품 전환 — 옵션마다 처음 재고와 일반 판매 할인율을 받는다. 사전예약 할인율은 이어
 * 쓰지 않아(서버 규칙) 0에서 시작한다. 칸이 비거나 숫자가 아니면 확인을 막는다.
 */
export function ConvertToInStockForm({
  variants,
  onConfirm,
  onCancel,
}: ConvertToInStockFormProps) {
  const [stocks, setStocks] = useState<Record<string, string>>(() =>
    Object.fromEntries(variants.map((variant) => [variant.variantId, '0'])),
  )
  const [discount, setDiscount] = useState('0')
  const discountOk =
    isWhole(discount) && Number(discount) <= CONVERSION_DISCOUNT_MAX
  const stocksOk = variants.every((variant) =>
    isWhole(stocks[variant.variantId] ?? ''),
  )

  return (
    <div className={styles.root}>
      <ul className={styles.list} aria-label="옵션별 처음 재고">
        {variants.map((variant) => (
          <li key={variant.variantId} className={styles.row}>
            <span className={styles.name}>
              {variant.title}
              {variant.status === 'PAUSED' && (
                <Tag variant="subtle" size="small" color="gray">
                  판매 중지
                </Tag>
              )}
            </span>
            <Input
              className={styles.stock}
              label={`${variant.title} 재고`}
              size="small"
              inputMode="numeric"
              value={stocks[variant.variantId] ?? ''}
              error={
                isWhole(stocks[variant.variantId] ?? '')
                  ? undefined
                  : '0 이상 숫자'
              }
              onChange={(event) =>
                setStocks((prev) => ({
                  ...prev,
                  [variant.variantId]: event.target.value,
                }))
              }
            />
          </li>
        ))}
      </ul>
      <Input
        label="일반 판매 할인율(%)"
        variant="stacked"
        inputMode="numeric"
        value={discount}
        error={
          discountOk ? undefined : `0~${CONVERSION_DISCOUNT_MAX} 사이 숫자로`
        }
        onChange={(event) => setDiscount(event.target.value)}
      />
      <ModalActions
        confirmLabel="일반 상품으로 전환"
        confirmDisabled={!stocksOk || !discountOk}
        onConfirm={() =>
          onConfirm({
            stocks: variants.map((variant) => ({
              variantId: variant.variantId,
              stock: Number(stocks[variant.variantId]),
            })),
            discountRate: Number(discount),
          })
        }
        onCancel={onCancel}
      />
    </div>
  )
}

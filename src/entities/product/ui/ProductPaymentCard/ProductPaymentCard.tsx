import { X } from 'lucide-react'
import { Link } from 'react-router'

import { Button, Checkbox, PriceText, QuantityStepper } from '@/shared/ui'

import * as styles from './ProductPaymentCard.css'

export type ProductPaymentCardVariant =
  'default' | 'preorder-pending' | 'checkout' | 'cart'

export type ProductPaymentCardItem = {
  imageSrc?: string
  /** 있으면 상품명이 /products/:id 링크가 된다. */
  productId?: string
  name: string
  modelNumber: string
  optionSummary: string
  quantityLabel: string
  priceLabel: string
}

export type ProductPaymentCardProps = {
  variant?: ProductPaymentCardVariant
  product: ProductPaymentCardItem
  actionLabel?: string
  onActionClick?: () => void
  /** 결제 기한 만료처럼 바깥 사정으로 액션을 막아야 할 때 */
  actionDisabled?: boolean
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  /** variant가 'cart'일 때 수량 조절기에 쓰인다. 없으면 quantityLabel을 그대로 보여준다. */
  quantity?: number
  onQuantityChange?: (quantity: number) => void
  /** variant가 'cart'일 때만 삭제 버튼을 보여준다. */
  onRemove?: () => void
  className?: string
}

export function ProductPaymentCard({
  variant = 'default',
  product: {
    imageSrc,
    productId,
    name,
    modelNumber,
    optionSummary,
    quantityLabel,
    priceLabel,
  },
  actionLabel,
  onActionClick,
  actionDisabled,
  checked = false,
  onCheckedChange,
  quantity,
  onQuantityChange,
  onRemove,
  className,
}: ProductPaymentCardProps) {
  const isCart = variant === 'cart'
  const isPending = variant === 'preorder-pending'
  const showAction = isPending || variant === 'checkout'
  const showStepper = isCart && quantity !== undefined && !!onQuantityChange

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.main}>
        {isCart && (
          <Checkbox
            className={styles.checkbox}
            aria-label={`${name} 선택`}
            checked={checked}
            onChange={(event) => onCheckedChange?.(event.target.checked)}
          />
        )}
        {imageSrc ? (
          <img src={imageSrc} alt="" className={styles.thumbnail} />
        ) : (
          <div className={styles.thumbnail} />
        )}
        <div
          className={[styles.body_, isCart && styles.bodyCart]
            .filter(Boolean)
            .join(' ')}
        >
          <div className={styles.infoGroup}>
            <div>
              <div className={styles.titleRow}>
                {productId ? (
                  <Link
                    to={`/products/${productId}`}
                    className={styles.nameLink}
                  >
                    {name}
                  </Link>
                ) : (
                  <div className={styles.name}>{name}</div>
                )}
                {isCart && onRemove && (
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`${name} 삭제`}
                    onClick={onRemove}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
              {modelNumber && (
                <div className={styles.modelNumber}>{modelNumber}</div>
              )}
            </div>
            <div className={styles.optionSummary}>{optionSummary}</div>
          </div>
          <div className={styles.quantityPriceRow}>
            {showStepper ? (
              <QuantityStepper
                value={quantity}
                onChange={onQuantityChange}
                label={name}
              />
            ) : (
              <span className={styles.quantityLabel}>{quantityLabel}</span>
            )}
            <div className={styles.priceActionGroup}>
              <span className={styles.price}>
                <PriceText value={priceLabel} />
              </span>
            </div>
          </div>
        </div>
      </div>
      {showAction && (
        <div className={styles.actionRow}>
          <Button
            size="small"
            disabled={isPending || actionDisabled}
            onClick={onActionClick}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

import { type ReactNode } from 'react'

import { X } from 'lucide-react'
import { Link } from 'react-router'

import { productPath } from '@shared/config/routes'
import {
  Button,
  Checkbox,
  ImageWithFallback,
  PriceText,
  QuantityStepper,
} from '@shared/ui'

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
  /** 가격 밑에 붙는 버튼(주문 내역의 리뷰 쓰기·수정) — 붙으면 가격은 위 끝, 버튼은 아래 끝으로 갈라진다. cart엔 없다. */
  priceAction?: ReactNode
  /** 상품명·옵션 아래 붙는 본문(내 리뷰의 별점·글). cart엔 없다. */
  children?: ReactNode
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
  priceAction,
  children,
  className,
}: ProductPaymentCardProps) {
  const isCart = variant === 'cart'
  const isPending = variant === 'preorder-pending'
  const showAction = isPending || variant === 'checkout'
  const showStepper = isCart && quantity !== undefined && !!onQuantityChange

  // cart 밖에선 상품명·옵션을 한 줄로 자른다 — 셋을 75px 칸에 넣는다.
  const clamp = !isCart && styles.singleLine
  const nameNode = productId ? (
    <Link
      to={productPath(productId)}
      className={[styles.nameLink, clamp].filter(Boolean).join(' ')}
    >
      {name}
    </Link>
  ) : (
    <div className={[styles.name, clamp].filter(Boolean).join(' ')}>{name}</div>
  )

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
        <ImageWithFallback
          src={imageSrc}
          className={[styles.thumbnail, !isCart && styles.thumbnailCompact]
            .filter(Boolean)
            .join(' ')}
        />
        {isCart ? (
          // 장바구니 — 아래 줄에 수량 조절기와 가격, 상품명 줄 오른쪽에 삭제 버튼.
          <div className={styles.body_}>
            <div className={styles.infoGroup}>
              <div>
                <div className={styles.titleRow}>
                  {nameNode}
                  {onRemove && (
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
        ) : (
          <>
            <div className={styles.details}>
              <div
                className={[
                  styles.summary,
                  quantityLabel && styles.summaryWithQuantity,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {nameNode}
                <div
                  className={[styles.optionSummary, styles.singleLine].join(
                    ' ',
                  )}
                >
                  {optionSummary}
                </div>
                {quantityLabel && (
                  <span
                    className={[
                      styles.quantityLabel,
                      styles.summaryQuantity,
                    ].join(' ')}
                  >
                    {quantityLabel}
                  </span>
                )}
              </div>
              {children}
            </div>
            <div
              className={[styles.side, priceAction && styles.sideSplit]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.price}>
                <PriceText value={priceLabel} />
              </span>
              {priceAction}
            </div>
          </>
        )}
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

import { useState } from 'react'

import { useNavigate } from 'react-router'

import {
  type CartItem,
  useCartItems,
  useRemoveCartItem,
  useUpdateCartItemQuantity,
} from '@entities/cart'
import { OrderSummary } from '@entities/order'
import { ProductPaymentCard, useProduct } from '@entities/product'
import { getErrorMessage } from '@shared/api/client'
import { PAYMENT_PATH } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { formatWon } from '@shared/lib/formatNumber'
import { Checkbox, InlineAlert } from '@shared/ui'

import * as styles from './MypageCart.css'

export function MypageCart() {
  const navigate = useNavigate()
  const { data: items = [], isPending, isError } = useCartItems()
  const updateQuantity = useUpdateCartItemQuantity()
  const removeCartItem = useRemoveCartItem()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedItems = items.filter((item) => selectedIds.has(item.id))
  const allSelected = items.length > 0 && selectedItems.length === items.length

  const selectedTotal = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(items.map((item) => item.id)) : new Set())

  // 요청은 바뀐 수량을 통째로 보내므로, 응답 전에 또 누르면 같은 값이 두 번 간다 — 진행 중엔 무시한다.
  const changeQuantity = (id: string, quantity: number) => {
    if (updateQuantity.isPending) return
    updateQuantity.mutate({ id, quantity })
  }

  const removeItem = (id: string) => {
    if (removeCartItem.isPending) return
    removeCartItem.mutate(id, {
      onSuccess: () =>
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        }),
    })
  }

  const listMessage = isPending
    ? '불러오는 중이에요.'
    : isError
      ? '장바구니를 불러오지 못했어요.'
      : items.length === 0
        ? '장바구니가 비어 있어요.'
        : null
  const actionError = updateQuantity.error ?? removeCartItem.error

  const toggleOne = (id: string, checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <div className={styles.root}>
      <div className={styles.selectAllRow}>
        <label
          className={[typography.body.subMedium, styles.selectAll].join(' ')}
        >
          <Checkbox
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
          />
          전체 선택
        </label>
      </div>
      <div className={styles.list}>
        {listMessage && (
          <InlineAlert status={isError ? 'error' : 'info'}>
            {listMessage}
          </InlineAlert>
        )}
        {actionError && (
          <InlineAlert status="error">
            {getErrorMessage(actionError, '장바구니를 변경하지 못했어요.')}
          </InlineAlert>
        )}
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            className={styles.card}
            checked={selectedIds.has(item.id)}
            onCheckedChange={(checked) => toggleOne(item.id, checked)}
            onQuantityChange={(quantity) => changeQuantity(item.id, quantity)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>
      <OrderSummary
        className={styles.remote}
        rows={[
          { label: '상품 수', value: `${selectedItems.length}개` },
          { label: '상품 금액', value: formatWon(selectedTotal) },
          { label: '배송비', value: '무료' },
        ]}
        totalValue={formatWon(selectedTotal)}
        actionLabel="결제하기"
        actionDisabled={selectedItems.length === 0}
        onAction={() => navigate(PAYMENT_PATH)}
      />
    </div>
  )
}

type CartItemRowProps = {
  item: CartItem
  className: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

function CartItemRow({
  item,
  className,
  checked,
  onCheckedChange,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const { data: product } = useProduct(item.productId)
  // 장바구니의 optionCode는 상품 옵션의 sku다(장바구니는 아직 프론트 제안 API).
  const variant = product?.variants.find(({ sku }) => sku === item.optionCode)

  return (
    <ProductPaymentCard
      className={className}
      variant="cart"
      product={{
        imageSrc: product?.imageUrl ?? undefined,
        productId: item.productId,
        name: product?.title ?? item.productId,
        // ponytail: 백엔드 상세에 모델명 칸이 없어 비워 둔다 — 필요하면 백엔드에 요청.
        modelNumber: '',
        optionSummary: variant?.title ?? item.optionCode,
        quantityLabel: `수량 ${item.quantity}개`,
        priceLabel: formatWon(item.price * item.quantity),
      }}
      checked={checked}
      onCheckedChange={onCheckedChange}
      quantity={item.quantity}
      onQuantityChange={onQuantityChange}
      onRemove={onRemove}
    />
  )
}

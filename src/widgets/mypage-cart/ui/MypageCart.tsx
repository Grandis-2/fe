import { useState } from 'react'

import { useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import {
  type CartItem,
  useCartItems,
  useRemoveCartItem,
  useUpdateCartItemQuantity,
} from '@entities/cart'
import { OrderSummary } from '@entities/order'
import {
  ProductPaymentCard,
  productDetailQuery,
  useProduct,
} from '@entities/product'
import type { PurchaseDraft } from '@features/product-purchase'
import { getErrorMessage } from '@shared/api/client'
import { HOME_PATH, PAYMENT_PATH } from '@shared/config/routes'
import { formatWon } from '@shared/lib/formatNumber'
import { Button, Checkbox, InlineAlert } from '@shared/ui'

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

  // 결제 화면에 넘길 상품명·옵션은 상품 상세에만 있다. 각 줄(CartItemRow)이 이미 같은 키로
  // 불러 둔 캐시를 그대로 쓴다. 하나라도 아직 없거나 옵션을 못 찾으면 결제를 막는다.
  const selectedProducts = useQueries({
    queries: selectedItems.map((item) => productDetailQuery(item.productId)),
  })
  const checkoutDrafts = selectedItems.flatMap(
    (item, index): PurchaseDraft[] => {
      const product = selectedProducts[index]?.data
      const variant = product?.variants.find(
        ({ sku }) => sku === item.optionCode,
      )
      if (!product || !variant) return []
      return [
        {
          variantId: variant.variantId,
          productName: product.title,
          optionSummary: variant.title,
          quantity: item.quantity,
          unitPrice: item.price,
        },
      ]
    },
  )
  const checkoutReady =
    selectedItems.length > 0 && checkoutDrafts.length === selectedItems.length

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

  // 선택한 줄을 한꺼번에 지운다. 일부만 실패하면 그 줄은 목록에 남고 오류 문구가 뜬다
  // (removeCartItem.error) — 지워진 줄만 선택에서 뺀다.
  const removeSelected = async () => {
    if (removeCartItem.isPending) return
    const ids = selectedItems.map((item) => item.id)
    const results = await Promise.allSettled(
      ids.map((id) => removeCartItem.mutateAsync(id)),
    )
    const removed = ids.filter(
      (_, index) => results[index].status === 'fulfilled',
    )
    setSelectedIds(
      (prev) => new Set([...prev].filter((id) => !removed.includes(id))),
    )
  }

  const listMessage = isPending
    ? '불러오는 중이에요.'
    : isError
      ? '장바구니를 불러오지 못했어요.'
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
      <h1 className={styles.title}>장바구니</h1>

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

      {!isPending && !isError && items.length === 0 && (
        <div className={styles.empty}>
          <span>장바구니에 담긴 상품이 없어요.</span>
          <Button
            variant="subtle"
            color="cancel"
            onClick={() => navigate(HOME_PATH)}
          >
            쇼핑하러 가기
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <label className={styles.selectAll}>
              <Checkbox
                checked={allSelected}
                onChange={(event) => toggleAll(event.target.checked)}
              />
              전체 선택
              <span className={styles.selectAllCount}>{items.length}개</span>
            </label>
            <Button
              size="small"
              variant="subtle"
              color="cancel"
              disabled={selectedItems.length === 0 || removeCartItem.isPending}
              onClick={() => void removeSelected()}
            >
              선택 삭제
            </Button>
          </div>

          <div className={styles.layout}>
            <div className={styles.list}>
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  className={styles.item}
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={(checked) => toggleOne(item.id, checked)}
                  onQuantityChange={(quantity) =>
                    changeQuantity(item.id, quantity)
                  }
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
            <OrderSummary
              className={styles.summary}
              rows={[
                { label: '선택 상품', value: `${selectedItems.length}개` },
                { label: '상품 금액', value: formatWon(selectedTotal) },
                { label: '배송비', value: '무료' },
              ]}
              totalLabel="결제 예정 금액"
              totalValue={formatWon(selectedTotal)}
              actionLabel="결제하기"
              actionDisabled={!checkoutReady}
              darkAction
              onAction={() => navigate(PAYMENT_PATH, { state: checkoutDrafts })}
            />
          </div>
        </>
      )}
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

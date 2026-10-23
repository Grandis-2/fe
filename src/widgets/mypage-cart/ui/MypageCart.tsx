import { useState } from 'react'

import { useNavigate } from 'react-router'

import {
  cartUnavailableLabel,
  useCartLines,
  useRemoveCartItem,
  useUpdateCartItemQuantity,
  type CartLine,
} from '@entities/cart'
import { OrderSummary } from '@entities/order'
import { ProductPaymentCard } from '@entities/product'
import { getErrorMessage } from '@shared/api/client'
import { cartPaymentPath, SEARCH_PATH } from '@shared/config/routes'
import { formatWon } from '@shared/lib/formatNumber'
import {
  Button,
  Checkbox,
  InlineAlert,
  Skeleton,
  SkeletonGroup,
} from '@shared/ui'

import * as styles from './MypageCart.css'

// 장바구니(GET /api/v1/cart) — 줄마다 지금 가격·재고·살 수 있는지가 같이 온다.
// 살 수 없는 줄(purchasable false)은 고를 수 없고 이유를 보여 준다. 고른 줄을 결제 화면(?cart=)으로 넘긴다.
export function MypageCart() {
  const navigate = useNavigate()
  const { data: lines = [], isPending, isError } = useCartLines()
  const updateQuantity = useUpdateCartItemQuantity()
  const removeCartItem = useRemoveCartItem()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const purchasableLines = lines.filter(({ purchasable }) => purchasable)
  // 고른 뒤 살 수 없게 바뀐 줄은 선택에서 저절로 빠진다.
  const selectedLines = purchasableLines.filter(({ cartItemId }) =>
    selectedIds.has(cartItemId),
  )
  const allSelected =
    purchasableLines.length > 0 &&
    selectedLines.length === purchasableLines.length
  const selectedTotal = selectedLines.reduce(
    (total, line) => total + (line.lineAmount ?? 0),
    0,
  )

  const toggleAll = (checked: boolean) =>
    setSelectedIds(
      checked
        ? new Set(purchasableLines.map(({ cartItemId }) => cartItemId))
        : new Set(),
    )

  const toggleOne = (cartItemId: string, checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(cartItemId)
      else next.delete(cartItemId)
      return next
    })

  // 화면은 바로 바뀌고(낙관적) 최종 수량을 보내므로, 응답 전에 또 눌러도 막지 않는다.
  const changeQuantity = (cartItemId: string, quantity: number) =>
    updateQuantity.mutate({ cartItemId, quantity })

  const removeLine = (cartItemId: string) => {
    if (removeCartItem.isPending) return
    removeCartItem.mutate(cartItemId, {
      onSuccess: () => toggleOne(cartItemId, false),
    })
  }

  // 선택한 줄을 한꺼번에 지운다. 일부만 실패하면 그 줄은 목록에 남고 오류 문구가 뜬다 — 지워진 줄만 선택에서 뺀다.
  const removeSelected = async () => {
    if (removeCartItem.isPending) return
    const ids = selectedLines.map(({ cartItemId }) => cartItemId)
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

  const actionError = updateQuantity.error ?? removeCartItem.error

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>장바구니</h1>

      {isPending && <CartSkeleton />}
      {isError && (
        <InlineAlert variant="big" status="error">
          장바구니를 불러오지 못했어요.
        </InlineAlert>
      )}
      {actionError && (
        <InlineAlert variant="big" status="error">
          {getErrorMessage(actionError, '장바구니를 변경하지 못했어요.')}
        </InlineAlert>
      )}

      {!isPending && !isError && lines.length === 0 && (
        <div className={styles.empty}>
          <span>장바구니에 담긴 상품이 없어요.</span>
          <Button
            variant="subtle"
            color="cancel"
            onClick={() => navigate(SEARCH_PATH)}
          >
            쇼핑하러 가기
          </Button>
        </div>
      )}

      {lines.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <label className={styles.selectAll}>
              <Checkbox
                checked={allSelected}
                disabled={purchasableLines.length === 0}
                onChange={(event) => toggleAll(event.target.checked)}
              />
              전체 선택
              <span className={styles.selectAllCount}>{lines.length}개</span>
            </label>
            <Button
              size="small"
              variant="subtle"
              color="cancel"
              disabled={selectedLines.length === 0 || removeCartItem.isPending}
              onClick={() => void removeSelected()}
            >
              선택 삭제
            </Button>
          </div>

          <div className={styles.layout}>
            <div className={styles.list}>
              {lines.map((line) => (
                <CartLineRow
                  key={line.cartItemId}
                  line={line}
                  checked={selectedIds.has(line.cartItemId) && line.purchasable}
                  onCheckedChange={(checked) =>
                    line.purchasable && toggleOne(line.cartItemId, checked)
                  }
                  onQuantityChange={(quantity) =>
                    changeQuantity(line.cartItemId, quantity)
                  }
                  onRemove={() => removeLine(line.cartItemId)}
                />
              ))}
            </div>
            <OrderSummary
              className={styles.summary}
              rows={[
                { label: '선택 상품', value: `${selectedLines.length}개` },
                { label: '상품 금액', value: formatWon(selectedTotal) },
              ]}
              totalLabel="결제 예정 금액"
              totalValue={formatWon(selectedTotal)}
              actionLabel="결제하기"
              actionDisabled={selectedLines.length === 0}
              darkAction
              onAction={() =>
                navigate(
                  cartPaymentPath(
                    selectedLines.map(({ cartItemId }) => cartItemId),
                  ),
                )
              }
            />
          </div>
        </>
      )}
    </div>
  )
}

type CartLineRowProps = {
  line: CartLine
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

// 장바구니 한 줄 — 살 수 없으면 카드 아래에 이유를 붙인다.
function CartLineRow({
  line,
  checked,
  onCheckedChange,
  onQuantityChange,
  onRemove,
}: CartLineRowProps) {
  return (
    <div className={styles.item}>
      <ProductPaymentCard
        variant="cart"
        product={{
          imageSrc: line.imageUrl ?? undefined,
          productId: line.productId ?? undefined,
          name: line.productTitle ?? '판매 종료된 상품',
          modelNumber: '',
          optionSummary: [line.optionTitle, line.warranty && '보증 포함']
            .filter(Boolean)
            .join(' · '),
          quantityLabel: `수량 ${line.quantity}개`,
          priceLabel:
            line.lineAmount === null ? '-' : formatWon(line.lineAmount),
        }}
        checked={checked}
        onCheckedChange={onCheckedChange}
        quantity={line.quantity}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
      />
      {line.unavailableReason && (
        <InlineAlert status="info">
          {cartUnavailableLabel[line.unavailableReason]}
          {line.unavailableReason === 'INSUFFICIENT_STOCK' &&
            ` (최대 ${line.availableQuantity}개)`}
        </InlineAlert>
      )}
    </div>
  )
}

// 줄마다 상품명·옵션 막대 길이를 달리해 실제 목록처럼 보이게 한다.
const SKELETON_ROWS = [
  ['46%', '78%'],
  ['34%', '52%'],
  ['40%', '66%'],
]

// 장바구니를 불러오는 동안 — 전체 선택 줄, 상품 목록, 결제 정보 자리를 실제 배치대로 깐다.
function CartSkeleton() {
  return (
    <SkeletonGroup className={styles.skeleton}>
      <div className={styles.toolbar}>
        <div className={styles.skeletonSelectAll}>
          <Skeleton width={22} height={22} />
          <Skeleton width={96} />
        </div>
        <Skeleton width={84} height={34} radius={10} />
      </div>

      <div className={styles.layout}>
        <div className={styles.list}>
          {SKELETON_ROWS.map(([titleWidth, optionWidth]) => (
            <div key={titleWidth} className={styles.skeletonRow}>
              <Skeleton
                width={22}
                height={22}
                className={styles.skeletonCheck}
              />
              <div className={styles.skeletonThumb}>
                <Skeleton aspectRatio="1 / 1" radius={12} />
                <Skeleton height={30} radius={8} />
              </div>
              <div className={styles.skeletonInfo}>
                <Skeleton width={titleWidth} height={18} />
                <Skeleton width={64} height={13} />
                <Skeleton width={optionWidth} height={13} />
                <Skeleton
                  width={110}
                  height={18}
                  className={styles.skeletonPrice}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.skeletonSummary}>
          <Skeleton width={80} height={18} />
          {[36, 96].map((width) => (
            <div key={width} className={styles.skeletonSummaryRow}>
              <Skeleton width={60} height={14} />
              <Skeleton width={width} height={14} />
            </div>
          ))}
          <div className={styles.skeletonTotal}>
            <Skeleton width={72} />
            <Skeleton width={120} height={24} />
          </div>
          <div className={styles.skeletonAction} />
        </div>
      </div>
    </SkeletonGroup>
  )
}

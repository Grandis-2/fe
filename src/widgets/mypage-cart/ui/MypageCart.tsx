import { useState } from 'react'

import { useNavigate } from 'react-router'

import { type CartItem } from '@/entities/cart'
import { OrderSummary } from '@/entities/order'
import { ProductPaymentCard } from '@/entities/product'
import { typography } from '@/shared/config/theme'
import { Checkbox } from '@/shared/ui'

import * as styles from './MypageCart.css'

// ponytail: 아직 장바구니 API가 없어서 목업 데이터로 대체
const products = [
  {
    name: '아이폰 18 Pro',
    modelNumber: 'A3714',
    optionSummary: '실버 · 512GB · AppleCare+ 포함',
    price: 2278100,
  },
  {
    name: '맥북 네오',
    modelNumber: 'A2992',
    optionSummary: '미드나이트 · 256GB',
    price: 1690000,
  },
  {
    name: '아이패드 오로라',
    modelNumber: 'A2696',
    optionSummary: '스타라이트 · 128GB',
    price: 990000,
  },
  {
    name: '워치 노바',
    modelNumber: 'A2986',
    optionSummary: '블랙 · 45mm',
    price: 590000,
  },
  {
    name: '에어팟 루멘',
    modelNumber: 'A3053',
    optionSummary: '화이트',
    price: 359000,
  },
]

// 긴 목록에서 리모컨이 따라오는지 보려고 5종을 10번 돌려 50개를 만든다.
const cartItems: CartItem[] = Array.from({ length: 50 }, (_, index) => ({
  id: String(index + 1),
  quantity: 1,
  ...products[index % products.length],
}))

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`

export function MypageCart() {
  const navigate = useNavigate()
  const [items, setItems] = useState(cartItems)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const allSelected = items.length > 0 && selectedIds.size === items.length

  const selectedTotal = items
    .filter((item) => selectedIds.has(item.id))
    .reduce((total, item) => total + item.price * item.quantity, 0)

  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(items.map((item) => item.id)) : new Set())

  const changeQuantity = (id: string, quantity: number) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
    )

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

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
        {items.map((item) => (
          <ProductPaymentCard
            key={item.id}
            className={styles.card}
            variant="cart"
            product={{
              imageSrc: item.imageSrc,
              // ponytail: 목업이라 장바구니 항목 id를 그대로 상품 id로 쓴다.
              productId: item.id,
              name: item.name,
              modelNumber: item.modelNumber,
              optionSummary: item.optionSummary,
              quantityLabel: `수량 ${item.quantity}개`,
              priceLabel: won(item.price * item.quantity),
            }}
            checked={selectedIds.has(item.id)}
            onCheckedChange={(checked) => toggleOne(item.id, checked)}
            quantity={item.quantity}
            onQuantityChange={(quantity) => changeQuantity(item.id, quantity)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>
      <OrderSummary
        className={styles.remote}
        rows={[
          { label: '상품 수', value: `${selectedIds.size}개` },
          { label: '상품 금액', value: won(selectedTotal) },
          { label: '배송비', value: '무료' },
        ]}
        totalValue={won(selectedTotal)}
        actionLabel="결제하기"
        actionDisabled={selectedIds.size === 0}
        onAction={() => navigate('/payment')}
      />
    </div>
  )
}

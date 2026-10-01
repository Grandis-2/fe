import { expect, waitFor } from 'storybook/test'

import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@/entities/product'
import placeholderImage from '@/shared/assets/react.svg'

import { HistoryCard } from './HistoryCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

// 제네릭 컴포넌트라 T를 명시해야 args의 renderItem 타입이 맞는다.
const meta = {
  component: HistoryCard<ProductPaymentCardItem>,
  tags: ['ai-generated'],
} satisfies Meta<typeof HistoryCard<ProductPaymentCardItem>>

export default meta
type Story = StoryObj<typeof meta>

const item = {
  imageSrc: placeholderImage,
  name: 'NOVA Phone',
  modelNumber: 'NV-2026',
  optionSummary: '미드나이트 · 256GB · AppleCare+ 포함',
  quantityLabel: '수량 1개',
  priceLabel: '1,290,000원',
}

const renderItem = (item: ProductPaymentCardItem) => (
  <ProductPaymentCard product={item} />
)

const base = {
  orderDate: '2026.09.01',
  orderNumber: '20260901-000123',
  items: [item],
  renderItem,
}

export const DeliveredBeforeReview: Story = {
  args: { ...base, status: 'delivered-before-review' },
}

export const DeliveredAfterReview: Story = {
  args: { ...base, status: 'delivered-after-review' },
}

export const Shipping: Story = {
  args: { ...base, status: 'shipping' },
}

export const Preparing: Story = {
  args: { ...base, status: 'preparing' },
}

export const Cancelled: Story = {
  args: { ...base, status: 'cancelled' },
}

export const ExpandableItems: Story = {
  args: {
    ...base,
    status: 'shipping',
    items: [item, { ...item, name: 'NOVA Watch' }],
  },
  play: async ({ canvas }) => {
    const expandButton = canvas.getByRole('button', { name: /더 보기/ })
    await expandButton.click()
    // 펼쳐진 아이템은 fadeInUp이 끝나야 보인다(backwards라 지연 동안 opacity 0).
    await waitFor(() => expect(canvas.getByText('NOVA Watch')).toBeVisible())
  },
}

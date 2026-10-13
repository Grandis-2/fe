import { expect, waitFor } from 'storybook/test'

import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@entities/product'
import { color } from '@shared/config/theme'

import { HistoryCard } from './HistoryCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

// 제네릭 컴포넌트라 T를 명시해야 args의 renderItem 타입이 맞는다.
const meta = {
  component: HistoryCard<ProductPaymentCardItem>,
  tags: ['ai-generated'],
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{ padding: 28, background: color.background.page }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HistoryCard<ProductPaymentCardItem>>

export default meta
type Story = StoryObj<typeof meta>

const item = {
  name: '맥북 프로 14',
  modelNumber: 'A3112',
  optionSummary: '스페이스 블랙 · 512GB',
  quantityLabel: '수량 1개',
  priceLabel: '2,390,000원',
}

const renderItem = (item: ProductPaymentCardItem) => (
  <ProductPaymentCard product={item} />
)

const base = {
  orderDate: '2026.09.01',
  orderNumber: 'NV26090112',
  items: [item],
  renderItem,
}

export const Delivered: Story = {
  args: { ...base, tag: { label: '배송 완료', color: 'gray' } },
}

export const Shipping: Story = {
  args: { ...base, tag: { label: '배송 중', color: 'blue' } },
}

// 모듈 스코프 — 렌더마다 새 Date를 넘기면 카운트다운 타이머가 계속 새로 걸린다.
const dueAt = new Date(Date.now() + 18 * 60 * 60 * 1000)

export const PurchaseConfirm: Story = {
  args: {
    ...base,
    tag: { label: '구매 확정 대기', color: 'yellow' },
    highlight: true,
    preorder: true,
    numberLabel: '예약번호',
    purchaseDueAt: dueAt,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('구매 확정 마감까지')).toBeVisible()
    await expect(canvas.getByText('사전예약')).toBeVisible()
  },
}

export const ExpandableItems: Story = {
  args: {
    ...base,
    tag: { label: '예약 확정', color: 'primary' },
    preorder: true,
    items: [
      item,
      { ...item, name: '아이폰 18 Pro' },
      { ...item, name: '에어팟 프로 3' },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /1개 더보기/ }))
    // 펼쳐진 아이템은 fadeInUp이 끝나야 보인다(backwards라 지연 동안 opacity 0).
    await waitFor(() => expect(canvas.getByText('에어팟 프로 3')).toBeVisible())
  },
}

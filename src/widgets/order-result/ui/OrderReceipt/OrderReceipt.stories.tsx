import { OrderReceipt } from './OrderReceipt'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OrderReceipt,
  tags: ['ai-generated'],
} satisfies Meta<typeof OrderReceipt>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    number: { label: '주문번호', value: 'NV26100712' },
    items: [
      {
        variantId: '1',
        productName: '맥북 프로 14',
        optionSummary: '스페이스 블랙 · 512GB',
        quantity: 1,
        unitPrice: 2390000,
      },
    ],
    rows: [
      { label: '사전예약 혜택 (10%)', value: '-239,000원', tone: 'brand' },
      { label: '결제 수단', value: '신용·체크카드 (일시불)' },
    ],
    amountLabel: '총 결제 금액',
    amount: 2151000,
  },
}

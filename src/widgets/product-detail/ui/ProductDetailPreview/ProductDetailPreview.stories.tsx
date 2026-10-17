import { expect } from 'storybook/test'

import { products, shipmentBatches } from '@shared/api/mock/fixtures/product'

import { ProductDetailPreview } from './ProductDetailPreview'

import type { Meta, StoryObj } from '@storybook/react-vite'

const inStock =
  products.find(({ saleMode }) => saleMode === 'IN_STOCK') ?? products[0]
const preorder =
  products.find(({ saleMode }) => saleMode === 'PREORDER') ?? products[0]

const meta = {
  title: 'widgets/product-detail/ProductDetailPreview',
  component: ProductDetailPreview,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div data-theme="dark">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductDetailPreview>

export default meta
type Story = StoryObj<typeof meta>

// 옵션은 골라 볼 수 있고, 결제·장바구니는 막혀 있다.
export const InStock: Story = {
  args: { product: inStock },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '결제하기' }),
    ).toBeDisabled()
    await expect(
      canvas.getByRole('button', { name: '장바구니' }),
    ).toBeDisabled()
  },
}

export const Preorder: Story = {
  args: { product: preorder, shipmentBatches },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '사전예약하기' }),
    ).toBeDisabled()
  },
}

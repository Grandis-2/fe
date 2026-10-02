import { expect, fn } from 'storybook/test'

import macbook1 from '@shared/assets/macbook_neo_sliver1.png'
import macbook2 from '@shared/assets/macbook_neo_sliver2.png'

import { ProductCard } from './ProductCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ProductCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof ProductCard>

export default meta
type Story = StoryObj<typeof meta>

const colorSwatches = [
  { hex: '#1A1A1D', label: '미드나이트' },
  { hex: '#F5F5F0', label: '스타라이트' },
]

export const Default: Story = {
  args: {
    product: {
      productId: 'sample-1',
      imageSrcs: [macbook1, macbook2],
      name: 'NOVA Phone',
      modelNumber: 'NV-2026',
      colorName: '미드나이트',
      colorSwatches,
      options: [
        { label: '256GB', selected: true },
        { label: '512GB', extraPrice: 130000 },
      ],
      basePrice: 1290000,
      saleMode: 'IN_STOCK',
    },
    onOptionSelect: fn(),
  },
  play: async ({ args, canvas }) => {
    await canvas.getByRole('button', { name: '512GB' }).click()
    await expect(args.onOptionSelect).toHaveBeenCalledWith(1)
  },
}

export const Preorder: Story = {
  args: {
    product: { ...Default.args.product, saleMode: 'PREORDER' },
  },
}

export const NoOptionSelected: Story = {
  args: {
    product: {
      ...Default.args.product,
      options: [{ label: '256GB' }, { label: '512GB' }],
    },
  },
}

export const ExtraPriceOptionSelected: Story = {
  args: {
    product: {
      ...Default.args.product,
      options: [
        { label: '256GB' },
        { label: '512GB', selected: true, extraPrice: 130000 },
      ],
    },
  },
}

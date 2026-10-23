import { expect } from 'storybook/test'

import { color } from '@shared/config/theme'

import { ProductDetailSkeleton } from './ProductDetailSkeleton'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'widgets/product-detail/ProductDetailSkeleton',
  component: ProductDetailSkeleton,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{ background: color.backgroundDark.base, minHeight: '100vh' }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductDetailSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveAttribute(
      'aria-busy',
      'true',
    )
  },
}

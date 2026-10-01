import { expect } from 'storybook/test'

import { AdminSidebar } from './AdminSidebar'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminSidebar,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Home: Story = {
  parameters: { initialEntries: ['/admin'] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: '홈' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}

export const ProductsActive: Story = {
  parameters: { initialEntries: ['/admin/products'] },
  play: async ({ canvas }) => {
    const active = canvas.getByRole('link', { name: '상품 관리' })
    await expect(active).toHaveAttribute('aria-current', 'page')
    await expect(active).toHaveStyle({
      backgroundColor: 'rgb(235, 237, 249)', // primary.subtler
      color: 'rgb(63, 72, 145)', // primary.base
    })

    const inactive = canvas.getByRole('link', { name: '홈' })
    await expect(inactive).not.toHaveAttribute('aria-current', 'page')
  },
}

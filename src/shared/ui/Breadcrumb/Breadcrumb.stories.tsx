import { expect } from 'storybook/test'

import { Breadcrumb } from './Breadcrumb'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Breadcrumb,
  tags: ['ai-generated'],
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    items: [
      { label: '예약 현황', to: '/admin/orders' },
      { label: 'RSV-18821' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation')).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: '예약 현황' }),
    ).toHaveAttribute('href', '/admin/orders')
    // 마지막 항목은 링크가 아니라 현재 위치다.
    await expect(
      canvas.queryByRole('link', { name: 'RSV-18821' }),
    ).not.toBeInTheDocument()
  },
}

export const SingleLink: Story = {
  args: { items: [{ label: '상품 관리로 돌아가기', to: '/admin/products' }] },
}

export const ThreeLevels: Story = {
  args: {
    items: [
      { label: '상품 관리', to: '/admin/products' },
      { label: '갤럭시 G999', to: '/admin/products/SM-G999' },
      { label: '배송 구간 설정' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('link')).toHaveLength(2)
  },
}

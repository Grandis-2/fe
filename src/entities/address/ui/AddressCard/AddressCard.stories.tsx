import { expect, fn } from 'storybook/test'

import { color } from '@shared/config/theme'

import { AddressCard } from './AddressCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AddressCard,
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
} satisfies Meta<typeof AddressCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    address: {
      name: '기매진',
      phone: '01012345678',
      postalCode: '06234',
      line1: '서울특별시 강남구 테헤란로 123',
      line2: '4층',
      label: '집',
    },
    onEdit: fn(),
  },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText('010-1234-5678')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '배송지 수정' }))
    await expect(args.onEdit).toHaveBeenCalled()
  },
}

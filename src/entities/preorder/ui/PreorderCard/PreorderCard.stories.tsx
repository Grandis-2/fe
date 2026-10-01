import placeholderImage from '@/shared/assets/react.svg'

import { PreorderCard } from './PreorderCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PreorderCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof PreorderCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    data: {
      id: '1',
      imageSrc: placeholderImage,
      title: 'NOVA Phone 사전예약 혜택',
      opensAt: '2026.09.01',
      closesAt: '2026.09.17',
    },
  },
}

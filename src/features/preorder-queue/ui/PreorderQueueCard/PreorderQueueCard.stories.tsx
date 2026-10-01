import { PreorderQueueCard } from './PreorderQueueCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PreorderQueueCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof PreorderQueueCard>

export default meta
type Story = StoryObj<typeof meta>

// 1초마다 순번이 줄어들다가 1번이 되면 멈춘다(페이지에선 이때 상품 페이지로 이동).
export const Default: Story = {
  args: {
    productName: 'IPhone 18 Pro',
    onComplete: () => {},
  },
}

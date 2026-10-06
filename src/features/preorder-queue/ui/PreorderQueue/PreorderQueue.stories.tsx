import { fn } from 'storybook/test'

import { PreorderQueue } from './PreorderQueue'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PreorderQueue,
  tags: ['ai-generated'],
} satisfies Meta<typeof PreorderQueue>

export default meta
type Story = StoryObj<typeof meta>

// 열리자마자 순번이 줄어든다. 닫으면 위에 QueuePill이 뜨고, 누르면 다시 열린다.
export const Default: Story = {
  args: { productName: '아이폰 18 Pro', onComplete: fn() },
}

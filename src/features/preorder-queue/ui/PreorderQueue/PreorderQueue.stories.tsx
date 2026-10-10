import { fn } from 'storybook/test'

import { PreorderQueue } from './PreorderQueue'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PreorderQueue,
  tags: ['ai-generated'],
} satisfies Meta<typeof PreorderQueue>

export default meta
type Story = StoryObj<typeof meta>

// 열리자마자 대기열에 진입한다. Storybook엔 MSW가 없어 진입이 실패해 순번이 '-'로 남고 2초마다 다시 진입한다
// — 실제 진행은 dev 서버(MSW)에서 본다. 닫으면 위에 QueuePill이 뜨고, 누르면 다시 열린다.
export const Default: Story = {
  args: {
    productId: '20000000-0000-4000-8000-000000000001',
    productName: '아이폰 18 Pro',
    onComplete: fn(),
    onFail: fn(),
  },
}

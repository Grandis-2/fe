import { usePreorderQueueStore } from '../../model/preorderQueueStore'

import { AdmissionTimer } from './AdmissionTimer'

import type { Meta, StoryObj } from '@storybook/react-vite'

const productId = '20000000-0000-4000-8000-000000000001'

const meta = {
  component: AdmissionTimer,
  tags: ['ai-generated'],
  args: { productId, productName: '아이폰 18 Pro' },
} satisfies Meta<typeof AdmissionTimer>

export default meta
type Story = StoryObj<typeof meta>

// 입장권이 expiresIn초 남은 상태로 스토어를 채운다. 접수 여유(5초)를 뺀 시간이 보인다.
const admitFor = (expiresIn: number) => () => {
  usePreorderQueueStore.setState({
    admission: {
      productId,
      admissionTicket: `et_story_${expiresIn}`,
      idempotencyKey: 'story',
      expiresAt: Date.now() + expiresIn * 1000,
    },
  })
  return () => usePreorderQueueStore.setState({ admission: null })
}

export const Default: Story = { beforeEach: admitFor(115) }

// 30초 아래로 남으면 경고색이다.
export const Urgent: Story = { beforeEach: admitFor(25) }

// 시간이 지났다 — 이 자리에서 다시 줄을 선다.
export const Over: Story = {
  beforeEach: admitFor(0),
  play: async ({ canvas }) => {
    await canvas.findByRole('button', { name: '다시 줄 서기' })
  },
}

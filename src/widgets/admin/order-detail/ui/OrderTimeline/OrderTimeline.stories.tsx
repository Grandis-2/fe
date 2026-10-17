import { expect } from 'storybook/test'

import { OrderTimeline } from './OrderTimeline'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OrderTimeline,
  tags: ['ai-generated'],
  args: {
    events: [
      {
        eventSequence: 2,
        fromStatus: 'AWAITING_CONFIRMATION',
        toStatus: 'PREPARING_ITEMS',
        actor: 'ADMIN',
        reason: '배송 준비를 시작합니다.',
        createdAt: '2026-10-16T03:00:00Z',
      },
      {
        eventSequence: 1,
        fromStatus: null,
        toStatus: 'AWAITING_CONFIRMATION',
        actor: 'SYSTEM',
        reason: 'DRAW_WON',
        createdAt: '2026-10-16T01:00:00Z',
      },
    ],
  },
} satisfies Meta<typeof OrderTimeline>

export default meta
type Story = StoryObj<typeof meta>

/** 번호 순으로 쌓고, 시스템 코드는 문구로·관리자 사유는 그대로 보인다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole('listitem')
    await expect(items[0]).toHaveTextContent('럭키드로우 당첨으로 생성')
    await expect(items[1]).toHaveTextContent('배송 준비를 시작합니다.')
  },
}

/** 이력이 없으면 그렇게 알린다 */
export const Empty: Story = {
  args: { events: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('이력이 없습니다.')).toBeVisible()
  },
}

import { expect } from 'storybook/test'

import { MypagePreorder } from './MypagePreorder'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MypagePreorder,
  tags: ['ai-generated'],
} satisfies Meta<typeof MypagePreorder>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    // 예약 건마다 마감이 다르므로 카운트다운과 결제 버튼도 건별로 있어야 한다.
    const actions = canvas.getAllByRole('button', { name: '결제하기' })
    await expect(actions).toHaveLength(2)
    for (const action of actions) await expect(action).toBeEnabled()

    const countdowns = canvas.getAllByText(/결제 마감까지 .*남았습니다/)
    await expect(countdowns).toHaveLength(2)
    // 두 건의 남은 시간이 서로 달라야 한다(건별 마감).
    await expect(countdowns[0].textContent).not.toBe(countdowns[1].textContent)
  },
}

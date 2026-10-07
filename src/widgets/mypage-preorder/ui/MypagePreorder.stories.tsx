import { expect } from 'storybook/test'

import { color } from '@shared/config/theme'

import { MypagePreorder } from './MypagePreorder'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MypagePreorder,
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
} satisfies Meta<typeof MypagePreorder>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    // 예약 건마다 마감이 다르므로 카운트다운과 확정 버튼도 건별로 있어야 한다.
    const actions = canvas.getAllByRole('button', { name: '구매 확정하기' })
    await expect(actions).toHaveLength(2)
    const countdowns = canvas.getAllByText(/^\d{2}:\d{2}:\d{2}$/)
    await expect(countdowns).toHaveLength(2)
    await expect(countdowns[0].textContent).not.toBe(countdowns[1].textContent)

    // 오픈 알림은 눌러서 끄고 켤 수 있다.
    const [firstAlert] = canvas.getAllByRole('button', { name: '알림 받는 중' })
    await userEvent.click(firstAlert)
    await expect(firstAlert).toHaveTextContent('알림 받기')
  },
}

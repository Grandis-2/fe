import { expect } from 'storybook/test'

import { Sparkline } from './Sparkline'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Sparkline,
  tags: ['ai-generated'],
  args: { label: '대기 인원 추이', values: [120, 340, 560, 410, 800, 640] },
  decorators: [
    (Story) => (
      <div style={{ width: 200 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sparkline>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: '대기 인원 추이' }),
    ).toBeVisible()
  },
}

/** 경고 상태는 빨간 선 */
export const Danger: Story = {
  args: { danger: true, values: [1, 1, 0.6, 0.6, 1] },
}

/** 값이 하나뿐이면 선을 그리지 않는다 */
export const NotEnough: Story = {
  args: { values: [10] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: '대기 인원 추이 없음' }),
    ).toBeInTheDocument()
  },
}

/** 값이 모두 같으면 가운데 수평선 */
export const Flat: Story = {
  args: { values: [5, 5, 5, 5] },
}

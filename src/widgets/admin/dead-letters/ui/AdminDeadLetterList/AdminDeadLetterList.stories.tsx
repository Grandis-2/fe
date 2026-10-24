import { expect } from 'storybook/test'

import { AdminDeadLetterList } from './AdminDeadLetterList'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminDeadLetterList,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminDeadLetterList>

export default meta
type Story = StoryObj<typeof meta>

/** 처음엔 처리 대기 탭이 열리고, 고른 게 없으면 선택 되돌리기 줄이 나오지 않는다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: /처리 대기/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      canvas.queryByRole('button', { name: /선택 되돌리기/ }),
    ).toBeNull()
  },
}

import { expect } from 'storybook/test'

import { AdminDeadLetterList } from './AdminDeadLetterList'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminDeadLetterList,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminDeadLetterList>

export default meta
type Story = StoryObj<typeof meta>

/** 처음엔 처리 대기만 거르고, 고른 게 없으면 일괄 되돌리기를 막는다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('처리 대기')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: /선택 되돌리기 0건/ }),
    ).toBeDisabled()
  },
}

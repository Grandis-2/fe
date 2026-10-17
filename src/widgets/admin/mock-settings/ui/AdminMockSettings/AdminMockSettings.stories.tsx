import { expect } from 'storybook/test'

import { AdminMockSettings } from './AdminMockSettings'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminMockSettings,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminMockSettings>

export default meta
type Story = StoryObj<typeof meta>

/** 공용 서버 경고가 맨 위에 있고, 키가 없으면 결함 걸기를 막는다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(/팀이 같이 쓰는 Mock 서버입니다/),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '결함 걸기' }),
    ).toBeDisabled()
  },
}

/** RESET을 정확히 입력해야 원장 지우기가 열린다 */
export const ResetGuard: Story = {
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: '원장 모두 지우기' })
    const input = canvas.getByLabelText('확인을 위해 RESET를 입력하세요')
    await userEvent.type(input, 'reset')
    await expect(button).toBeDisabled()
    await userEvent.clear(input)
    await userEvent.type(input, 'RESET')
    await expect(button).toBeEnabled()
  },
}

import { expect } from 'storybook/test'

import { LoadingScreen } from './LoadingScreen'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: LoadingScreen,
  tags: ['ai-generated'],
} satisfies Meta<typeof LoadingScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: '결제를 확인하고 있어요' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      '결제를 확인하고 있어요',
    )
    await expect(canvas.getByText(/진행 중이에요/)).toBeVisible()
  },
}

export const CustomDescription: Story = {
  args: {
    children: '카카오 로그인 처리 중이에요',
    description: '진행 중이에요. 곧 원래 화면으로 돌아가요.',
  },
}

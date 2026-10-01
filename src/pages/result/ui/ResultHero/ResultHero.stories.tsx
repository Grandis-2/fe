import { expect } from 'storybook/test'

import { ResultHero } from './ResultHero'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ResultHero,
  tags: ['ai-generated'],
} satisfies Meta<typeof ResultHero>

export default meta
type Story = StoryObj<typeof meta>

export const Preorder: Story = {
  args: {
    tone: 'success',
    icon: 'box_planet',
    title: '예약이 완료되었습니다.',
    description: '구매 내역은 마이페이지에서 확인하실 수 있습니다.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('예약이 완료되었습니다.')).toBeVisible()
  },
}

export const Paid: Story = {
  args: {
    tone: 'success',
    icon: 'sparkles',
    title: '구매가 완료되었습니다.',
    description: '구매 내역은 마이페이지에서 확인하실 수 있습니다.',
  },
}

export const Failed: Story = {
  args: {
    tone: 'failure',
    icon: 'info',
    title: '구매에 실패했습니다',
    description: '결제를 다시 시도해주세요.',
  },
}

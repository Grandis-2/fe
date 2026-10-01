import { expect } from 'storybook/test'

import { MypageAddress } from './MypageAddress'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MypageAddress,
  tags: ['ai-generated'],
} satisfies Meta<typeof MypageAddress>

export default meta
type Story = StoryObj<typeof meta>

// Storybook엔 API가 없어 배송지 조회가 실패한다 — 등록된 배송지가 없는 빈 상태가 보인다.
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText('등록된 배송지가 없습니다.'),
    ).toBeInTheDocument()
  },
}

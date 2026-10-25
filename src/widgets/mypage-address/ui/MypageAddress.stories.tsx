import { expect } from 'storybook/test'

import { MypageAddress } from './MypageAddress'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MypageAddress,
  tags: ['ai-generated'],
} satisfies Meta<typeof MypageAddress>

export default meta
type Story = StoryObj<typeof meta>

// Storybook엔 API가 없어 배송지 조회가 실패한다 — 실패를 '등록된 배송지 없음'으로 보이면 이미 있는 배송지를
// 또 등록하게 되므로 실패 안내가 보인다.
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText(
        '배송지를 불러오지 못했어요.',
        {},
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument()
  },
}

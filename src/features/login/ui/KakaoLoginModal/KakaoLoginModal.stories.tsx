import { expect } from 'storybook/test'

import { KakaoLoginModal } from './KakaoLoginModal'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: KakaoLoginModal,
  tags: ['ai-generated'],
} satisfies Meta<typeof KakaoLoginModal>

export default meta
type Story = StoryObj<typeof meta>

// 모달 껍데기 없이 내용만 렌더링한다 — 실제로는 useModalStore.open(<KakaoLoginModal />)로
// shared/ui/Modal 안에 들어간다. 카카오 버튼은 실제 네비게이션을 일으켜서 누르지 않는다.
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('로그인')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '카카오로 로그인' }),
    ).toBeVisible()
  },
}

import { expect, fn, spyOn } from 'storybook/test'

import { apiClient } from '@shared/api/client'

import { PreorderQueue } from './PreorderQueue'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PreorderQueue,
  tags: ['ai-generated'],
} satisfies Meta<typeof PreorderQueue>

export default meta
type Story = StoryObj<typeof meta>

// 열리자마자 대기열에 진입하고, 진입 응답이 0.5초 넘게 늦거나 다시 진입을 예약하면 모달이 뜬다(바로 입장이면
// 띄우지 않는다). Storybook엔 API가 없어 진입이 실패하는데, 실패가 얼마나 빨리 오느냐에 따라 모달이 뜨기도
// 안 뜨기도 해서 진입 응답을 멈춰 둔다 — 0.5초 뒤 순번 '-'로 모달이 뜬다. 실제 진행은 dev 서버(MSW)에서 본다.
// 닫으면 위에 QueuePill이 뜨고, 누르면 다시 열린다.
export const Default: Story = {
  args: {
    productId: '20000000-0000-4000-8000-000000000001',
    productName: '아이폰 18 Pro',
    onComplete: fn(),
    onFail: fn(),
    onLeave: fn(),
  },
  beforeEach: () => {
    const enter = spyOn(apiClient, 'requestWithHeaders').mockReturnValue(
      new Promise(() => {}),
    )
    return () => enter.mockRestore()
  },
  // '대기열 나가기'는 확인을 한 번 더 받고, '나가기'까지 눌러야 줄을 비운다(onLeave).
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(
      await canvas.findByRole(
        'button',
        { name: '대기열 나가기' },
        { timeout: 3000 },
      ),
    )
    await expect(args.onLeave).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: '나가기' }))
    await expect(args.onLeave).toHaveBeenCalledOnce()
  },
}

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

const args = {
  productId: '20000000-0000-4000-8000-000000000001',
  productName: '아이폰 18 Pro',
  onComplete: fn(),
  onFail: fn(),
  onLeave: fn(),
  onExisting: fn(),
}

// 열리자마자 대기열에 진입한다. Storybook엔 API가 없어 진입 응답을 흉내 낸다 — 진입은 줄을 세우고(WAITING),
// 순번 조회는 멈춰 둔다. 실제 진행은 dev 서버(MSW)에서 본다. 닫으면 위에 QueuePill이 뜨고, 누르면 다시 열린다.
export const Default: Story = {
  args,
  beforeEach: () => {
    const request = spyOn(apiClient, 'requestWithHeaders').mockImplementation(
      (_path, options) =>
        options?.method === 'POST'
          ? Promise.resolve({
              data: {
                status: 'WAITING',
                position: 131,
                etaSeconds: 240,
                queueToken: 'qt_story',
              },
              headers: { 'retry-after': '5' },
            } as never)
          : new Promise(() => {}),
    )
    return () => request.mockRestore()
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

// 진입 응답이 0.5초 넘게 없다 — 바로 입장일 수도 있어 대기열 모달은 띄우지 않고 '입장 확인 중'만 알린다.
export const Checking: Story = {
  args,
  beforeEach: () => {
    const request = spyOn(apiClient, 'requestWithHeaders').mockReturnValue(
      new Promise(() => {}),
    )
    return () => request.mockRestore()
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('status', {}, { timeout: 3000 }),
    ).toHaveTextContent('입장 확인 중…')
    await expect(canvas.queryByRole('dialog')).toBeNull()
  },
}

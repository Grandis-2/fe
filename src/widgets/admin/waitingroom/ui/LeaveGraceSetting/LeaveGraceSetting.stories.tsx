import { expect, fn } from 'storybook/test'

import { LeaveGraceSetting } from './LeaveGraceSetting'

import type { Meta, StoryObj } from '@storybook/react-vite'

const admission = {
  apply: fn(),
  confirm: fn(),
  isPending: false,
  error: null,
}

const meta = {
  component: LeaveGraceSetting,
  tags: ['ai-generated'],
  args: {
    setting: { value: 250, source: 'DEFAULT' },
    loading: false,
    admission,
  },
} satisfies Meta<typeof LeaveGraceSetting>

export default meta
type Story = StoryObj<typeof meta>

/** 기본값이 골라져 있고, 다른 값을 고르면 대가를 묻는 확인 창을 연다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByRole('button', { name: '4분 10초 · 기본' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByText(/조회가 4분 10초 끊기면/)).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '10분' }))
    await expect(args.admission.confirm).toHaveBeenCalledWith(
      '이탈 유예를 10분(으)로 바꿀까요?',
      expect.stringContaining('늘리면'),
      '바꾸기',
      expect.any(Function),
    )
  },
}

/** 늘려 둔 상태 — 대기 인원이 부풀어 보인다는 대가를 알린다 */
export const Extended: Story = {
  args: { setting: { value: 600, source: 'OPERATIONAL' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '10분' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByText(/늘려 둔 만큼/)).toBeVisible()
  },
}

/** 선택지에 없는 값(서버에 직접 정한 값)도 보인다 */
export const CustomValue: Story = {
  args: { setting: { value: 420, source: 'OPERATIONAL' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '7분' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

export const Loading: Story = { args: { loading: true, setting: undefined } }

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
    waiting: 1240,
    admission,
  },
} satisfies Meta<typeof LeaveGraceSetting>

export default meta
type Story = StoryObj<typeof meta>

/** 기본값이면 더 줄일 게 없어 막힌 칸이 없다. 늘리면 대가를 묻는 확인 창을 연다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByRole('button', { name: '4분 10초 · 기본' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByText(/조회가 4분 10초 끊기면/)).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '10분' }))
    await expect(args.admission.confirm).toHaveBeenCalledWith(
      '자리 지켜 주는 시간을 10분으로 늘릴까요?',
      expect.stringContaining('다시 줄일 수 없어요'),
      '늘리기',
      expect.any(Function),
    )
    await expect(canvas.queryByText(/줄일 수 없어요/)).toBeNull()
  },
}

/** 늘려 둔 상태에 줄이 있으면 — 짧은 칸을 막고 이유를 말한다. 늘리기는 된다 */
export const QueueBlocksLowering: Story = {
  args: { setting: { value: 900, source: 'OPERATIONAL' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '15분' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    for (const name of ['4분 10초 · 기본', '5분', '10분'])
      await expect(canvas.getByRole('button', { name })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: '30분' })).toBeEnabled()
    await expect(
      canvas.getByText('줄에 1,240명이 기다리는 동안은 줄일 수 없어요.'),
    ).toBeVisible()
    await expect(canvas.getByText(/늘려 둔 만큼/)).toBeVisible()
  },
}

/** 현황을 모르면 줄이 있다고 보고 막는다 */
export const UnknownQueueBlocksLowering: Story = {
  args: { setting: { value: 900, source: 'OPERATIONAL' }, waiting: null },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('대기열 현황을 확인할 수 없어 지금은 줄일 수 없어요.'),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: '5분' })).toBeDisabled()
  },
}

/** 줄이 비었으면 줄일 수 있다 — 빠지는 사람이 없다고 확인받는다 */
export const EmptyQueueLowering: Story = {
  args: { setting: { value: 900, source: 'OPERATIONAL' }, waiting: 0 },
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.queryByText(/줄일 수 없어요/)).toBeNull()
    await userEvent.click(
      canvas.getByRole('button', { name: '4분 10초 · 기본' }),
    )
    await expect(args.admission.confirm).toHaveBeenCalledWith(
      `자리 지켜 주는 시간을 4분${String.fromCharCode(0xa0)}10초로 줄일까요?`,
      expect.stringContaining('빠지는 사람은 없어요'),
      '줄이기',
      expect.any(Function),
    )
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

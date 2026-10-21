import { expect, fn, userEvent } from 'storybook/test'

import { RefreshStatus } from './RefreshStatus'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: RefreshStatus,
  tags: ['ai-generated'],
  args: {
    updatedAt: new Date('2026-10-15T05:32:05').getTime(),
    onRefresh: fn(),
    note: '10초마다 자동 갱신',
  },
} satisfies Meta<typeof RefreshStatus>

export default meta
type Story = StoryObj<typeof meta>

/** 받은 시각과 갱신 규칙을 한 줄로 보여주고, 끝의 버튼을 누르면 바로 다시 받는다 */
export const Default: Story = {
  play: async ({ canvas, args }) => {
    await expect(
      canvas.getByText('마지막 갱신 05:32:05 · 10초마다 자동 갱신'),
    ).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '지금 새로 고침' }),
    )
    await expect(args.onRefresh).toHaveBeenCalled()
  },
}

/** 아직 한 번도 못 받았으면 시각 대신 — */
export const NotYetLoaded: Story = {
  args: { updatedAt: 0, note: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('마지막 갱신 —')).toBeVisible()
  },
}

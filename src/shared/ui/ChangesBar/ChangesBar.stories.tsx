import { expect, fn } from 'storybook/test'

import { ChangesBar } from './ChangesBar'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ChangesBar,
  tags: ['ai-generated'],
  args: {
    changes: ['평균 800 → 1,200ms', '실패 2 → 5%'],
    note: '저장하면 버전 13',
    saveLabel: '팀에 적용',
    onSave: fn(),
    onRevert: fn(),
  },
} satisfies Meta<typeof ChangesBar>

export default meta
type Story = StoryObj<typeof meta>

/** 바뀐 곳을 모아 보이고 저장한다 */
export const Changed: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByText('바뀐 곳 2개 · 저장하면 버전 13'),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '팀에 적용' }))
    await expect(args.onSave).toHaveBeenCalled()
  },
}

/** 바뀐 곳이 없으면 저장·되돌리기를 막는다 */
export const Unchanged: Story = {
  args: { changes: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('바뀐 곳 없음')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '팀에 적용' }),
    ).toBeDisabled()
  },
}

/** 입력이 틀리면 까닭을 보이고 저장을 막는다 */
export const Problem: Story = {
  args: { problem: '0~60000 정수로 넣어 주세요.' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '팀에 적용' }),
    ).toBeDisabled()
  },
}

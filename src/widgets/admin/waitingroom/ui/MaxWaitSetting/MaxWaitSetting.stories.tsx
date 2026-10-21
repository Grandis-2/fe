import { expect, fn } from 'storybook/test'

import { MaxWaitSetting } from './MaxWaitSetting'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MaxWaitSetting,
  tags: ['ai-generated'],
  args: {
    setting: { value: null, source: 'DEFAULT' },
    loading: false,
    admission: { apply: fn(), confirm: fn(), isPending: false, error: null },
  },
} satisfies Meta<typeof MaxWaitSetting>

export default meta
type Story = StoryObj<typeof meta>

/** 꺼져 있으면 모두 받는다고만 말한다 */
export const Off: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('꺼짐')).toBeVisible()
    await expect(canvas.queryByRole('button')).toBeNull()
  },
}

/** 걸려 있으면 빨갛게 알리고 해제를 확인받는다 */
export const On: Story = {
  args: { setting: { value: 600, source: 'OPERATIONAL' } },
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText('켜짐 · 10분')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '제한 해제' }))
    await expect(args.admission.confirm).toHaveBeenCalled()
  },
}

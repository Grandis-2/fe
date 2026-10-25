import { expect, fn } from 'storybook/test'

import { RadioCards } from './RadioCards'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: RadioCards,
  tags: ['ai-generated'],
  args: {
    label: '실패 모양',
    items: [
      { value: 'fast', label: '빠르게', description: '바로 500으로 실패' },
      { value: 'slow', label: '느리게', description: '30초 붙잡다 끊김' },
    ],
    value: 'fast',
    onChange: fn(),
  },
} satisfies Meta<typeof RadioCards>

export default meta
type Story = StoryObj<typeof meta>

/** 카드 어디를 눌러도 고른다 — 설명 글자를 눌러도 된다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByRole('radio', { name: /빠르게/ })).toBeChecked()
    await userEvent.click(canvas.getByText('30초 붙잡다 끊김'))
    await expect(args.onChange).toHaveBeenCalledWith('slow')
  },
}

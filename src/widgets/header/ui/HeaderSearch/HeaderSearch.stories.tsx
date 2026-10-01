import { expect, fn } from 'storybook/test'

import { HeaderSearch } from './HeaderSearch'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: HeaderSearch,
  tags: ['ai-generated'],
} satisfies Meta<typeof HeaderSearch>

export default meta
type Story = StoryObj<typeof meta>

// 아이콘을 누르면 입력창으로 바뀌고, 입력 없이 Esc를 누르면 다시 아이콘으로 접힌다.
export const Default: Story = {
  args: { onSearchClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '검색' }))
    await expect(args.onSearchClick).toHaveBeenCalledOnce()
    await expect(canvas.getByRole('searchbox')).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await expect(
      canvas.getByRole('button', { name: '검색' }),
    ).toBeInTheDocument()
  },
}

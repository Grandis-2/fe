import { expect, fn } from 'storybook/test'

import { HeaderSearch } from './HeaderSearch'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: HeaderSearch,
  tags: ['ai-generated'],
} satisfies Meta<typeof HeaderSearch>

export default meta
type Story = StoryObj<typeof meta>

// 아이콘을 누르면 전체 화면 검색창이 열리고, 취소를 누르면 닫힌다.
export const Default: Story = {
  args: { onSearchClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '검색' }))
    await expect(args.onSearchClick).toHaveBeenCalledOnce()
    await expect(canvas.getByRole('searchbox')).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: '취소' }))
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

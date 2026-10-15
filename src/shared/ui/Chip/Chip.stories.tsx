import { expect, fn } from 'storybook/test'

import { Chip } from './Chip'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Chip,
  tags: ['ai-generated'],
  args: { children: '사전예약', onClick: fn() },
  // 사용자 페이지(마이페이지)는 늘 어둡다.
  parameters: { dark: true },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const chip = canvas.getByRole('button', { name: '사전예약' })
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(chip)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const Selected: Story = {
  args: { children: '전체', selected: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

export const WithCount: Story = {
  args: { children: '진행 중', count: 12, selected: true },
}

export const Removable: Story = {
  args: { children: '아이폰', onRemove: fn(), removeLabel: '아이폰 삭제' },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '아이폰 삭제' }))
    await expect(args.onRemove).toHaveBeenCalledOnce()
  },
}

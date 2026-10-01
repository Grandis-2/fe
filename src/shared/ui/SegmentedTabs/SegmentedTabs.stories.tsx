import { useState } from 'react'

import { expect, fn, userEvent } from 'storybook/test'

import {
  SegmentedTabs,
  type SegmentedTabItem,
  type SegmentedTabsProps,
} from './SegmentedTabs'

import type { Meta, StoryObj } from '@storybook/react-vite'

type Filter = 'all' | 'preorder' | 'normal'

const items: SegmentedTabItem<Filter>[] = [
  { value: 'all', label: '전체' },
  { value: 'preorder', label: '사전 예약' },
  { value: 'normal', label: '일반 판매' },
]

const meta = {
  component: SegmentedTabs,
  tags: ['ai-generated'],
} satisfies Meta<SegmentedTabsProps<Filter>>

export default meta
type Story = StoryObj<SegmentedTabsProps<Filter>>

export const Default: Story = {
  args: { items, value: 'all', onChange: fn() },
  play: async ({ canvas, args }) => {
    // 선택된 탭만 aria-pressed=true.
    await expect(canvas.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(canvas.getByRole('button', { name: '사전 예약' }))
    await expect(args.onChange).toHaveBeenCalledWith('preorder')
  },
}

export const Interactive: Story = {
  args: { items, value: 'all', onChange: fn() },
  render: (args) => {
    const [value, setValue] = useState<Filter>('all')
    return <SegmentedTabs {...args} value={value} onChange={setValue} />
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '일반 판매' }))
    await expect(
      canvas.getByRole('button', { name: '일반 판매' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  },
}

import { useState } from 'react'

import { expect, fn, userEvent } from 'storybook/test'

import { Calendar } from './Calendar'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Calendar,
  tags: ['ai-generated'],
  args: { onChange: fn() },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { value: new Date(2026, 8, 20) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('2026년 9월')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '2026년 9월 20일' }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

/** 아직 고른 날짜가 없으면 이번 달을 연다. */
export const Empty: Story = {
  args: { value: null },
  play: async ({ canvas, args }) => {
    const today = new Date()
    await expect(
      canvas.getByText(`${today.getFullYear()}년 ${today.getMonth() + 1}월`),
    ).toBeVisible()

    await userEvent.click(canvas.getAllByRole('button', { name: /일$/ })[10])
    await expect(args.onChange).toHaveBeenCalled()
  },
}

/** 화살표로 달을 넘기고, 고른 날짜는 그대로 유지된다. */
export const MonthNavigation: Story = {
  args: { value: new Date(2026, 8, 20) },
  render: (args) => {
    const [value, setValue] = useState<Date | null>(args.value ?? null)
    return <Calendar {...args} value={value} onChange={setValue} />
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '다음 달' }))
    await expect(canvas.getByText('2026년 10월')).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: '이전 달' }))
    await userEvent.click(canvas.getByRole('button', { name: '이전 달' }))
    await expect(canvas.getByText('2026년 8월')).toBeVisible()
  },
}

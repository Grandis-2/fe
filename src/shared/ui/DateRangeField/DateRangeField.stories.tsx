import { useState } from 'react'

import { expect } from 'storybook/test'

import { DateRangeField, type DateRange } from './DateRangeField'

import type { Meta, StoryObj } from '@storybook/react-vite'

function Controlled({
  start = '',
  end = '',
}: {
  start?: string
  end?: string
}) {
  const [value, setValue] = useState<DateRange>({ start, end })
  return <DateRangeField value={value} onChange={setValue} />
}

const meta = {
  component: Controlled,
  tags: ['ai-generated'],
} satisfies Meta<typeof Controlled>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toHaveTextContent(
      '기간을 선택해 주세요',
    )
  },
}

export const Filled: Story = {
  args: { start: '2026-09-20', end: '2026-09-24' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toHaveTextContent(
      '2026년 9월 20일 (일) ~ 2026년 9월 24일 (목)',
    )
  },
}

export const PickingRange: Story = {
  args: {},
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'))

    // 달력은 body로 포털되므로 화면 전체에서 찾는다.
    const findDay = (label: string) =>
      document.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!

    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    await userEvent.click(findDay(`${year}년 ${month}월 10일`))
    await expect(canvas.getByRole('button')).toHaveTextContent('종료일 선택')

    await userEvent.click(findDay(`${year}년 ${month}월 14일`))
    await expect(canvas.getByRole('button')).toHaveTextContent('~')
    // 구간이 완성되면 달력이 닫힌다.
    await expect(
      document.querySelector(`[aria-label="${year}년 ${month}월 14일"]`),
    ).toBeNull()
  },
}

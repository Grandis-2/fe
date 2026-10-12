import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { DeliveryDateField } from './DeliveryDateField'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: DeliveryDateField,
  tags: ['ai-generated'],
  args: { label: '예상 배송일', onChange: fn() },
} satisfies Meta<typeof DeliveryDateField>

export default meta
type Story = StoryObj<typeof meta>

// 달력은 표 카드가 잘라내지 않게 body로 포털된다 — 스토리 캔버스 밖이라 body에서 찾는다.
const popover = () => within(document.body)

/** 값이 없으면 '미정'으로 보인다. 버튼 이름에는 칸 이름이 함께 읽힌다. */
export const Undecided: Story = {
  args: { value: null },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '예상 배송일 미정' }),
    ).toBeVisible()
  },
}

export const Picked: Story = {
  args: { value: '2026-09-20' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', {
        name: '예상 배송일 2026년 9월 20일 (일)',
      }),
    ).toBeVisible()
  },
}

/** 달력에서 고른 날짜가 'YYYY-MM-DD'로 넘어가고 달력은 닫힌다. */
export const PicksDate: Story = {
  args: { value: '2026-09-01' },
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button')
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(
      await popover().findByRole('button', { name: '2026년 9월 20일' }),
    )
    await expect(args.onChange).toHaveBeenCalledWith('2026-09-20')
    await waitFor(() =>
      expect(trigger).toHaveAttribute('aria-expanded', 'false'),
    )
  },
}

/** 배송일은 비워 둘 수 있다 — '미정으로 두기'가 null을 넘긴다. */
export const ClearsToUndecided: Story = {
  args: { value: '2026-09-20' },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button'))
    await userEvent.click(
      await popover().findByRole('button', { name: '미정으로 두기' }),
    )
    await expect(args.onChange).toHaveBeenCalledWith(null)
  },
}

/** 폼 한 줄에 들어갈 때. 아이콘이 박스 밖으로 나가고 버튼은 하나만 남는다. */
export const FieldLayout: Story = {
  args: { value: '2026-09-20', layout: 'field' },
  play: async ({ canvas }) => {
    const buttons = canvas.getAllByRole('button')
    await expect(buttons).toHaveLength(1)
    await expect(buttons[0]).toHaveTextContent('2026년 9월 20일 (일)')
  },
}

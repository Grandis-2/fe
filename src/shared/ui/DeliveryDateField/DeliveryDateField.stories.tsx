import { expect, fn } from 'storybook/test'

import { DeliveryDateField } from './DeliveryDateField'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: DeliveryDateField,
  tags: ['ai-generated'],
  args: { onChange: fn() },
} satisfies Meta<typeof DeliveryDateField>

export default meta
type Story = StoryObj<typeof meta>

/** 값이 없으면 '미정'으로 보인다 — 배송일은 비워 둘 수 있다. */
export const Undecided: Story = {
  args: { value: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toHaveTextContent('미정')
  },
}

export const Picked: Story = {
  args: { value: '2026-09-20' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toHaveTextContent(
      '2026년 9월 20일 (일)',
    )
  },
}

/** 누르면 달력이 열린다. 표 카드가 잘라내지 않게 body로 포털된다. */
export const OpensCalendar: Story = {
  args: { value: null },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  },
}

/**
 * 폼 한 줄에 들어갈 때. 아이콘이 박스 밖으로 나가고 글자가 가운데로 온다 —
 * 같은 섹션의 다른 일시 입력칸과 높이·라운드를 맞추기 위해서다.
 * 누르는 건 박스 하나뿐이라 아이콘은 장식이다(버튼이 두 개면 읽는 쪽이 헷갈린다).
 */
export const FieldVariant: Story = {
  args: { value: '2026-09-20', layout: 'field' },
  play: async ({ canvas }) => {
    const buttons = canvas.getAllByRole('button')
    await expect(buttons).toHaveLength(1)
    await expect(buttons[0]).toHaveTextContent('2026년 9월 20일 (일)')
  },
}

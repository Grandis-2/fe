import { expect } from 'storybook/test'

import { OpsTaskCard } from './OpsTaskCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

// Tag는 widthOptions로 너비를 맞추려고 같은 글자를 aria-hidden ghost로 한 번 더 그린다.
// 눈에 보이는 쪽은 언제나 첫 번째다.

const meta = {
  component: OpsTaskCard,
  tags: ['ai-generated'],
  args: {
    level: 'urgent',
    title: '외부 등록 실패 860건 — 결제 단계로 못 넘어가고 있어요',
    action: { label: '예약 보기', to: '/admin/reservations' },
  },
} satisfies Meta<typeof OpsTaskCard>

export default meta
type Story = StoryObj<typeof meta>

/** 급한 정도를 글자로도 알리고, 처리할 화면으로 가는 링크를 단다 */
export const Urgent: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('긴급')[0]).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: '예약 보기' }),
    ).toHaveAttribute('href', '/admin/reservations')
  },
}

export const Todo: Story = {
  args: {
    level: 'todo',
    title: '배송 처리 대기 주문 37건',
    action: { label: '주문 처리', to: '/admin/orders' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('할 일')[0]).toBeVisible()
  },
}

/** 운영자가 화면에서 풀 수 없는 일은 링크 대신 '개발팀 문의'만 보인다 */
export const Handoff: Story = {
  args: {
    level: 'check',
    title: '상태 반영 실패 12건',
    action: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('개발팀 문의')).toBeVisible()
    await expect(canvas.queryByRole('link')).toBeNull()
  },
}

import { expect } from 'storybook/test'

import { OpsKpiCard } from './OpsKpiCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OpsKpiCard,
  tags: ['ai-generated'],
  args: {
    label: '대기 인원',
    to: '/admin/waitingroom',
    linkLabel: '대기열 관리',
    value: 18240,
    unit: '명',
    description: '맨 뒤 예상 대기 약 15분',
  },
} satisfies Meta<typeof OpsKpiCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link')).toHaveTextContent('18,240명')
  },
}

/** 처리 안 하면 결제로 못 넘어가는 숫자는 칠해서 보인다 */
export const Danger: Story = {
  args: {
    label: '외부 등록 실패',
    to: '/admin/reservations?status=REPROCESS_NEEDED',
    linkLabel: '재처리 →',
    value: 860,
    unit: '건',
    description: '결제로 못 넘어가요',
    tone: 'danger',
  },
}

/** 못 받았으면 0이 아니라 '—' */
export const Unknown: Story = {
  args: { value: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link')).toHaveTextContent('대기 인원')
    await expect(canvas.getByRole('link')).not.toHaveTextContent('0명')
  },
}

export const Loading: Story = {
  args: { loading: true },
}

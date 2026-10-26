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
    linkLabel: '재처리하기',
    value: 860,
    unit: '건',
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

/** 아직 값을 줄 수 없는 이유가 있으면 '—' 대신 그 문구를 보인다 */
export const Pending: Story = {
  args: {
    label: '외부 예약 대조',
    linkLabel: '대조하기',
    value: null,
    unit: '건',
    emptyText: '집계 준비 중',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link')).toHaveTextContent('집계 준비 중')
  },
}

export const Loading: Story = {
  args: { loading: true },
}

/** 실시간이 아닌 값은 언제 기준인지 숫자 아래에 적는다 */
export const WithCaption: Story = {
  args: {
    label: '외부 예약 대조',
    linkLabel: '대조하기',
    value: 3,
    unit: '건',
    caption: '3시간 전 검사',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link')).toHaveTextContent('3건')
    await expect(canvas.getByText('3시간 전 검사')).toBeVisible()
  },
}

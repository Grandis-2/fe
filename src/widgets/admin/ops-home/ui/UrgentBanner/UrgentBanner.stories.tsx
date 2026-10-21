import { expect } from 'storybook/test'

import { UrgentBanner } from './UrgentBanner'

import type { Meta, StoryObj } from '@storybook/react-vite'

const register = {
  key: 'register',
  label: '외부 등록 실패',
  count: 860,
  breakdown: ['아이폰 18 Pro 812', '갤럭시 Z 폴드8 48'],
  action: {
    label: '재처리하기',
    to: '/admin/reservations?status=REPROCESS_NEEDED',
  },
}

const meta = {
  component: UrgentBanner,
  tags: ['ai-generated'],
  args: { items: [register] },
} satisfies Meta<typeof UrgentBanner>

export default meta
type Story = StoryObj<typeof meta>

/** 처음 화면 — 경고 띠. 무엇이 막혔는지, 건수, 어느 사전예약인지, 처리 버튼 */
export const Single: Story = {
  play: async ({ canvas }) => {
    const banner = canvas.getByRole('region', { name: '긴급 할 일' })
    await expect(banner).toHaveTextContent('긴급 · 결제 막힘')
    await expect(banner).toHaveTextContent('외부 등록 실패 860건')
    await expect(canvas.getByText('아이폰 18 Pro 812')).toBeVisible()
    await expect(canvas.getByRole('link', { name: /재처리/ })).toHaveAttribute(
      'href',
      '/admin/reservations?status=REPROCESS_NEEDED',
    )
  },
}

/** 스크롤해서 위에 붙었을 때 — 얇은 한 줄 */
export const Compact: Story = {
  args: { compact: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('결제 막힘 · 외부 등록 실패 860건'),
    ).toBeVisible()
    await expect(canvas.queryByText('아이폰 18 Pro 812')).toBeNull()
  },
}

/** 여러 건이면 머리에 건수, 줄마다 버튼 */
export const Multiple: Story = {
  args: {
    items: [
      register,
      {
        key: 'other',
        label: '결제 승인 확인 멈춤',
        count: 32,
        action: { label: '확인', to: '/admin/orders' },
      },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/긴급 2건/)).toBeVisible()
    await expect(canvas.getAllByRole('link')).toHaveLength(2)
  },
}

/** 긴급한 일이 없으면 아무것도 그리지 않는다 */
export const None: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('region')).toBeNull()
  },
}

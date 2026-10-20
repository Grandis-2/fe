import { expect, fn } from 'storybook/test'

import { OpenPreorderCard } from './OpenPreorderCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const items = [
  {
    productId: 'p-iphone',
    name: '아이폰 18 Pro',
    waiting: 14020,
    credit: 12,
    cap: 20,
    wait: '약 19분',
    failures: 812,
    closesAt: '2026-10-22T09:00:00Z',
  },
  {
    productId: 'p-fold',
    name: '갤럭시 Z 폴드8',
    waiting: 3810,
    credit: 6,
    cap: 6,
    wait: '약 11분',
    failures: 48,
    closesAt: '2026-10-24T09:00:00Z',
  },
  {
    productId: 'p-watch',
    name: '갤럭시 워치 클래식',
    waiting: 410,
    credit: 2,
    cap: 10,
    wait: '약 3분',
    failures: 0,
    closesAt: '2026-10-26T09:00:00Z',
  },
]

const meta = {
  component: OpenPreorderCard,
  tags: ['ai-generated'],
  args: { items, selected: null, onSelect: fn() },
} satisfies Meta<typeof OpenPreorderCard>

export default meta
type Story = StoryObj<typeof meta>

/** 전체 — 사전예약마다 맨 뒤 대기를 크게. 누르면 그 사전예약을 고른다 */
export const All: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText('약 19분')).toBeVisible()
    await expect(canvas.getByText('정상')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: /갤럭시 Z 폴드8/ }),
    )
    await expect(args.onSelect).toHaveBeenCalledWith('p-fold')
  },
}

/** 하나를 골랐을 때 — 대기·입장 상한 사용과 바로 갈 곳 */
export const Selected: Story = {
  args: {
    selected: 'p-iphone',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: '아이폰 18 Pro' }),
    ).toBeVisible()
    await expect(canvas.getByText('맨 뒤 예상 대기')).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: '예약 현황' }),
    ).toHaveAttribute('href', '/admin/reservations?product=p-iphone')
  },
}

/** 상한을 다 쓰고 있으면 올리라고 안내한다 */
export const CapFull: Story = {
  args: {
    selected: 'p-fold',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/상한을 다 쓰고 있어요/)).toBeVisible()
  },
}

/** 상한이 크면 칸을 묶는다 — 상한 100이면 1칸 = 초당 5명 */
export const LargeCap: Story = {
  args: {
    selected: 'p-watch',
    items: items.map((item) =>
      item.productId === 'p-watch' ? { ...item, credit: 45, cap: 100 } : item,
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/1칸 = 초당 5명/)).toBeVisible()
  },
}

/** 입장이 멈추면 맨 위 상자가 위험 상태로, 입장 상한 조절이 맨 앞 */
export const Stopped: Story = {
  args: {
    selected: 'p-fold',
    items: items.map((item) =>
      item.productId === 'p-fold'
        ? { ...item, credit: 0, cap: 0, wait: '입장 멈춤' }
        : item,
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('입장 멈춤')).toBeVisible()
    const [first] = canvas.getAllByRole('link')
    await expect(first).toHaveTextContent('입장 상한 조절')
  },
}

export const Loading: Story = { args: { loading: true } }

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('지금 접수 중인 사전예약이 없어요.'),
    ).toBeVisible()
  },
}

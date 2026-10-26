import { expect, fn } from 'storybook/test'

import { QueuePill } from './QueuePill'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: QueuePill,
  tags: ['ai-generated'],
} satisfies Meta<typeof QueuePill>

export default meta
type Story = StoryObj<typeof meta>

const queue = {
  status: 'waiting',
  myOrder: 131,
  waitTime: '약 5분',
  moveIn: 5,
  held: false,
  checking: false,
  reopen: fn(),
  moveNow: fn(),
} as const

export const Waiting: Story = {
  args: { productName: '아이폰 18 Pro', queue },
}

// 내 앞 10명 이하 — 곧 화면이 넘어갈 수 있다고 미리 알린다.
export const Soon: Story = {
  args: { productName: '아이폰 18 Pro', queue: { ...queue, myOrder: 7 } },
}

// 모달을 닫아 둔 채 내 차례 — 이동까지 남은 초를 센다.
export const Mine: Story = {
  args: {
    productName: '아이폰 18 Pro',
    queue: { ...queue, status: 'mine', myOrder: 1, moveIn: 3 },
  },
}

// 결제 중에 차례가 왔다 — 옮기지 않고, 누르면 그때 예약 페이지로 간다.
export const HeldDuringPayment: Story = {
  args: {
    productName: '아이폰 18 Pro',
    queue: { ...queue, status: 'mine', myOrder: 1, held: true },
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.queryByText(/초 뒤 이동/)).toBeNull()
    await userEvent.click(canvas.getByRole('button'))
    await expect(args.queue.moveNow).toHaveBeenCalled()
    await expect(args.queue.reopen).not.toHaveBeenCalled()
  },
}

// 누른 뒤 0.5초가 지나도 서버 답이 없다 — 대기열을 띄우지 않고 확인 중임만 알린다.
export const Checking: Story = {
  args: { productName: '아이폰 18 Pro', queue: { ...queue, checking: true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('입장 확인 중…')
    await expect(canvas.queryByRole('button')).toBeNull()
  },
}

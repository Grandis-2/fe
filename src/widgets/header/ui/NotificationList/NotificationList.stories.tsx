import { expect, fn } from 'storybook/test'

import type { NotificationItem } from '@entities/notification'
import { color } from '@shared/config/theme'

import { NotificationList } from './NotificationList'

import type { Meta, StoryObj } from '@storybook/react-vite'

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString()

const notifications: NotificationItem[] = [
  {
    notificationId: 'n1',
    title: '사전예약 오픈',
    message: '알림 신청하신 아이폰 Duo 사전예약이 시작됐어요.',
    link: '/preorder',
    read: false,
    createdAt: minutesAgo(3),
  },
  {
    notificationId: 'n2',
    title: '배송 시작',
    message: '갤럭시 워치 주문이 출고됐어요.',
    link: '/mypage/history',
    read: false,
    createdAt: minutesAgo(60 * 5),
  },
  {
    notificationId: 'n3',
    title: '쿠폰 지급',
    message: '사전예약 알림 신청 쿠폰이 지급됐어요.',
    link: null,
    read: true,
    createdAt: minutesAgo(60 * 24 * 3),
  },
]

const meta = {
  component: NotificationList,
  tags: ['ai-generated'],
  args: {
    notifications,
    isPending: false,
    isError: false,
    onNavigate: fn(),
  },
  // 패널(HeaderNotification)과 같은 어두운 바탕·폭으로 본다.
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{ width: 380, background: color.background.base }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotificationList>

export default meta
type Story = StoryObj<typeof meta>

// 링크가 있는 알림만 눌러 이동하고, 안 읽은 알림 앞에는 '안 읽음' 점이 붙는다.
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const links = canvas.getAllByRole('link')
    await expect(links).toHaveLength(2)
    await expect(canvas.getAllByRole('img', { name: '안 읽음' })).toHaveLength(
      2,
    )
    await expect(canvas.getByText('쿠폰 지급')).toBeVisible()

    await userEvent.click(links[0])
    await expect(args.onNavigate).toHaveBeenCalledTimes(1)
  },
}

export const Empty: Story = {
  args: { notifications: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('새 알림이 없어요.')).toBeVisible()
    await expect(canvas.queryByRole('list')).toBeNull()
  },
}

export const Loading: Story = {
  args: { notifications: undefined, isPending: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('불러오는 중…')).toBeVisible()
  },
}

// 실패는 빈 목록과 다르게 보여야 한다 — 0건으로 대신하지 않는다.
export const LoadError: Story = {
  args: { notifications: undefined, isError: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('알림을 불러오지 못했어요.')).toBeVisible()
  },
}

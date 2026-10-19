import { expect, fn } from 'storybook/test'

import { OpenPreorderStrip } from './OpenPreorderStrip'

import type { Meta, StoryObj } from '@storybook/react-vite'

const NOW = Date.parse('2026-10-08T05:10:00Z')

const meta = {
  component: OpenPreorderStrip,
  tags: ['ai-generated'],
  args: {
    now: NOW,
    selected: 'p-iphone',
    onSelect: fn(),
    items: [
      {
        productId: 'p-iphone',
        name: '아이폰 18 Pro',
        health: 'failing',
        waiting: 837,
        wait: '약 1분',
        failures: 60,
        closesAt: '2026-10-08T06:30:00Z',
      },
      {
        productId: 'p-galaxy',
        name: '갤럭시 S27',
        health: 'ok',
        waiting: 0,
        wait: null,
        failures: 0,
        closesAt: '2026-10-08T08:15:00Z',
      },
    ],
  },
} satisfies Meta<typeof OpenPreorderStrip>

export default meta
type Story = StoryObj<typeof meta>

// Tag는 widthOptions로 너비를 맞추려고 같은 글자를 aria-hidden ghost로 한 번 더 그린다.
// 눈에 보이는 쪽은 언제나 첫 번째다.

/** 고른 사전예약이 표시되고, 사전예약마다 상태·대기·재처리 필요·마감까지 남은 시간을 보인다 */
export const Several: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.queryByRole('button', { name: '전체' })).toBeNull()
    const iphone = canvas.getByRole('button', { name: /아이폰 18 Pro/ })
    await expect(iphone).toHaveAttribute('aria-pressed', 'true')
    await expect(iphone).toHaveTextContent('대기 837명 · 예상 약 1분')
    await expect(iphone).toHaveTextContent('마감까지 1시간 20분')
    await expect(canvas.getAllByText('재처리 필요')[0]).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: /갤럭시 S27/ }))
    await expect(args.onSelect).toHaveBeenCalledWith('p-galaxy')
  },
}

/** 하나뿐이어도 같은 모양이다 */
export const Single: Story = {
  args: {
    items: [
      {
        productId: 'p-iphone',
        name: '아이폰 18 Pro',
        health: 'slow',
        waiting: 120,
        wait: '3초',
        failures: 0,
        closesAt: '2026-10-08T05:40:00Z',
      },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: '전체' })).toBeNull()
    await expect(canvas.getAllByText('처리 밀림')[0]).toBeVisible()
  },
}

/** 접수 중인 사전예약이 없으면 안내만 */
export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('지금 접수 중인 사전예약이 없어요.'),
    ).toBeVisible()
  },
}

/** allowAll이면 '전체'를 맨 앞에 두고, 고르지 않은 상태(null)가 전체다 */
export const WithAll: Story = {
  args: { allowAll: true, selected: null },
  play: async ({ canvas, args, userEvent }) => {
    const all = canvas.getByRole('button', { name: /전체/ })
    await expect(all).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: /아이폰 18 Pro/ }))
    await expect(args.onSelect).toHaveBeenCalledWith('p-iphone')
  },
}

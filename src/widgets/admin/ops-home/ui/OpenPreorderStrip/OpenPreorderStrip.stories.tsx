import { expect, fn } from 'storybook/test'

import { OpenPreorderStrip } from './OpenPreorderStrip'

import type { Meta, StoryObj } from '@storybook/react-vite'

const NOW = Date.parse('2026-10-08T05:10:00Z')

const meta = {
  component: OpenPreorderStrip,
  tags: ['ai-generated'],
  args: {
    now: NOW,
    selected: null,
    onSelect: fn(),
    items: [
      {
        productId: 'p-iphone',
        name: '아이폰 18 Pro',
        health: 'failing',
        waiting: 837,
        failures: 60,
        closesAt: '2026-10-08T06:30:00Z',
      },
      {
        productId: 'p-galaxy',
        name: '갤럭시 S27',
        health: 'ok',
        waiting: 0,
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

/** 둘 이상이면 '전체'가 있고, 사전예약마다 상태·대기·실패·마감까지 남은 시간을 보인다 */
export const Several: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const iphone = canvas.getByRole('button', { name: /아이폰 18 Pro/ })
    await expect(iphone).toHaveTextContent('대기 837명 · 재처리 필요 60건')
    await expect(iphone).toHaveTextContent('마감까지 1시간 20분')
    await expect(canvas.getAllByText('재처리 필요')[0]).toBeVisible()

    await userEvent.click(iphone)
    await expect(args.onSelect).toHaveBeenCalledWith('p-iphone')
  },
}

/** 고른 걸 다시 누르면 전체로 돌아간다 */
export const Selected: Story = {
  args: { selected: 'p-iphone' },
  play: async ({ canvas, args, userEvent }) => {
    const iphone = canvas.getByRole('button', { name: /아이폰 18 Pro/ })
    await expect(iphone).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(iphone)
    await expect(args.onSelect).toHaveBeenCalledWith(null)
  },
}

/** 하나뿐이면 '전체'를 두지 않는다 */
export const Single: Story = {
  args: {
    items: [
      {
        productId: 'p-iphone',
        name: '아이폰 18 Pro',
        health: 'slow',
        waiting: 120,
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

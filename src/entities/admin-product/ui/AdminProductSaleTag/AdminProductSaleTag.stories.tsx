import { expect } from 'storybook/test'

import { AdminProductSaleTag } from './AdminProductSaleTag'

import type { Meta, StoryObj } from '@storybook/react-vite'

// Tag는 widthOptions로 너비를 맞추려고 같은 글자를 aria-hidden ghost로 한 번 더 그린다.
// 눈에 보이는 쪽은 언제나 첫 번째다.
const visibleLabel = (
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
  text: string,
) => canvas.getAllByText(text)[0]

const meta = {
  component: AdminProductSaleTag,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminProductSaleTag>

export default meta
type Story = StoryObj<typeof meta>

/** 일반 상품은 판매 상태만 있다 */
export const Active: Story = {
  args: { status: 'ACTIVE' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '판매 중')).toBeVisible()
    await expect(canvas.queryByText('접수 중')).toBeNull()
  },
}

export const Paused: Story = {
  args: { status: 'PAUSED' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '판매 중지')).toBeVisible()
  },
}

/** 사전예약은 판매 중이면 접수 단계만 보인다 — '판매 중'이 오픈한 것처럼 읽히지 않게 */
export const PreorderOpen: Story = {
  args: { status: 'ACTIVE', stage: 'OPEN' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '접수 중')).toBeVisible()
    await expect(canvas.queryByText('판매 중')).toBeNull()
  },
}

export const PreorderBeforeOpen: Story = {
  args: { status: 'ACTIVE', stage: 'BEFORE_OPEN' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '오픈 전')).toBeVisible()
    await expect(canvas.queryByText('판매 중')).toBeNull()
  },
}

/** 판매 중지(회차 취소)는 접수 단계와 같이 보인다 — 놓치면 안 되는 상태다 */
export const PreorderPaused: Story = {
  args: { status: 'PAUSED', stage: 'BEFORE_OPEN' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '판매 중지')).toBeVisible()
    await expect(visibleLabel(canvas, '오픈 전')).toBeVisible()
  },
}

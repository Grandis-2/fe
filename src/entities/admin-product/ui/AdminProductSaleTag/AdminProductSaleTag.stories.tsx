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

/** 사전예약은 접수 단계가 판매 상태 뒤에 같이 선다 */
export const PreorderOpen: Story = {
  args: { status: 'ACTIVE', stage: 'OPEN' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '판매 중')).toBeVisible()
    await expect(visibleLabel(canvas, '접수 중')).toBeVisible()
  },
}

/** 접수가 마감돼도 판매 상태는 그대로다 — 두 축이 어긋난 경우를 가리지 않는다 */
export const PreorderClosedButActive: Story = {
  args: { status: 'ACTIVE', stage: 'CLOSED' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '판매 중')).toBeVisible()
    await expect(visibleLabel(canvas, '접수 마감')).toBeVisible()
  },
}

export const PreorderBeforeOpen: Story = {
  args: { status: 'ACTIVE', stage: 'BEFORE_OPEN' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '오픈 전')).toBeVisible()
  },
}

/** 상세 화면은 아직 판매 상태를 모른다 — 접수 단계만 보여준다 */
export const StageOnly: Story = {
  args: { stage: 'OPEN' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '접수 중')).toBeVisible()
    await expect(canvas.queryByText('판매 중')).toBeNull()
  },
}

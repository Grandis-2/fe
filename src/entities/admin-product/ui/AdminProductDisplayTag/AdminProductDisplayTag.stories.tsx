import { expect } from 'storybook/test'

import { AdminProductDisplayTag } from './AdminProductDisplayTag'

import type { Meta, StoryObj } from '@storybook/react-vite'

// Tag는 widthOptions로 너비를 맞추려고 같은 글자를 aria-hidden ghost로 한 번 더 그린다.
// 눈에 보이는 쪽은 언제나 첫 번째다.
const visibleLabel = (
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
  text: string,
) => canvas.getAllByText(text)[0]

const meta = {
  component: AdminProductDisplayTag,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminProductDisplayTag>

export default meta
type Story = StoryObj<typeof meta>

/** 지금 구매자에게 보이는 중 — 브랜드 색이 채워진다 */
export const Published: Story = {
  args: { status: 'PUBLISHED' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '게시중')).toBeVisible()
  },
}

/** 냈다가 내림 — 같은 색이지만 테두리만 남는다 */
export const Hidden: Story = {
  args: { status: 'HIDDEN' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '숨김')).toBeVisible()
  },
}

/** 아직 한 번도 낸 적 없음 — 브랜드 색을 줄 자리가 아니라 회색이다 */
export const Draft: Story = {
  args: { status: 'DRAFT' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '초안')).toBeVisible()
  },
}

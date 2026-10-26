import { expect, fn } from 'storybook/test'

import { SettingChangeLog } from './SettingChangeLog'

import type { Meta, StoryObj } from '@storybook/react-vite'

const changes = [
  {
    at: '2026-10-08T05:12:30.481Z',
    by: 'admin',
    kind: 'GLOBAL_CREDIT' as const,
    productId: null,
    from: 300,
    to: 400,
    confirmed: true,
  },
  {
    at: '2026-10-08T05:02:00.000Z',
    by: 'admin',
    kind: 'PRODUCT_CREDIT' as const,
    productId: 'p-iphone',
    from: null,
    to: 80,
    confirmed: false,
  },
  {
    at: '2026-10-08T04:40:00.000Z',
    by: 'admin',
    kind: 'LEAVE_GRACE' as const,
    productId: null,
    from: 600,
    to: null,
    confirmed: false,
  },
]

const meta = {
  component: SettingChangeLog,
  tags: ['ai-generated'],
  args: {
    changes,
    loading: false,
    failed: false,
    hasMore: false,
    loadingMore: false,
    onLoadMore: fn(),
    nameOf: (productId: string) =>
      productId === 'p-iphone' ? '아이폰 18 Pro' : productId,
  },
} satisfies Meta<typeof SettingChangeLog>

export default meta
type Story = StoryObj<typeof meta>

/** 무엇을 얼마에서 얼마로 — 기본값으로 되돌린 건 '기본값', 권장 위로 올린 건 표시가 붙는다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole('listitem')
    await expect(items[0]).toHaveTextContent('전역 입장 속도')
    await expect(items[0]).toHaveTextContent('300명/초 → 400명/초')
    await expect(items[0]).toHaveTextContent('권장 상한 위')
    await expect(items[1]).toHaveTextContent('아이폰 18 Pro 입장 상한')
    await expect(items[1]).toHaveTextContent('기본값 → 80명/초')
    await expect(items[2]).toHaveTextContent('600초 → 기본값')
  },
}

/** 다음 쪽이 있으면 더 보기 */
export const HasMore: Story = {
  args: { hasMore: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '더 보기' }))
    await expect(args.onLoadMore).toHaveBeenCalled()
  },
}

/** 바꾼 적이 없으면 그렇게 말한다 */
export const Empty: Story = {
  args: { changes: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('최근 30일 동안 바꾼 값이 없어요.'),
    ).toBeVisible()
  },
}

/** 못 받았으면 '기록 없음'이 아니라 실패라고 말한다 */
export const Failed: Story = {
  args: { changes: undefined, failed: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('변경 기록을 불러오지 못했어요.'),
    ).toBeVisible()
  },
}

export const Loading: Story = {
  args: { changes: undefined, loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('list')).toBeNull()
  },
}

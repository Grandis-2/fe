import { expect, fn } from 'storybook/test'

import { PromotionProductLinker } from './PromotionProductLinker'

import type { Meta, StoryObj } from '@storybook/react-vite'

// 2026-10-22 14:00 로컬
const now = new Date(2026, 9, 22, 14).getTime()

const products = [
  {
    productId: 'p-1',
    name: 'NOVA 1',
    saleMode: 'PREORDER' as const,
    opensAt: new Date(2026, 9, 20, 10).toISOString(),
    openAtLabel: '10.20 10:00 오픈',
    colors: ['블랙', '실버'],
    storages: ['256GB', '512GB'],
  },
  {
    productId: 'p-2',
    name: 'NOVA 2',
    saleMode: 'PREORDER' as const,
    opensAt: new Date(2026, 10, 7, 10).toISOString(),
    openAtLabel: '11.07 10:00 오픈',
    colors: [],
    storages: [],
  },
  {
    productId: 'p-3',
    name: 'NOVA 1 케이스',
    saleMode: 'IN_STOCK' as const,
    opensAt: null,
    openAtLabel: '일반 상품으로 바뀜 — 고객에겐 바로 구매 카드로 보여요',
    colors: [],
    storages: [],
  },
]

const meta = {
  component: PromotionProductLinker,
  tags: ['ai-generated'],
  args: {
    products,
    value: [],
    onChange: fn(),
    onAddProduct: fn(),
    now,
  },
} satisfies Meta<typeof PromotionProductLinker>

export default meta
type Story = StoryObj<typeof meta>

/** 연결한 게 없으면 안내만 — '사전예약 상품 연결'을 눌러 후보를 펼쳐 고른다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText('연결한 상품이 없습니다.')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '사전예약 상품 연결' }),
    )
    await userEvent.click(canvas.getByRole('button', { name: /NOVA 2/ }))
    await expect(args.onChange).toHaveBeenCalledWith(['p-2'])
  },
}

/** 고른 상품은 단계 태그와 함께 순서대로 보이고, 새로 연결한 줄을 표시한다 */
export const Linked: Story = {
  args: { value: ['p-1', 'p-3', 'p-2'], saved: ['p-1', 'p-3'] },
  play: async ({ canvas, args, userEvent }) => {
    // Tag가 너비를 맞추려 깐 숨은 문구는 빼고 찾는다.
    const visible = { ignore: '[aria-hidden="true"], script, style' }
    await expect(canvas.getByText('오픈 후', visible)).toBeVisible()
    await expect(canvas.getByText('오픈 전', visible)).toBeVisible()
    await expect(canvas.getByText('일반 상품', visible)).toBeVisible()
    await expect(
      canvas.getByText(/새로 연결 — 저장하면 반영돼요/),
    ).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: 'NOVA 1 케이스 연결 빼기' }),
    )
    await expect(args.onChange).toHaveBeenCalledWith(['p-1', 'p-2'])
  },
}

/** 줄에 포커스하고 ↓를 누르면 한 칸 내려간다(끌기를 못 쓰는 사용자) */
export const KeyboardReorder: Story = {
  args: { value: ['p-1', 'p-2'] },
  play: async ({ canvas, args, userEvent }) => {
    canvas.getByLabelText(/1번째 NOVA 1/).focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(args.onChange).toHaveBeenCalledWith(['p-2', 'p-1'])
  },
}

/** 후보가 없으면 펼쳐도 안내만 남고, '새 상품 등록'으로 보낸다 */
export const NoCandidates: Story = {
  args: { products: [] },
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '사전예약 상품 연결' }),
    )
    await expect(
      canvas.getByText('더 연결할 수 있는 사전예약 상품이 없습니다.'),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '새 상품 등록' }))
    await expect(args.onAddProduct).toHaveBeenCalled()
  },
}

/** 상품을 받는 중엔 '상품 없음' 대신 줄 모양을 먼저 깐다 */
export const Loading: Story = {
  args: { products: [], loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await expect(
      canvas.queryByText('연결한 상품이 없습니다.'),
    ).not.toBeInTheDocument()
  },
}

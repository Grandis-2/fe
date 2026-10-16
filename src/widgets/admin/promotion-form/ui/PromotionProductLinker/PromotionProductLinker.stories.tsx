import { expect, fn } from 'storybook/test'

import { PromotionProductLinker } from './PromotionProductLinker'

import type { Meta, StoryObj } from '@storybook/react-vite'

const products = [
  {
    productId: 'p-1',
    name: 'NOVA 1',
    openAtLabel: '9/20 12:00 오픈',
    colors: ['블랙', '실버'],
    storages: ['256GB', '512GB'],
  },
  {
    productId: 'p-2',
    name: 'NOVA 1 케이스',
    openAtLabel: '9/21 12:00 오픈',
    colors: [],
    storages: [],
  },
]

const meta = {
  component: PromotionProductLinker,
  tags: ['ai-generated'],
  args: { products, value: [], onChange: fn(), onAddProduct: fn() },
} satisfies Meta<typeof PromotionProductLinker>

export default meta
type Story = StoryObj<typeof meta>

/** 카드를 누르면 그 상품이 더해진다. 옵션이 없는 상품은 옵션 줄을 숨긴다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText('선택한 상품이 없습니다')).toBeVisible()
    await expect(canvas.getAllByText('색상')).toHaveLength(1)
    await userEvent.click(canvas.getAllByRole('button', { pressed: false })[0])
    await expect(args.onChange).toHaveBeenCalledWith(['p-1'])
  },
}

/** 고른 상품을 다시 누르면 빠진다 */
export const Selected: Story = {
  args: { value: ['p-1'] },
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText('1개 상품 선택됨')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { pressed: true }))
    await expect(args.onChange).toHaveBeenCalledWith([])
  },
}

/** 사전예약 상품이 없으면 안내와 등록 버튼만 남는다 */
export const Empty: Story = {
  args: { products: [] },
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByText('사전예약으로 등록된 상품이 없습니다.'),
    ).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '추가 상품 등록하기' }),
    )
    await expect(args.onAddProduct).toHaveBeenCalled()
  },
}

/** 상품을 받는 중엔 '상품 없음' 대신 카드 모양을 먼저 깐다 */
export const Loading: Story = {
  args: { products: [], loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await expect(
      canvas.queryByText('사전예약으로 등록된 상품이 없습니다.'),
    ).not.toBeInTheDocument()
  },
}

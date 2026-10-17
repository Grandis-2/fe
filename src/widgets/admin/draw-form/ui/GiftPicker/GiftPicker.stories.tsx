import { expect, fn } from 'storybook/test'

import { GiftPicker } from './GiftPicker'

import type { Meta, StoryObj } from '@storybook/react-vite'

const products = [
  { productId: 'p-1', name: '아이폰 18' },
  { productId: 'p-2', name: '에어팟 프로 3' },
]

const options = [
  { optionId: 'o-1', label: '블랙 / 256GB', available: 120 },
  { optionId: 'o-2', label: '실버 / 512GB', available: 8 },
]

const meta = {
  component: GiftPicker,
  tags: ['ai-generated'],
  args: {
    products,
    options: undefined,
    productId: '',
    optionId: '',
    onChange: fn(),
    onAddProduct: fn(),
  },
} satisfies Meta<typeof GiftPicker>

export default meta
type Story = StoryObj<typeof meta>

/** 상품을 고르면 옵션은 다시 고르게 비운다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText('상품을 먼저 골라 주세요')).toBeVisible()
    await userEvent.click(canvas.getByText('상품을 골라 주세요'))
    await userEvent.click(canvas.getByText('에어팟 프로 3'))
    await expect(args.onChange).toHaveBeenCalledWith({
      productId: 'p-2',
      optionId: '',
    })
  },
}

/** 옵션마다 가용 재고를 같이 보여주고, 고르면 확보 안내가 나온다 */
export const Selected: Story = {
  args: { productId: 'p-1', options, optionId: 'o-1' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/가용 재고 120개/)).toBeVisible()
  },
}

/** 재고를 등록한 판매 중 옵션이 없으면 그렇게 알린다 */
export const NoOptions: Story = {
  args: { productId: 'p-1', options: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('재고를 등록한 판매 중 옵션이 없습니다'),
    ).toBeVisible()
  },
}

/** 칸 오류는 아래에 붙는다 */
export const WithError: Story = {
  args: { error: '증정품 상품과 옵션을 골라 주세요.' },
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByText('증정품 상품과 옵션을 골라 주세요.'),
    ).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '증정품 상품 등록하기' }),
    )
    await expect(args.onAddProduct).toHaveBeenCalled()
  },
}

/** 후보 상품을 받는 중엔 칸 자리를 막대로 깐다 */
export const Loading: Story = {
  args: { products: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('상품을 골라 주세요')).toBeNull()
  },
}

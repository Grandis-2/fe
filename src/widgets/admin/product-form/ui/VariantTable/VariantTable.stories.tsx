import { expect, fn } from 'storybook/test'

import { VariantTable } from './VariantTable'

import type { Meta, StoryObj } from '@storybook/react-vite'

const colors = [
  { id: 'c-1', name: '블랙', hex: '#111111', noColor: false, images: [] },
]
const optionGroups = [
  {
    id: 'g-1',
    name: '용량',
    values: [
      { id: 'v-1', label: '256GB', extraPrice: 0 },
      { id: 'v-2', label: '512GB', extraPrice: 200000 },
    ],
  },
]
const variants = [
  {
    key: '블랙|256GB',
    colorName: '블랙',
    optionLabels: ['256GB'],
    price: 1290000,
  },
  {
    key: '블랙|512GB',
    colorName: '블랙',
    optionLabels: ['512GB'],
    price: 1490000,
  },
]

const meta = {
  component: VariantTable,
  tags: ['ai-generated'],
  args: {
    variants,
    colors,
    optionGroups,
    quantities: { '블랙|256GB': 10 },
    onQuantityChange: fn(),
  },
} satisfies Meta<typeof VariantTable>

export default meta
type Story = StoryObj<typeof meta>

/** 일반 판매 — 조합마다 수량 칸이 있다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getAllByRole('columnheader', { name: '수량' }),
    ).toHaveLength(1)
    await expect(canvas.getAllByText('블랙')).toHaveLength(2)
  },
}

/** 사전예약 — 등록 때 받는 수량은 1차 배송 물량이다 */
export const Preorder: Story = {
  args: { isPreorder: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('columnheader', { name: '1차 배송 수량' }),
    ).toBeVisible()
  },
}

/** 등록 화면에서 판매를 끈 조합은 수량을 받지 않는다 */
export const Paused: Story = {
  args: {
    pausedKeys: ['블랙|512GB'],
    excludeOnPause: true,
    onPausedChange: fn(),
  },
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByLabelText('블랙 256GB 판매'))
    await expect(args.onPausedChange).toHaveBeenCalledWith('블랙|256GB', true)
  },
}

/** 사전예약 수정 — 수량 칸을 숨긴다(배송 구간 설정에서 고친다) */
export const HideQuantity: Story = {
  args: { hideQuantity: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('columnheader', { name: '수량' }),
    ).not.toBeInTheDocument()
  },
}

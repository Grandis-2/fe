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
    onQuantitiesChange: fn(),
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
    // 색상은 컬럼이 아니라 묶음 머리줄에 한 번만 나온다.
    await expect(canvas.getAllByText('블랙')).toHaveLength(1)
    await expect(canvas.getByText(/2개 조합 · 수량 합계 10/)).toBeVisible()
    await expect(canvas.getByText('수량 0인 조합 1개')).toBeVisible()
  },
}

/** 일괄 입력 — 한 번에 모든 조합의 수량을 채운다 */
export const BulkQuantity: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('수량 일괄 입력'), '30')
    await userEvent.click(canvas.getByRole('button', { name: '전체에 적용' }))
    await expect(args.onQuantitiesChange).toHaveBeenCalledWith({
      '블랙|256GB': 30,
      '블랙|512GB': 30,
    })
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
    await expect(args.onPausedChange).toHaveBeenCalledWith(['블랙|256GB'], true)

    // 끈 조합은 만들지 않으니 이 색상 일괄 적용에서도 빠진다.
    await userEvent.type(canvas.getByLabelText('블랙 수량'), '5')
    await userEvent.click(
      canvas.getByRole('button', { name: '이 색상에 적용' }),
    )
    await expect(args.onQuantitiesChange).toHaveBeenCalledWith({
      '블랙|256GB': 5,
    })
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

const manyColors = [
  { id: 'c-1', name: '블랙', hex: '#111111', noColor: false, images: [] },
  { id: 'c-2', name: '실버', hex: '#D9D9DC', noColor: false, images: [] },
  { id: 'c-3', name: '골드', hex: '#E8D3B0', noColor: false, images: [] },
]

/** 여러 색상 — 색상별로 접히고 첫 색상만 펼쳐진다 */
export const ManyColors: Story = {
  args: {
    colors: manyColors,
    variants: manyColors.flatMap(({ name }) =>
      variants.map((variant) => ({
        ...variant,
        key: `${name}|${variant.optionLabels[0]}`,
        colorName: name,
      })),
    ),
    quantities: { '블랙|256GB': 10, '블랙|512GB': 10, '실버|256GB': 5 },
    pausedKeys: [],
    onPausedChange: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('table')).toHaveLength(3)
    await expect(canvas.getByText('수량 0인 조합 2개')).toBeVisible()
  },
}

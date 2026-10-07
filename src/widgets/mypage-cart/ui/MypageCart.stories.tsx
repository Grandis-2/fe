import { expect } from 'storybook/test'

import { MypageCart } from './MypageCart'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MypageCart,
  tags: ['ai-generated'],
} satisfies Meta<typeof MypageCart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('맥북 프로 14')[0]).toBeInTheDocument()
    await expect(canvas.getByText('0개')).toBeInTheDocument()
  },
}

export const SelectAll: Story = {
  play: async ({ canvas, userEvent }) => {
    // 목업 상품 이름이 반복되므로 순서로 찾는다 — 첫 번째가 전체 선택 체크박스다.
    const [selectAll, first, second] = canvas.getAllByRole('checkbox')

    await userEvent.click(selectAll)
    await expect(first).toBeChecked()
    await expect(second).toBeChecked()
    await expect(canvas.getByText('50개')).toBeInTheDocument()

    // 리모컨 합계는 선택한 상품의 (단가 x 수량) 합이다.
    // 목업 5종(2,390,000 + 1,690,000 + 1,890,000 + 590,000 + 359,000)을 10번 돌린 값 —
    // MypageCart의 products를 손대면 이 숫자도 다시 계산해야 한다.
    await expect(canvas.getAllByText('69,190,000원')[0]).toBeVisible()

    // 하나라도 해제하면 전체 선택도 풀린다.
    await userEvent.click(first)
    await expect(selectAll).not.toBeChecked()

    // 남은 하나를 다시 채우면 전체 선택이 자동으로 켜진다.
    await userEvent.click(first)
    await expect(selectAll).toBeChecked()

    await userEvent.click(selectAll)
    await expect(first).not.toBeChecked()
    await expect(second).not.toBeChecked()
    await expect(canvas.getAllByText('0원')[0]).toBeVisible()
  },
}

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
    await expect(canvas.getAllByText('아이폰 18 Pro')[0]).toBeInTheDocument()
    await expect(canvas.getByText('0/50')).toBeInTheDocument()
  },
}

export const SelectAll: Story = {
  play: async ({ canvas, userEvent }) => {
    // 목업 상품 이름이 반복되므로 순서로 찾는다 — 첫 번째가 전체 선택 체크박스다.
    const [selectAll, first, second] = canvas.getAllByRole('checkbox')

    await userEvent.click(selectAll)
    await expect(first).toBeChecked()
    await expect(second).toBeChecked()
    await expect(canvas.getByText('50/50')).toBeInTheDocument()

    // 리모컨 합계는 선택한 상품의 (단가 x 수량) 합이다.
    await expect(canvas.getAllByText('59,071,000원')[0]).toBeVisible()

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

import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { ActionMenu } from './ActionMenu'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ActionMenu,
  tags: ['ai-generated'],
  args: {
    label: '상품 관리 메뉴',
    items: [
      { label: '숨김으로 전환하기', onSelect: fn() },
      { label: '판매 중지하기', onSelect: fn(), danger: true },
    ],
  },
} satisfies Meta<typeof ActionMenu>

export default meta
type Story = StoryObj<typeof meta>

/** 누르면 열리고, 항목을 고르면 동작이 실행되고 닫힌다 */
export const SelectsItem: Story = {
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: '상품 관리 메뉴' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(trigger)
    const menu = canvas.getByRole('menu')
    await userEvent.click(
      within(menu).getByRole('menuitem', { name: '숨김으로 전환하기' }),
    )

    await expect(args.items[0].onSelect).toHaveBeenCalled()
    await expect(canvas.queryByRole('menu')).toBeNull()
    await expect(trigger).toHaveFocus()
  },
}

/** 키보드: 아래 키로 열면 첫 항목, 위/아래로 옮기고 Esc로 닫으면 ⋮로 돌아온다 */
export const Keyboard: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: '상품 관리 메뉴' })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    const items = canvas.getAllByRole('menuitem')
    await expect(items[0]).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    await expect(items[1]).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(items[0]).toHaveFocus()

    await userEvent.keyboard('{Escape}')
    await expect(canvas.queryByRole('menu')).toBeNull()
    await expect(trigger).toHaveFocus()
  },
}

/** 막힌 항목은 이유를 보여주고, 눌러도 실행되지 않는다 */
export const DisabledItem: Story = {
  args: {
    items: [
      {
        label: '판매 중지하기',
        onSelect: fn(),
        disabledReason: '오픈 3분 전부터 오픈까지는 바꿀 수 없습니다.',
      },
    ],
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '상품 관리 메뉴' }),
    )
    const item = canvas.getByRole('menuitem', { name: /판매 중지하기/ })
    await expect(item).toHaveAttribute('aria-disabled', 'true')
    // 메뉴는 살짝 페이드인한다 — 다 나타난 뒤에 본다.
    await waitFor(() =>
      expect(canvas.getByText(/오픈 3분 전부터/)).toBeVisible(),
    )

    await userEvent.click(item)
    await expect(args.items[0].onSelect).not.toHaveBeenCalled()
    await expect(canvas.getByRole('menu')).toBeInTheDocument()
  },
}

/** 바깥을 누르면 닫힌다 */
export const ClosesOnOutsideClick: Story = {
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '상품 관리 메뉴' }),
    )
    await expect(canvas.getByRole('menu')).toBeInTheDocument()
    await userEvent.click(canvasElement.ownerDocument.body)
    await expect(canvas.queryByRole('menu')).toBeNull()
  },
}

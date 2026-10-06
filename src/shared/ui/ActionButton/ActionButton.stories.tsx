import { ActionButton } from './ActionButton'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ActionButton,
  tags: ['ai-generated'],
  parameters: { backgrounds: { default: 'dark' } },
} satisfies Meta<typeof ActionButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { children: '결제하기', style: { width: 240 } },
}

export const PrimaryMdWithPrice: Story = {
  args: { size: 'md', children: '2,151,000원 결제하기' },
}

export const Cart: Story = {
  args: { variant: 'cart', children: '장바구니', style: { width: 160 } },
}

export const CartAdded: Story = {
  args: { ...Cart.args, added: true, children: '담았어요' },
}

export const CartIconOnly: Story = {
  args: {
    variant: 'cart',
    size: 'md',
    iconOnly: true,
    'aria-label': '장바구니',
  },
}

// 장바구니 : 결제하기 = 1 : 1.6
export const Group: Story = {
  render: () => (
    <div
      style={{
        width: 364,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)',
        gap: 10,
      }}
    >
      <ActionButton variant="cart" fullWidth>
        장바구니
      </ActionButton>
      <ActionButton fullWidth>결제하기</ActionButton>
    </div>
  ),
}

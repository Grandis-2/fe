import { expect, fn } from 'storybook/test'

import { ProductPageTab } from './ProductPageTab'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ProductPageTab,
  tags: ['ai-generated'],
} satisfies Meta<typeof ProductPageTab>

export default meta
type Story = StoryObj<typeof meta>

export const Benefits: Story = {
  args: { activeTab: 'benefits', onTabChange: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '구매 후기' }))
    await expect(args.onTabChange).toHaveBeenCalledWith('review')
  },
}

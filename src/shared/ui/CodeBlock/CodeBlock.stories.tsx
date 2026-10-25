import { expect } from 'storybook/test'

import { CodeBlock } from './CodeBlock'

import type { Meta, StoryObj } from '@storybook/react-vite'

const code = JSON.stringify(
  { eventType: 'PREORDER_PAYMENT_CONFIRMED', amount: 1550000 },
  null,
  2,
)

const meta = {
  component: CodeBlock,
  tags: ['ai-generated'],
  args: { code, label: '원문' },
} satisfies Meta<typeof CodeBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('원문')).toHaveTextContent('amount')
  },
}

/** 판단에 쓰는 줄을 강조한다 */
export const Highlighted: Story = {
  args: { highlight: (line) => line.includes('"eventType"') },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/"eventType"/)).toBeVisible()
  },
}

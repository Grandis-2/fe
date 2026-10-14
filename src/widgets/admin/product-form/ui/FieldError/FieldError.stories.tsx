import { expect } from 'storybook/test'

import { FieldError } from './FieldError'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: FieldError,
  tags: ['ai-generated'],
} satisfies Meta<typeof FieldError>

export default meta
type Story = StoryObj<typeof meta>

export const WithMessage: Story = {
  args: { message: '브랜드를 골라 주세요.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('브랜드를 골라 주세요.')).toBeVisible()
  },
}

/** 문구가 없으면 자리를 차지하지 않는다 */
export const Empty: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe('')
  },
}

import { useState } from 'react'

import { expect, fn } from 'storybook/test'

import { QuantityStepper } from './QuantityStepper'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: QuantityStepper,
  tags: ['ai-generated'],
} satisfies Meta<typeof QuantityStepper>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { value: 1, onChange: fn() },
}

export const AtMax: Story = {
  args: { value: 99, onChange: fn() },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '수량 늘리기' }),
    ).toBeDisabled()
    await expect(
      canvas.getByRole('button', { name: '수량 줄이기' }),
    ).toBeEnabled()
  },
}

export const Stepping: Story = {
  args: { value: 1, onChange: fn() },
  render: function Render() {
    const [value, setValue] = useState(1)
    return <QuantityStepper value={value} onChange={setValue} max={3} />
  },
  play: async ({ canvas, userEvent }) => {
    const minus = canvas.getByRole('button', { name: '수량 줄이기' })
    const plus = canvas.getByRole('button', { name: '수량 늘리기' })

    // min(1)에서 시작하므로 감소는 막혀 있다.
    await expect(minus).toBeDisabled()

    await userEvent.click(plus)
    await expect(canvas.getByText('2')).toBeInTheDocument()
    await expect(minus).toBeEnabled()

    // max(3)에 닿으면 증가가 막힌다.
    await userEvent.click(plus)
    await expect(canvas.getByText('3')).toBeInTheDocument()
    await expect(plus).toBeDisabled()
  },
}

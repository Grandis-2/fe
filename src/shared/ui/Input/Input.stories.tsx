import { expect, waitFor } from 'storybook/test'

import { Input } from './Input'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Input,
  tags: ['ai-generated'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: '이름' },
}

export const Focused: Story = {
  args: { label: '이름' },
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole('textbox')
    await userEvent.click(field)
    await expect(field).toHaveFocus()

    const label = canvas.getByText('이름')
    await waitFor(() => expect(label).toHaveStyle({ fontSize: '12px' }))
    await expect(label).toHaveStyle({ color: 'rgb(143, 143, 148)' }) // text.tertiary
  },
}

export const Filled: Story = {
  args: { label: '이름', defaultValue: '주현' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox')
    await expect(field).toHaveValue('주현')
    await expect(field).toHaveStyle({ color: 'rgb(27, 32, 84)' }) // primary.focus

    const label = canvas.getByText('이름')
    await expect(label).toHaveStyle({ fontSize: '12px' })
  },
}

export const Required: Story = {
  args: { label: '이름', required: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('이름 *')).toBeVisible()
    await expect(canvas.getByRole('textbox')).toBeRequired()
    await expect(
      canvas.queryByText(/필수로 작성해주세요/),
    ).not.toBeInTheDocument()
  },
}

export const Invalid: Story = {
  args: { label: '휴대폰 번호', required: true, invalid: true },
  play: async ({ canvas }) => {
    const message = canvas.getByText('휴대폰 번호을(를) 필수로 작성해주세요')
    await expect(message).toBeVisible()

    const label = canvas.getByText('휴대폰 번호 *')
    await expect(label).toHaveStyle({ color: 'rgb(220, 38, 38)' }) // status.danger

    const field = canvas.getByRole('textbox')
    await expect(field).toHaveStyle({ color: 'rgb(220, 38, 38)' })
    await expect(field).toBeRequired()
  },
}

export const InvalidWithoutRequired: Story = {
  args: { label: '이름', invalid: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText(/필수로 작성해주세요/),
    ).not.toBeInTheDocument()
  },
}

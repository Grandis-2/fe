import { useState } from 'react'

import { expect } from 'storybook/test'

import { Navigator } from './Navigator'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Navigator,
  tags: ['ai-generated'],
} satisfies Meta<typeof Navigator>

export default meta
type Story = StoryObj<typeof meta>

export const FirstPage: Story = {
  args: { totalPages: 7, currentPage: 1 },
}

export const MiddlePage: Story = {
  args: { totalPages: 7, currentPage: 4 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '4' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}

export const LastPage: Story = {
  args: { totalPages: 7, currentPage: 7 },
}

export const LargeTotalNearStart: Story = {
  args: { totalPages: 50, currentPage: 1 },
  play: async ({ canvas }) => {
    for (const label of ['1', '2', '3', '4', '5', '50']) {
      await expect(canvas.getByRole('button', { name: label })).toBeVisible()
    }
    await expect(
      canvas.queryByRole('button', { name: '25' }),
    ).not.toBeInTheDocument()
  },
}

export const LargeTotalMiddle: Story = {
  args: { totalPages: 50, currentPage: 25 },
  play: async ({ canvas }) => {
    for (const label of ['1', '24', '25', '26', '50']) {
      await expect(canvas.getByRole('button', { name: label })).toBeVisible()
    }
    await expect(canvas.getByRole('button', { name: '25' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(
      canvas.queryByRole('button', { name: '10' }),
    ).not.toBeInTheDocument()
  },
}

export const LargeTotalNearEnd: Story = {
  args: { totalPages: 50, currentPage: 50 },
  play: async ({ canvas }) => {
    for (const label of ['1', '46', '47', '48', '49', '50']) {
      await expect(canvas.getByRole('button', { name: label })).toBeVisible()
    }
    await expect(
      canvas.queryByRole('button', { name: '25' }),
    ).not.toBeInTheDocument()
  },
}

export const Interactive: Story = {
  args: { totalPages: 50, currentPage: 1 },
  render: function Render(args) {
    const [currentPage, setCurrentPage] = useState(args.currentPage)
    return (
      <Navigator
        {...args}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    )
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('button', { name: '1' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await userEvent.click(canvas.getByRole('button', { name: '5' }))
    await expect(canvas.getByRole('button', { name: '5' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await userEvent.click(canvas.getByRole('button', { name: 'last page' }))
    await expect(canvas.getByRole('button', { name: '50' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}

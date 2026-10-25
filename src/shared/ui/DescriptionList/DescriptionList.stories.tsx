import { expect } from 'storybook/test'

import { DescriptionList } from './DescriptionList'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: DescriptionList,
  tags: ['ai-generated'],
  args: {
    items: [
      { label: '받은 횟수', value: '5회' },
      { label: '쌓인 시각', value: '2026.10.24 12:31' },
    ],
  },
} satisfies Meta<typeof DescriptionList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('term')).toHaveLength(2)
    await expect(canvas.getByText('5회')).toBeVisible()
  },
}

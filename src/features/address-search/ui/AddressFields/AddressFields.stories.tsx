import { expect, fn } from 'storybook/test'

import { AddressFields } from './AddressFields'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AddressFields,
  tags: ['ai-generated'],
} satisfies Meta<typeof AddressFields>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    field: (key, label) => ({
      label,
      value: '',
      required: key !== 'addressDetail',
      onChange: fn(),
    }),
    onSearchClick: fn(),
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '주소 찾기' }))
    await expect(args.onSearchClick).toHaveBeenCalled()
  },
}

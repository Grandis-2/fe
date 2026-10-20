import { expect, waitFor } from 'storybook/test'

import { ScrollTopButton } from './ScrollTopButton'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ScrollTopButton,
  tags: ['ai-generated'],
  parameters: { dark: true },
  decorators: [
    (Story) => (
      <div style={{ height: '300vh' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScrollTopButton>

export default meta
type Story = StoryObj<typeof meta>

// 한 화면 넘게 내렸다가 누르면 맨 위로 돌아간다.
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    window.scrollTo(0, window.innerHeight * 2)
    const button = await canvas.findByRole('button', { name: '맨 위로' })
    await userEvent.click(button)
    await waitFor(() => expect(window.scrollY).toBe(0))
  },
}

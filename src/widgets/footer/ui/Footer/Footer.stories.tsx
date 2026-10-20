import { expect } from 'storybook/test'

import { TEAM } from '../../model/team'

import { Footer } from './Footer'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Footer,
  tags: ['ai-generated'],
} satisfies Meta<typeof Footer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    // 처음 보이는 팀원이 아닌 행성을 누르면 그 팀원으로 고정된다.
    const planet = canvas.getByRole('button', {
      name: `${TEAM[1].name} 상세 보기`,
    })
    await userEvent.click(planet)
    await expect(planet).toHaveAttribute('aria-pressed', 'true')
  },
}

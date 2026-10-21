import { expect, fn } from 'storybook/test'

import { TEAM } from '../../model/team'

import { FooterOrbitMobile } from './FooterOrbitMobile'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: FooterOrbitMobile,
  tags: ['ai-generated'],
  args: { activeId: '2', onToggle: fn() },
  parameters: { dark: true, viewport: { defaultViewport: 'mobile1' } },
} satisfies Meta<typeof FooterOrbitMobile>

export default meta
type Story = StoryObj<typeof meta>

const planet = (id: string) =>
  `${TEAM.find((member) => member.id === id)?.name} 상세 보기`
const frontend = TEAM.find(({ role }) => role === 'Frontend')!
const backend = TEAM.find(({ role }) => role === 'Backend')!

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(
      canvas.getByRole('button', { name: planet('2') }),
    ).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: planet('1') }))
    await expect(args.onToggle).toHaveBeenCalledWith('1')
  },
}

/** 프론트엔드 팀원을 고른 상태 — 그 행성만 커지고 빛난다 */
export const FrontendSelected: Story = {
  args: { activeId: frontend.id },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: planet(frontend.id) }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      canvas.getByRole('button', { name: planet(backend.id) }),
    ).toHaveAttribute('aria-pressed', 'false')
  },
}

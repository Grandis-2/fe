import { expect, fn } from 'storybook/test'

import { FooterOrbit } from './FooterOrbit'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: FooterOrbit,
  tags: ['ai-generated'],
  args: { activeId: 'be0', onHover: fn(), onToggle: fn() },
  parameters: { dark: true },
} satisfies Meta<typeof FooterOrbit>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(
      canvas.getByRole('button', { name: 'Backend 1 상세 보기' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Frontend 2 상세 보기' }),
    )
    await expect(args.onToggle).toHaveBeenCalledWith('fe1')
  },
}

/** 프론트엔드 팀원을 고른 상태 — 그 행성만 커지고 빛난다 */
export const FrontendSelected: Story = {
  args: { activeId: 'fe0' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Frontend 1 상세 보기' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      canvas.getByRole('button', { name: 'Backend 1 상세 보기' }),
    ).toHaveAttribute('aria-pressed', 'false')
  },
}

import { expect } from 'storybook/test'

import { Skeleton } from '../Skeleton'

import { SkeletonGroup } from './SkeletonGroup'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: SkeletonGroup,
  tags: ['ai-generated'],
  args: {
    children: [0, 1, 2].map((row) => <Skeleton key={row} height={24} />),
  },
} satisfies Meta<typeof SkeletonGroup>

export default meta
type Story = StoryObj<typeof meta>

/** 막대가 여러 개여도 스크린리더엔 '불러오는 중'을 한 번만 알린다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status')
    await expect(status).toHaveAttribute('aria-busy', 'true')
    await expect(canvas.getAllByText('불러오는 중입니다.')).toHaveLength(1)
  },
}

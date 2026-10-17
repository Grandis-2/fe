import { expect } from 'storybook/test'

import { PageSkeleton } from './PageSkeleton'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PageSkeleton,
  tags: ['ai-generated'],
} satisfies Meta<typeof PageSkeleton>

export default meta
type Story = StoryObj<typeof meta>

/** 상세 화면 — 제목 줄과 섹션 블록. 스크린리더엔 한 번만 알린다 */
export const Detail: Story = {
  args: { sections: 2, fieldsPerSection: 3 },
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status')
    await expect(status).toHaveAttribute('aria-busy', 'true')
    await expect(status).toHaveTextContent('불러오는 중입니다.')
  },
}

/** 폼 — 제목 줄 없이 섹션만 */
export const Form: Story = {
  args: { title: false, sections: 3, fieldsPerSection: 2 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toBeInTheDocument()
  },
}

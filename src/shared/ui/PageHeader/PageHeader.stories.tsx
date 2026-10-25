import { expect } from 'storybook/test'

import { PageHeader } from './PageHeader'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PageHeader,
  tags: ['ai-generated'],
  args: {
    title: '이벤트 DLQ',
    description: '처리에 거듭 실패해 멈춘 메시지예요.',
    aside: <span>마지막 갱신 14:32:05</span>,
  },
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

/** 제목과 같은 줄 오른쪽에 갱신 표시가 붙는다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const title = canvas.getByRole('heading', { level: 1, name: '이벤트 DLQ' })
    const aside = canvas.getByText('마지막 갱신 14:32:05')
    await expect(
      Math.abs(
        title.getBoundingClientRect().top - aside.getBoundingClientRect().top,
      ),
    ).toBeLessThan(16)
  },
}

export const WithBadge: Story = {
  args: { title: 'Mock 설정', badge: <span>팀 공용 서버</span> },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('팀 공용 서버')).toBeVisible()
  },
}

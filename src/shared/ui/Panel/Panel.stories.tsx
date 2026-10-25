import { expect } from 'storybook/test'

import { Panel } from './Panel'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Panel,
  tags: ['ai-generated'],
  args: { title: '메시지', children: '내용' },
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

/** 제목이 영역 이름이 된다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: '메시지' })).toBeVisible()
  },
}

/** 제목 줄 오른쪽에 짧은 안내를 둔다 */
export const WithAside: Story = {
  args: { title: '로그에서 찾기', aside: '값을 눌러 복사' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('값을 눌러 복사')).toBeVisible()
  },
}

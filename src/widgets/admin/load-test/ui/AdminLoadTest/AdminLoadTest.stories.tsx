import { expect } from 'storybook/test'

import { AdminLoadTest } from './AdminLoadTest'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminLoadTest,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminLoadTest>

export default meta
type Story = StoryObj<typeof meta>

/** 세 구역과 Grafana·조작 화면 링크가 보인다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: 'Grafana 열기' }),
    ).toHaveAttribute('target', '_blank')
    await expect(
      canvas.getByRole('link', { name: '대기열 관리' }),
    ).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Mock 설정' })).toBeVisible()
    await expect(canvas.getByText('초당 확정')).toBeVisible()
  },
}

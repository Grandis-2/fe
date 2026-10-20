import { expect } from 'storybook/test'

import { OpenPreorderTable } from './OpenPreorderTable'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OpenPreorderTable,
  tags: ['ai-generated'],
  args: {
    items: [
      {
        productId: 'p-iphone',
        name: '아이폰 18 Pro',
        waiting: 14020,
        credit: 12,
        wait: '약 19분',
        failures: 812,
        closesAt: '2026-10-10T06:00:00Z',
      },
      {
        productId: 'p-watch',
        name: '갤럭시 워치 클래식',
        waiting: 410,
        credit: 2,
        wait: '약 3분',
        failures: 0,
        closesAt: '2026-10-08T06:30:00Z',
      },
    ],
  },
} satisfies Meta<typeof OpenPreorderTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('cell', { name: '아이폰 18 Pro' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('cell', {
        name: '갤럭시 워치 클래식',
      }),
    ).toBeVisible()
  },
}

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('지금 접수 중인 사전예약이 없어요.'),
    ).toBeVisible()
  },
}

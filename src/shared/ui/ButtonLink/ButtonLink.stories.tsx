import { ExternalLink } from 'lucide-react'
import { expect } from 'storybook/test'

import { ButtonLink } from './ButtonLink'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ButtonLink,
  tags: ['ai-generated'],
  args: { children: '외부 예약 대조', to: '/admin/reconciliation' },
} satisfies Meta<typeof ButtonLink>

export default meta
type Story = StoryObj<typeof meta>

/** 앱 안 경로 — 버튼 모양이지만 링크다 */
export const Internal: Story = {
  args: { size: 'small', variant: 'outline', color: 'cancel' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: '외부 예약 대조' }),
    ).toHaveAttribute('href', '/admin/reconciliation')
  },
}

/** 밖 주소 — 새 탭으로 연다 */
export const External: Story = {
  args: {
    to: undefined,
    href: 'https://grafana.example.com',
    children: 'Grafana',
    icon: ExternalLink,
    size: 'small',
    variant: 'outline',
    color: 'cancel',
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Grafana' })
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noreferrer')
  },
}

import { expect } from 'storybook/test'

import { ServerStatusCard } from './ServerStatusCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const view = {
  nodeId: 'node-1',
  leaderNodeId: 'node-1' as string | null,
  snapshotStale: false,
  snapshotAgeSeconds: 1,
  gateways: 4,
  globalCredit: 120,
  brakeFactor: 1,
  maxWaitSeconds: null,
  leaveGraceSeconds: 250,
  products: [],
}

const meta = {
  component: ServerStatusCard,
  tags: ['ai-generated'],
  args: { view, loading: false },
} satisfies Meta<typeof ServerStatusCard>

export default meta
type Story = StoryObj<typeof meta>

export const Healthy: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('정상')).toBeVisible()
    await expect(canvas.getByText('4대')).toBeVisible()
  },
}

/** 브레이크가 걸리거나 현황이 오래되면 확인 필요 */
export const Braking: Story = {
  args: { view: { ...view, brakeFactor: 0.5 } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('확인 필요')).toBeVisible()
    await expect(canvas.getByText('0.5×')).toBeVisible()
  },
}

export const Stale: Story = {
  args: { view: { ...view, snapshotStale: true, snapshotAgeSeconds: 42 } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/모두 줄에 서요/)).toBeVisible()
  },
}

export const Loading: Story = { args: { view: undefined, loading: true } }

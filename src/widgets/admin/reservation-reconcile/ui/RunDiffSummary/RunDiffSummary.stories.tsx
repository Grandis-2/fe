import { expect } from 'storybook/test'

import { RunDiffSummary } from './RunDiffSummary'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: RunDiffSummary,
  tags: ['ai-generated'],
  args: {
    counts: { introduced: 3, persisting: 12, resolved: 5 },
    loading: false,
    failed: false,
  },
} satisfies Meta<typeof RunDiffSummary>

export default meta
type Story = StoryObj<typeof meta>

/** 신규·그대로·해소 — 새로 생긴 게 있으면 먼저 눈에 띈다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('신규 3건')).toBeVisible()
    await expect(canvas.getByText('그대로 12건')).toBeVisible()
    await expect(canvas.getByText('해소 5건')).toBeVisible()
  },
}

/** 비교를 못 받았으면 숫자 대신 그렇게 말한다 */
export const Failed: Story = {
  args: { counts: undefined, failed: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('직전 검사와 비교하지 못했어요.'),
    ).toBeVisible()
  },
}

/** 직전 검사가 없으면(첫 검사) 아무것도 그리지 않는다 */
export const NoPrevious: Story = {
  args: { counts: undefined },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe('')
  },
}

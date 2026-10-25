import { expect } from 'storybook/test'

import { StackedBar } from './StackedBar'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: StackedBar,
  tags: ['ai-generated'],
  args: {
    unit: '건',
    segments: [
      {
        key: 'ok',
        label: '정상 응답',
        value: 93,
        caption: '평균 약 0.99초',
        tone: 'primary',
      },
      { key: 'fail', label: '일시 실패', value: 5, tone: 'danger' },
      {
        key: 'slow',
        label: '느림',
        value: 2,
        caption: '8~15초',
        tone: 'warning',
      },
    ],
  },
} satisfies Meta<typeof StackedBar>

export default meta
type Story = StoryObj<typeof meta>

/** 막대는 그림 하나로, 범례 내용을 한 문장으로 읽어 준다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', {
        name: '정상 응답 93건, 일시 실패 5건, 느림 2건',
      }),
    ).toBeVisible()
  },
}

/** 모두 0이면 빈 막대만 — 0으로 나누지 않는다 */
export const Empty: Story = {
  args: {
    segments: [{ key: 'ok', label: '정상 응답', value: 0, tone: 'primary' }],
  },
}

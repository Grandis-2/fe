import { expect } from 'storybook/test'

import { AdmissionBar } from './AdmissionBar'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdmissionBar,
  tags: ['ai-generated'],
  args: { admitting: 150, processing: 220, tone: 'success' },
} satisfies Meta<typeof AdmissionBar>

export default meta
type Story = StoryObj<typeof meta>

/** 처리 속도 선까지 여유가 있다 */
export const Room: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', {
        name: /입장 초당 150명, 외부 등록 처리 초당 220건/,
      }),
    ).toBeVisible()
  },
}

/** 바꿀 값이 선을 넘으면 빗금이 빨갛게 겹친다 */
export const PreviewOver: Story = {
  args: { next: 260 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: /바꾸면 260명/ }),
    ).toBeVisible()
  },
}

/** 선 가까이까지 찼다(빠듯함) — 바꿀 값이 없으면 빗금도 없다 */
export const Tight: Story = {
  args: { admitting: 200, processing: 215, tone: 'warning' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', {
        name: '입장 초당 200명, 외부 등록 처리 초당 215건',
      }),
    ).toBeVisible()
  },
}

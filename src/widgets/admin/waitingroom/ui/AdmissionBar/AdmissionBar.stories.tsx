import { expect } from 'storybook/test'

import { AdmissionBar } from './AdmissionBar'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdmissionBar,
  tags: ['ai-generated'],
  args: { admitting: 150, processing: 220 },
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

/** 바꿀 값이 처리선을 넘어 빨간 구간까지 빗금이 겹친다 */
export const PreviewOver: Story = {
  args: { next: 260 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: /바꾸면 260명/ }),
    ).toBeVisible()
  },
}

/** 노란 구간까지 찼다(한계 근처) — 바꿀 값이 없으면 빗금도 없다 */
export const Tight: Story = {
  args: { admitting: 200, processing: 215 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', {
        name: '입장 초당 200명, 외부 등록 처리 초당 215건',
      }),
    ).toBeVisible()
  },
}

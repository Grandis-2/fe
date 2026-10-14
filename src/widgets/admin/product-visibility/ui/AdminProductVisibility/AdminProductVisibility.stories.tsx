import { expect, fn } from 'storybook/test'

import { AdminProductVisibility } from './AdminProductVisibility'

import type { Meta, StoryObj } from '@storybook/react-vite'

const product = {
  productId: 'SM-FOLD8',
  name: '갤럭시 Z 폴드8',
  displayStatus: 'PUBLISHED',
} as const

const meta = {
  component: AdminProductVisibility,
  tags: ['ai-generated'],
  args: { product, onPublish: fn(), onHide: fn() },
} satisfies Meta<typeof AdminProductVisibility>

export default meta
type Story = StoryObj<typeof meta>

/** 게시중이면 내리는 버튼만 준다 */
export const Published: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(
      canvas.queryByRole('button', { name: '게시중으로 전환하기' }),
    ).not.toBeInTheDocument()

    await userEvent.click(
      canvas.getByRole('button', { name: '숨김으로 전환하기' }),
    )
    await expect(args.onHide).toHaveBeenCalledWith(product)
  },
}

/** 초안·숨김은 똑같이 '공개'로 올린다 — 올리는 길이 하나다 */
export const Hidden: Story = {
  args: { product: { ...product, displayStatus: 'HIDDEN' } },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '게시중으로 전환하기' }),
    )
    await expect(args.onPublish).toHaveBeenCalled()
  },
}

/** 요청이 도는 동안은 같은 전환을 다시 보낼 수 없다 */
export const Pending: Story = {
  args: { pending: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '숨김으로 전환하기' }),
    ).toBeDisabled()
  },
}

/**
 * 사전예약은 공개로 둬도 접수 기간 밖이면 공개 예정·공개 종료로 보인다 — 공개 설정은
 * 켜져 있으니 내리는 버튼을 준다.
 */
export const Scheduled: Story = {
  args: { product: { ...product, displayStatus: 'SCHEDULED' } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '숨김으로 전환하기' }),
    ).toBeVisible()
  },
}

export const Ended: Story = {
  args: { product: { ...product, displayStatus: 'ENDED' } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '숨김으로 전환하기' }),
    ).toBeVisible()
  },
}

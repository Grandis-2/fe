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
      canvas.queryByRole('button', { name: '공개' }),
    ).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: '숨기기' }))
    await expect(args.onHide).toHaveBeenCalledWith(product)
  },
}

/** 초안·숨김은 똑같이 '공개'로 올린다 — 올리는 길이 하나다 */
export const Hidden: Story = {
  args: { product: { ...product, displayStatus: 'HIDDEN' } },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '공개' }))
    await expect(args.onPublish).toHaveBeenCalled()
  },
}

/** 요청이 도는 동안은 같은 전환을 다시 보낼 수 없다 */
export const Pending: Story = {
  args: { pending: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '숨기기' })).toBeDisabled()
  },
}

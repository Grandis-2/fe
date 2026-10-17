import { expect, fn } from 'storybook/test'

import { AdminPromotionForm } from './AdminPromotionForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminPromotionForm,
  tags: ['ai-generated'],
  args: {
    mode: 'create',
    products: [
      {
        productId: 'p-1',
        name: 'NOVA 1',
        openAtLabel: '9/20 12:00 오픈',
        colors: ['블랙'],
        storages: ['256GB'],
      },
    ],
    onSubmit: fn(),
    onCancel: fn(),
    onAddProduct: fn(),
  },
} satisfies Meta<typeof AdminPromotionForm>

export default meta
type Story = StoryObj<typeof meta>

/** 등록 — 입력한 이름과 고른 상품을 한 번에 넘긴다 */
export const Create: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/사전예약명/), '가을 사전예약')
    await userEvent.click(canvas.getByRole('button', { pressed: false }))
    await userEvent.click(canvas.getByRole('button', { name: '등록하기' }))
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '가을 사전예약',
        linkedProductIds: ['p-1'],
      }),
    )
  },
}

/** 수정 — 기존 값이 채워지고 버튼 이름이 바뀐다 */
export const Edit: Story = {
  args: {
    mode: 'edit',
    defaultValue: {
      name: '여름 사전예약',
      startAt: '',
      endAt: '',
      thumbnail: null,
      detailImages: [],
      linkedProductIds: ['p-1'],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/사전예약명/)).toHaveValue(
      '여름 사전예약',
    )
    await expect(canvas.getByRole('button', { name: '수정하기' })).toBeVisible()
  },
}

/** 저장 중엔 다시 제출할 수 없다(같은 프로모션이 여러 개 생긴다) */
export const Submitting: Story = {
  args: { submitting: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '등록하기' }),
    ).toBeDisabled()
  },
}

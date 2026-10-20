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

/** 등록 — 진행 기간을 안 고르면 보내지 않고 이유를 보여준다(서버는 400) */
export const Create: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/사전예약명/), '가을 사전예약')
    await userEvent.click(canvas.getByRole('button', { pressed: false }))
    await userEvent.click(canvas.getByRole('button', { name: '등록하기' }))
    await expect(canvas.getByText('진행 기간을 선택해 주세요.')).toBeVisible()
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

/** 수정 — 기존 값이 채워지고 버튼 이름이 바뀐다 */
export const Edit: Story = {
  args: {
    mode: 'edit',
    defaultValue: {
      name: '여름 사전예약',
      startDate: '',
      endDate: '',
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

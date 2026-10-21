import { expect, fn } from 'storybook/test'

import { AdminPromotionForm } from './AdminPromotionForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const saved = {
  name: '여름 사전예약',
  startDate: '2026-10-20',
  endDate: '2026-10-31',
  thumbnail: null,
  detailImages: [],
  linkedProductIds: ['p-1'],
}

const meta = {
  component: AdminPromotionForm,
  tags: ['ai-generated'],
  args: {
    mode: 'create',
    products: [
      {
        productId: 'p-1',
        name: 'NOVA 1',
        saleMode: 'PREORDER',
        opensAt: '2026-10-20T01:00:00Z',
        openAtLabel: '10.20 10:00 오픈',
        colors: ['블랙'],
        storages: ['256GB'],
      },
      {
        productId: 'p-2',
        name: 'NOVA 2',
        saleMode: 'PREORDER',
        // 노출 끝(10.31) 뒤에 오픈한다.
        opensAt: '2026-11-07T01:00:00Z',
        openAtLabel: '11.07 10:00 오픈',
        colors: [],
        storages: [],
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
    await expect(canvas.getByText('7 / 100')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '사전예약 상품 연결' }),
    )
    await userEvent.click(canvas.getByRole('button', { name: /NOVA 1/ }))
    await userEvent.click(canvas.getByRole('button', { name: '등록하기' }))
    await expect(canvas.getByText('진행 기간을 선택해 주세요.')).toBeVisible()
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

/** 수정 — 저장된 값이 채워지고, 바뀐 게 없으면 저장·되돌리기가 잠긴다 */
export const Edit: Story = {
  args: { mode: 'edit', defaultValue: saved },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/사전예약명/)).toHaveValue(
      '여름 사전예약',
    )
    await expect(canvas.getByText('바뀐 곳 없음')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '저장' })).toBeDisabled()
    await expect(
      canvas.getByRole('button', { name: '되돌리기' }),
    ).toBeDisabled()
  },
}

/** 고치면 그 섹션에 '바뀜'이 붙고 저장 줄에 요약된다 — 되돌리면 저장된 값으로 */
export const EditChanged: Story = {
  args: { mode: 'edit', defaultValue: saved },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '사전예약 상품 연결' }),
    )
    await userEvent.click(canvas.getByRole('button', { name: /NOVA 2/ }))
    await expect(canvas.getByText(/바뀐 곳/)).toHaveTextContent(
      '바뀐 곳 1곳 · 연결 상품 +1',
    )
    // 노출이 끝난 뒤에 오픈하는 상품을 붙이면 알린다.
    await expect(canvas.getByText(/노출이 끝난 뒤/)).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '되돌리기' }))
    await expect(canvas.getByText('바뀐 곳 없음')).toBeVisible()
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

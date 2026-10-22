import { expect, fn } from 'storybook/test'

import { DrawUnconfirmedError } from '@entities/admin-draw'
import { ApiRequestError } from '@shared/api/client'

import { AdminDrawForm } from './AdminDrawForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminDrawForm,
  tags: ['ai-generated'],
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    onAddProduct: fn(),
    onStartOver: fn(),
  },
} satisfies Meta<typeof AdminDrawForm>

export default meta
type Story = StoryObj<typeof meta>

/** 빈 채로 내면 보내지 않고 칸마다 무엇이 빠졌는지 붙인다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '회차 만들기' }))
    await expect(canvas.getByText('회차 제목을 입력해 주세요.')).toBeVisible()
    await expect(
      canvas.getByText('증정품 상품과 옵션을 골라 주세요.'),
    ).toBeVisible()
    await expect(
      canvas.getByText('응모 마감 일시를 골라 주세요.'),
    ).toBeVisible()
    await expect(args.onSubmit).not.toHaveBeenCalled()

    // 고친 칸의 오류는 바로 지운다.
    // 섹션 제목도 '회차 제목'이라 입력칸을 역할로 찾는다.
    await userEvent.type(
      canvas.getByRole('textbox', { name: /회차 제목/ }),
      '에어팟 응모',
    )
    await expect(canvas.queryByText('회차 제목을 입력해 주세요.')).toBeNull()
  },
}

/** 재고가 모자라 서버가 거절하면(409) 당첨 인원 칸에 붙인다 */
export const InsufficientStock: Story = {
  args: {
    submitError: new ApiRequestError(
      {
        code: 'INSUFFICIENT_STOCK',
        message: '증정품 재고가 당첨 인원보다 적습니다.',
        details: null,
      },
      409,
    ),
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(/증정품 가용 재고가 당첨 인원보다 적습니다/),
    ).toBeVisible()
  },
}

/** 서버 장애면 같은 내용으로 다시 눌러도 된다고 알린다 */
export const ServerError: Story = {
  args: {
    submitError: new ApiRequestError(
      {
        code: 'DEPENDENCY_UNAVAILABLE',
        message: '잠시 뒤 다시 시도해 주세요.',
        details: null,
      },
      503,
    ),
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(/같은 내용으로 다시 누르면 회차가 둘이 되지 않습니다/),
    ).toBeVisible()
  },
}

/** 결과를 모르는 채 내용을 고쳤으면 목록 확인 뒤 새로 보내게 한다 */
export const Unconfirmed: Story = {
  args: { submitError: new DrawUnconfirmedError() },
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '확인했어요, 새로 보내기' }),
    )
    await expect(args.onStartOver).toHaveBeenCalled()
  },
}

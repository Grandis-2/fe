import { expect, fn, waitFor } from 'storybook/test'

import { AdminBannerForm } from './AdminBannerForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminBannerForm,
  tags: ['ai-generated'],
  args: {
    targets: {
      options: {
        PRODUCT: [
          { id: 'p-1', name: 'Nova 1 실리콘 케이스', taken: false },
          { id: 'p-2', name: 'Nova 충전기', taken: true },
        ],
        PROMOTION: [{ id: 'pr-1', name: '가을 사전예약', taken: false }],
      },
      isPending: { PRODUCT: false, PROMOTION: false },
      isError: { PRODUCT: false, PROMOTION: false },
    },
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof AdminBannerForm>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

/** 빈 칸이 있으면 보내지 않고 그 칸에 이유를 보여준다 */
export const BlocksIncomplete: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '추천' }))
    await userEvent.click(canvas.getByRole('button', { name: '만들기' }))
    await expect(args.onSubmit).not.toHaveBeenCalled()
    await expect(canvas.getByText('제목을 채워 주세요.')).toBeInTheDocument()
    await expect(canvas.getByLabelText('제목')).toHaveFocus()
  },
}

/** 아래 버튼 줄의 미리보기는 지금 적은 값으로 모달을 연다 */
export const Preview: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('제목'), '가을 신상')
    await userEvent.click(canvas.getByRole('button', { name: '미리보기' }))
    const dialog = await canvas.findByRole('dialog', { name: '미리보기' })
    // 열리는 애니메이션(투명 → 보임)이 끝나야 보인다고 친다.
    await waitFor(() => expect(dialog).toBeVisible())
    await expect(dialog).toHaveTextContent('가을 신상')
  },
}

/** 다른 배너가 이미 연결한 대상은 고를 수 없다 */
export const TakenTarget: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('radio', { name: /Nova 충전기/ }),
    ).toBeDisabled()
  },
}

export const TargetsLoading: Story = {
  args: {
    targets: {
      options: { PRODUCT: undefined, PROMOTION: undefined },
      isPending: { PRODUCT: true, PROMOTION: true },
      isError: { PRODUCT: false, PROMOTION: false },
    },
  },
}

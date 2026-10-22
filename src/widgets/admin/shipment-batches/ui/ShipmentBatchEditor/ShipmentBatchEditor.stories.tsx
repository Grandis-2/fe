import { expect, fn, userEvent } from 'storybook/test'

import { ShipmentBatchEditor } from './ShipmentBatchEditor'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ShipmentBatchEditor,
  tags: ['ai-generated'],
  args: {
    saving: false,
    saveError: null,
    onDismissError: fn(),
    onSave: fn(),
    batches: [
      {
        batchNumber: 1,
        positionFrom: 1,
        positionTo: 5000,
        estimatedShipStart: '2026-10-28',
        estimatedShipEnd: '2026-10-30',
      },
      {
        batchNumber: 2,
        positionFrom: 5001,
        positionTo: null,
        estimatedShipStart: '2026-11-04',
        estimatedShipEnd: '2026-11-06',
      },
    ],
  },
} satisfies Meta<typeof ShipmentBatchEditor>

export default meta
type Story = StoryObj<typeof meta>

/** 손대기 전에는 저장할 게 없고, 마지막 차수는 지울 수 없다 */
export const Untouched: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '배송 구간 저장' }),
    ).toBeDisabled()
    await expect(
      canvas.getByRole('button', { name: '마지막 차수는 지울 수 없어요' }),
    ).toBeDisabled()
  },
}

/** 끝 번호를 고치면 저장할 수 있고, 저장하면 전체 차수를 보낸다 */
export const EditEndNumber: Story = {
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox', { name: '끝 번호' })
    await userEvent.clear(input)
    await userEvent.type(input, '4000')
    await expect(canvas.getByText('저장하지 않은 변경이 있어요')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '배송 구간 저장' }),
    )
    await expect(args.onSave).toHaveBeenCalledWith({
      batches: [
        expect.objectContaining({ batchNumber: 1, positionTo: 4000 }),
        expect.objectContaining({
          batchNumber: 2,
          positionFrom: 4001,
          positionTo: null,
        }),
      ],
    })
  },
}

/** 차수를 더하면 마지막 차수 앞에 들어간다 */
export const AddBeforeLast: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /차수 추가/ }))
    await expect(canvas.getByText('3차')).toBeVisible()
    await expect(canvas.getByText(/2차 끝 번호를 입력해 주세요/)).toBeVisible()
  },
}

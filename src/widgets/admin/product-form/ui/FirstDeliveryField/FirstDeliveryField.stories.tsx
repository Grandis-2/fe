import { expect, fn, userEvent, within } from 'storybook/test'

import { FirstDeliveryField } from './FirstDeliveryField'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: FirstDeliveryField,
  tags: ['ai-generated'],
  args: { onChange: fn(), onEditShipmentBatches: fn() },
} satisfies Meta<typeof FirstDeliveryField>

export default meta
type Story = StoryObj<typeof meta>

const EMPTY = { start: '', end: '' }

/** 등록할 때는 기간을 고른다. 버튼 이름으로 무엇의 기간인지 읽힌다. */
export const Editable: Story = {
  args: { editable: true, value: EMPTY },
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: /1차 배송 기간/ })
    await expect(trigger).toHaveTextContent('배송 예정 기간을 선택해 주세요')

    // 값이 없으면 달력이 이번 달로 열린다 — 달을 넘기지 않아도 되게 오늘 기준으로 고른다.
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    // 달력은 body로 포털된다 — 캔버스 밖이라 body에서 찾는다.
    await userEvent.click(trigger)
    await userEvent.click(
      await within(document.body).findByRole('button', {
        name: `${year}년 ${month}월 20일`,
      }),
    )
    await expect(args.onChange).toHaveBeenCalledWith({
      start: `${year}-${String(month).padStart(2, '0')}-20`,
      end: '',
    })
  },
}

export const EditablePicked: Story = {
  args: { editable: true, value: { start: '2026-09-20', end: '2026-09-24' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toHaveTextContent(
      '2026년 9월 20일 (일) ~ 2026년 9월 24일 (목)',
    )
  },
}

/**
 * 등록 뒤에는 고를 수 없다 — 차수 저장이 전체 덮어쓰기라 여기서 1차만 고치면
 * 2차 이후가 지워진다. 어디서 고치는지 알려주고 그 탭으로 보낸다.
 */
export const Locked: Story = {
  args: { editable: false, value: { start: '2026-09-20', end: '2026-09-24' } },
  play: async ({ canvas, args }) => {
    await expect(canvas.queryByRole('button', { name: /미정/ })).toBeNull()
    await expect(canvas.getByText(/배송 차수 수정이/)).toBeVisible()

    await userEvent.click(
      canvas.getByRole('button', { name: '배송 구간 설정으로 이동' }),
    )
    await expect(args.onEditShipmentBatches).toHaveBeenCalled()
  },
}

/** 이동 버튼은 콜백을 받았을 때만 나온다 — 등록 화면 등에서는 갈 곳이 없다. */
export const LockedWithoutLink: Story = {
  args: { editable: false, value: EMPTY, onEditShipmentBatches: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/배송 차수 수정이/)).toBeVisible()
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
  },
}

import { expect, fn } from 'storybook/test'

import { AdmissionSpeedCard } from './AdmissionSpeedCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const flow = {
  waiting: 18240,
  admitting: 120,
  processing: 160 as number | null,
  verdict: { tone: 'warning' as const, title: '한계에 가까워요', hint: '' },
}

const meta = {
  component: AdmissionSpeedCard,
  tags: ['ai-generated'],
  args: {
    flow,
    brakeFactor: 1,
    loading: false,
    globalSetting: { value: 120, source: 'OPERATIONAL' },
    maxCredit: 1500,
    productIds: ['p-iphone', 'p-galaxy'],
    admission: { apply: fn(), confirm: fn(), isPending: false, error: null },
    inputId: 'wr-speed-input',
  },
} satisfies Meta<typeof AdmissionSpeedCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 숫자만 받고, 지금 값과 다른 올바른 값일 때만 적용이 열린다. 넣으면 막대에 빗금이 겹치고
 * 바꿨을 때의 맨 뒤 대기를 먼저 보인다
 */
export const TypeToApply: Story = {
  play: async ({ canvas, args, userEvent }) => {
    const apply = canvas.getByRole('button', { name: '적용' })
    await expect(apply).toBeDisabled()
    const input = canvas.getByLabelText('바꿀 속도(명/초)')
    await userEvent.type(input, '1a00')
    await expect(input).toHaveValue('100')
    await expect(canvas.getByText(/바꾸면 맨 뒤 대기/)).toBeVisible()
    await expect(canvas.getByText('여유 안이에요')).toBeVisible()
    await userEvent.click(apply)
    await expect(args.admission.apply).toHaveBeenCalledWith(
      {
        kind: 'globalCredit',
        value: 100,
        productIds: ['p-iphone', 'p-galaxy'],
      },
      '전체 상한과 모든 상품 상한을 바꿨습니다.',
      expect.any(Function),
    )
    // 지금과 같은 값이면 적용할 게 없다.
    await userEvent.clear(input)
    await userEvent.type(input, '120')
    await expect(apply).toBeDisabled()
  },
}

/** −5 / +5는 비어 있으면 지금 설정에서 시작한다 */
export const Step: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '5 늘리기' }))
    await expect(canvas.getByLabelText('바꿀 속도(명/초)')).toHaveValue('125')
    await expect(canvas.getByText('한계 근처예요')).toBeVisible()
  },
}

/** 범위를 넘으면 칸 아래에 알리고 적용을 막는다 */
export const OutOfRange: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('바꿀 속도(명/초)'), '9999')
    await expect(canvas.getByText(/1~1,500 사이로/)).toBeVisible()
    await expect(canvas.getByRole('button', { name: '적용' })).toBeDisabled()
  },
}

/** 운영값이면 기본값으로 되돌리기가 보이고, 입장 멈춤은 언제나 확인을 거친다. 전체 상한을 바꾸면 상품 상한도 바뀐다고 알린다 */
export const Operational: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByRole('button', { name: /기본값\(15명\/초\)으로/ }),
    ).toBeVisible()
    await expect(
      canvas.getByText('바꾸면 모든 상품 상한도 같은 값으로 바뀌어요'),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '입장 멈춤' }))
    await expect(args.admission.confirm).toHaveBeenCalled()
  },
}

/** 처리 속도를 아직 못 쟀으면 막대 대신 기다리라고 한다 */
export const Measuring: Story = {
  args: { flow: { ...flow, processing: null } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/재는 중이에요/)).toBeVisible()
  },
}

export const Loading: Story = { args: { loading: true } }

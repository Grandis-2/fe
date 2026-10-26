import { expect, fn } from 'storybook/test'

import { AdmissionSpeedCard } from './AdmissionSpeedCard'

import type { AdmissionSignals } from '../../lib/admissionSignals'
import type { Meta, StoryObj } from '@storybook/react-vite'

/** 따라가는 중 — 접수 = 처리 */
const following: AdmissionSignals = {
  at: 60_000,
  coveredSeconds: 30,
  received: 14,
  processed: 14,
  backlog: 7,
  backlogPerMinute: 0,
  judged: true,
  judgedInSeconds: 0,
  congested: false,
}

/** 밀리는 중 — 접수 40 > 처리 30 */
const congested: AdmissionSignals = {
  ...following,
  received: 40,
  processed: 30,
  backlog: 820,
  backlogPerMinute: 600,
  congested: true,
}

/** 사전예약 서버 3대 — 권장 150, 위험선 400 */
const capacity = {
  recommendedMax: 150,
  dangerLine: 400,
  appliedCredit: 15,
  readyTasks: 3,
  warmingTasks: 0,
  brakeFactor: 1,
  relayBadRatio: 0.01,
  scalingPending: false,
}

const verdict = {
  kind: 'following' as const,
  tone: 'success' as const,
  title: '외부 등록이 따라가고 있어요',
  hint: '',
}

const meta = {
  component: AdmissionSpeedCard,
  tags: ['ai-generated'],
  args: {
    flow: { waiting: 18000, admitting: 15, signals: following, verdict },
    brakeFactor: 1,
    loading: false,
    globalSetting: { value: 15, source: 'DEFAULT' },
    capacity,
    maxCredit: 1500,
    productIds: ['p-iphone', 'p-galaxy'],
    admission: { apply: fn(), confirm: fn(), isPending: false, error: null },
    inputId: 'wr-speed-input',
  },
} satisfies Meta<typeof AdmissionSpeedCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 권장 상한 안으로 올리기 — 숫자만 받고, 지금 값과 다를 때만 적용이 열린다. 확인 없이 바로
 * 보낸다
 */
export const RaiseWithinRecommended: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByRole('img', { name: '처리가 접수를 따라가요' }),
    ).toBeVisible()
    const apply = canvas.getByRole('button', { name: '적용' })
    await expect(apply).toBeDisabled()
    const input = canvas.getByLabelText('바꿀 속도(명/초)')
    await userEvent.type(input, '3a0')
    await expect(input).toHaveValue('30')
    await expect(
      canvas.getByText(/권장 상한\(150명\/초\) 안이라 1초 안에 반영돼요/),
    ).toBeVisible()
    await userEvent.click(apply)
    await expect(args.admission.confirm).not.toHaveBeenCalled()
    await expect(args.admission.apply).toHaveBeenCalledWith(
      {
        kind: 'globalCredit',
        value: 30,
        productIds: ['p-iphone', 'p-galaxy'],
      },
      '전체 상한과 모든 상품 상한을 바꿨습니다.',
      expect.any(Function),
      expect.any(Function),
    )
    // 지금과 같은 값이면 적용할 게 없다.
    await userEvent.clear(input)
    await userEvent.type(input, '15')
    await expect(apply).toBeDisabled()
  },
}

/** 권장 상한을 넘는 값 — 서버가 늘어난 뒤 반영된다고 알리고, 적용하면 먼저 확인받는다 */
export const AboveRecommendedConfirm: Story = {
  args: { globalSetting: { value: 120, source: 'OPERATIONAL' } },
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('바꿀 속도(명/초)'), '250')
    await expect(
      canvas.getByText(/권장 상한\(150명\/초\)을 넘어요/),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '적용' }))
    await expect(args.admission.apply).not.toHaveBeenCalled()
    await expect(args.admission.confirm).toHaveBeenCalledWith(
      '권장 상한을 넘겨 250명/초로 올릴까요?',
      expect.stringContaining('사전예약 서버가 늘어난 뒤에 반영돼요'),
      '250명/초로 올리기',
      expect.any(Function),
    )
  },
}

/** 그사이 용량이 줄어 서버가 409로 확인을 요구하면 그 기준으로 확인 모달을 띄운다 */
export const ServerAsksConfirm: Story = {
  args: {
    admission: {
      apply: fn((_change, _done, _onDone, onRefused) =>
        onRefused?.({ kind: 'confirm', recommendedMax: 100, dangerLine: 400 }),
      ),
      confirm: fn(),
      isPending: false,
      error: null,
    },
  },
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('바꿀 속도(명/초)'), '120')
    await userEvent.click(canvas.getByRole('button', { name: '적용' }))
    await expect(args.admission.confirm).toHaveBeenCalledWith(
      '권장 상한을 넘겨 120명/초로 올릴까요?',
      expect.stringContaining('약 100명/초까지만'),
      '120명/초로 올리기',
      expect.any(Function),
    )
  },
}

/** 위험선을 넘는 값 — 칸에서 막고 이유를 말한다. +5도 위험선에서 멈춘다 */
export const AboveDangerLine: Story = {
  args: { globalSetting: { value: 120, source: 'OPERATIONAL' } },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('바꿀 속도(명/초)')
    await userEvent.type(input, '450')
    await expect(
      canvas.getByText('서버를 최대로 늘려도 받을 수 없는 값이에요.'),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: '적용' })).toBeDisabled()
    await userEvent.clear(input)
    await userEvent.type(input, '398')
    await userEvent.click(canvas.getByRole('button', { name: '5 늘리기' }))
    await expect(input).toHaveValue('400')
    await expect(
      canvas.getByRole('button', { name: '5 늘리기' }),
    ).toBeDisabled()
  },
}

/** 권장 위로 올린 뒤 — 설정과 실제 적용을 함께 보이고, 서버가 늘어나는 중이라고 알린다 */
export const ScalingPending: Story = {
  args: {
    flow: { waiting: 18000, admitting: 150, signals: following, verdict },
    globalSetting: { value: 250, source: 'OPERATIONAL' },
    capacity: {
      ...capacity,
      appliedCredit: 150,
      warmingTasks: 2,
      scalingPending: true,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('지금은 150명/초만 적용 중')).toBeVisible()
    await expect(canvas.getByText(/늘어나는 중 2대/)).toBeVisible()
  },
}

/** 서버 용량을 모르면 막대 대신 한 줄로 알리고, 확인 없이 지금처럼 바꾼다 */
export const UnknownCapacity: Story = {
  args: { capacity: null },
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText(/서버 용량을 알 수 없어요/)).toBeVisible()
    await userEvent.type(canvas.getByLabelText('바꿀 속도(명/초)'), '900')
    await expect(canvas.getByText(/올린 뒤 30초쯤/)).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '적용' }))
    await expect(args.admission.confirm).not.toHaveBeenCalled()
    await expect(args.admission.apply).toHaveBeenCalled()
  },
}

/** −5 / +5는 비어 있으면 지금 설정에서 시작한다 */
export const Step: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '5 늘리기' }))
    await expect(canvas.getByLabelText('바꿀 속도(명/초)')).toHaveValue('20')
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

/** 밀리는 중에 낮추기 — 지금 외부 등록 처리보다 느리면 쌓인 대기가 언제 풀리는지 보인다 */
export const CongestedLower: Story = {
  args: {
    flow: { waiting: 9600, admitting: 40, signals: congested, verdict },
    globalSetting: { value: 40, source: 'OPERATIONAL' },
    capacity: { ...capacity, appliedCredit: 40 },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('접수를 못 따라가요')).toBeVisible()
    await userEvent.type(canvas.getByLabelText('바꿀 속도(명/초)'), '25')
    await expect(
      canvas.getByText(/820건이 약 2분 44초 만에 풀려요/),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: '적용' })).toBeEnabled()
  },
}

/** 밀리는 중에 올리기 — 권장 상한 안이어도 적용과 +5를 막고 이유를 말한다 */
export const CongestedRaiseBlocked: Story = {
  args: CongestedLower.args,
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole('button', { name: '5 늘리기' }),
    ).toBeDisabled()
    await userEvent.type(canvas.getByLabelText('바꿀 속도(명/초)'), '60')
    await expect(
      canvas.getByText('밀리는 동안은 올릴 수 없어요.'),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: '적용' })).toBeDisabled()
  },
}

/** 브레이크가 걸리면 올리기를 막는다 — 낮추기는 된다 */
export const BrakingRaiseBlocked: Story = {
  args: {
    flow: { waiting: 12400, admitting: 15, signals: following, verdict },
    brakeFactor: 0.1,
    globalSetting: { value: 150, source: 'OPERATIONAL' },
    capacity: { ...capacity, appliedCredit: 15, brakeFactor: 0.1 },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByText('지금은 15명/초만 적용 중 · 서버가 입장을 줄이는 중'),
    ).toBeVisible()
    const input = canvas.getByLabelText('바꿀 속도(명/초)')
    await userEvent.type(input, '200')
    await expect(
      canvas.getByText('서버가 입장을 줄이는 동안은 올릴 수 없어요.'),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: '적용' })).toBeDisabled()
    await userEvent.clear(input)
    await userEvent.type(input, '100')
    await expect(canvas.getByRole('button', { name: '적용' })).toBeEnabled()
  },
}

/** 멈춘 뒤 다시 열기는 막지 않는다 */
export const StoppedReopen: Story = {
  args: {
    flow: {
      waiting: 18240,
      admitting: 0,
      signals: { ...congested, congested: false, at: 780_000 },
      verdict,
    },
    globalSetting: { value: 0, source: 'OPERATIONAL' },
    capacity: { ...capacity, appliedCredit: 0 },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('바꿀 속도(명/초)'), '20')
    await expect(canvas.getByRole('button', { name: '적용' })).toBeEnabled()
    await expect(
      canvas.getByRole('button', { name: '입장 멈춤' }),
    ).toBeDisabled()
  },
}

/** 운영값이면 기본값으로 되돌리기가 보이고, 입장 멈춤은 언제나 확인을 거친다 */
export const Operational: Story = {
  args: { globalSetting: { value: 30, source: 'OPERATIONAL' } },
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByRole('button', { name: '서버 기본값으로' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '입장 멈춤' }))
    await expect(args.admission.confirm).toHaveBeenCalled()
  },
}

/** 서버가 막 떠서 잰 구간이 짧으면 재는 중 */
export const Measuring: Story = {
  args: {
    flow: {
      waiting: 18000,
      admitting: 15,
      signals: {
        ...following,
        coveredSeconds: 0,
        received: null,
        processed: null,
        backlogPerMinute: null,
        judged: false,
        judgedInSeconds: 30,
      },
      verdict,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('재는 중')).toHaveLength(2)
    await expect(
      canvas.getByRole('img', { name: '아직 판단 전' }),
    ).toBeVisible()
  },
}

export const Loading: Story = { args: { loading: true } }

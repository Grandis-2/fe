import { expect, fn } from 'storybook/test'

import { AdmissionSpeedCard } from './AdmissionSpeedCard'

import type { AdmissionSignals } from '../../lib/admissionSignals'
import type { Meta, StoryObj } from '@storybook/react-vite'

/** 따라가는 중 — 접수 = 처리, 한계는 모른다 */
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
  limit: null,
}

/** 밀리는 중 — 접수 40 > 처리 30, 그때 잰 처리가 한계 */
const congested: AdmissionSignals = {
  ...following,
  received: 40,
  processed: 30,
  backlog: 820,
  backlogPerMinute: 600,
  congested: true,
  limit: { perSecond: 30, at: 60_000 },
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
    maxCredit: 1500,
    productIds: ['p-iphone', 'p-galaxy'],
    admission: { apply: fn(), confirm: fn(), isPending: false, error: null },
    inputId: 'wr-speed-input',
  },
} satisfies Meta<typeof AdmissionSpeedCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 따라가는 중에 올리기 — 숫자만 받고, 지금 값과 다를 때만 적용이 열린다. 한계를 모르니 올린 뒤
 * 지켜보라고 한다
 */
export const FollowingRaise: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByRole('img', { name: '처리가 접수를 따라가요' }),
    ).toBeVisible()
    await expect(canvas.getByText('아직 몰라요')).toBeVisible()
    const apply = canvas.getByRole('button', { name: '적용' })
    await expect(apply).toBeDisabled()
    const input = canvas.getByLabelText('바꿀 속도(명/초)')
    await userEvent.type(input, '3a0')
    await expect(input).toHaveValue('30')
    await expect(canvas.getByText(/올린 뒤 30초쯤/)).toBeVisible()
    await userEvent.click(apply)
    await expect(args.admission.apply).toHaveBeenCalledWith(
      {
        kind: 'globalCredit',
        value: 30,
        productIds: ['p-iphone', 'p-galaxy'],
      },
      '전체 상한과 모든 상품 상한을 바꿨습니다.',
      expect.any(Function),
    )
    // 지금과 같은 값이면 적용할 게 없다.
    await userEvent.clear(input)
    await userEvent.type(input, '15')
    await expect(apply).toBeDisabled()
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

/** 밀리는 중에 낮추기 — 한계 안쪽이면 쌓인 대기가 언제 풀리는지 보인다 */
export const CongestedLower: Story = {
  args: {
    flow: { waiting: 9600, admitting: 40, signals: congested, verdict },
    globalSetting: { value: 40, source: 'OPERATIONAL' },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('지금 밀리는 중에 잰 값')).toBeVisible()
    await userEvent.type(canvas.getByLabelText('바꿀 속도(명/초)'), '25')
    await expect(
      canvas.getByText(/한계\(약 30건\/초\) 안쪽이에요/),
    ).toBeVisible()
    await expect(
      canvas.getByText(/820건이 약 2분 44초 만에 풀려요/),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: '적용' })).toBeEnabled()
  },
}

/** 밀리는 중에 올리기 — 적용과 +5를 막고 이유를 말한다 */
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
  },
  play: async ({ canvas, userEvent }) => {
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

/** 멈춘 뒤 다시 열기는 막지 않는다 — 마지막으로 잰 한계와만 비교한다 */
export const StoppedReopen: Story = {
  args: {
    flow: {
      waiting: 18240,
      admitting: 0,
      signals: { ...congested, congested: false, at: 780_000 },
      verdict,
    },
    globalSetting: { value: 0, source: 'OPERATIONAL' },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('12분 전에 잰 값')).toBeVisible()
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
      canvas.getByRole('button', { name: /기본값\(15명\/초\)으로/ }),
    ).toBeVisible()
    await expect(
      canvas.getByText('바꾸면 모든 상품 상한도 같은 값으로 바뀌어요'),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '입장 멈춤' }))
    await expect(args.admission.confirm).toHaveBeenCalled()
  },
}

/** 화면을 막 열어 표본이 둘 미만이면 재는 중 */
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

import { expect, fireEvent, waitFor, within } from 'storybook/test'

import { ThroughputChart } from './ThroughputChart'

import type { Meta, StoryObj } from '@storybook/react-vite'

const START = Date.parse('2026-10-08T05:00:00Z')
const times = Array.from({ length: 12 }, (_, index) => START + index * 5_000)

const meta = {
  component: ThroughputChart,
  tags: ['ai-generated'],
  args: {
    label: '초당 접수와 외부 등록 처리',
    unit: '건/초',
    times,
    series: [
      { label: '접수', values: [4, 8, 12, 15, 16, 16, 15, 14, 12, 10, 8, 6] },
      {
        label: '외부 등록 처리',
        values: [4, 6, 8, 9, 10, 10, 10, 10, 10, 10, 9, 8],
      },
    ],
  },
} satisfies Meta<typeof ThroughputChart>

export default meta
type Story = StoryObj<typeof meta>

/** 범례에 두 줄의 지금 값, 축 최댓값은 1·2·5 단위로 올린 값이다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const legend = within(canvas.getByRole('list'))
    await expect(legend.getByText('접수')).toBeVisible()
    await expect(legend.getByText('외부 등록 처리')).toBeVisible()
    await expect(legend.getByText('6건/초')).toBeVisible()
    await expect(legend.getByText('8건/초')).toBeVisible()
    await expect(canvas.getByText('20건/초')).toBeVisible()
    await expect(
      canvas.getByRole('img', { name: /초당 접수와 외부 등록 처리/ }),
    ).toBeVisible()
  },
}

/** 올리면 그 시각의 두 값을 보여준다 */
export const Hover: Story = {
  play: async ({ canvas }) => {
    const plot = canvas.getByRole('img', { name: /초당 접수/ })
    const box = plot.getBoundingClientRect()
    fireEvent.pointerMove(plot, { clientX: box.left + 1, clientY: box.top })
    const tooltip = within(canvas.getByRole('tooltip'))
    await expect(tooltip.getAllByText('4건/초')).toHaveLength(2)
    // React의 onPointerLeave는 pointerout으로 만들어진다.
    fireEvent.pointerOut(plot, { relatedTarget: document.body })
    await waitFor(() => expect(canvas.queryByRole('tooltip')).toBeNull())
  },
}

/** 그래프가 화면의 중심일 때(운영 대시보드) — 범례·축·툴팁 글자를 한 단계씩 키운다 */
export const Large: Story = {
  args: { size: 'large' },
}

/** 표본이 하나뿐이면 선 대신 안내 */
export const NotEnough: Story = {
  args: {
    times: [START],
    series: [
      { label: '접수', values: [1] },
      { label: '외부 등록 처리', values: [1] },
    ],
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('표본이 두 개 이상 모이면 그래프를 그립니다.'),
    ).toBeVisible()
  },
}

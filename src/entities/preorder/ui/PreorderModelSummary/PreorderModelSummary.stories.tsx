import { color } from '@shared/config/theme'
import { Button } from '@shared/ui'

import { PreorderModelSummary } from './PreorderModelSummary'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PreorderModelSummary,
  tags: ['ai-generated'],
  decorators: [
    (Story) => (
      // 어두운 바텀시트 안에 놓이는 컴포넌트라 어두운 바탕에 올린다.
      <div
        style={{
          background: color.backgroundDark.base,
          padding: 24,
          maxWidth: 640,
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PreorderModelSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    model: { name: '아이폰 18 Pro', price: 2278100 },
    caption: '출시일 2026. 10. 17.',
    action: (
      <Button rounded size="medium">
        예약하기
      </Button>
    ),
  },
}

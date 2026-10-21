import { expect } from 'storybook/test'

import { Button } from '@shared/ui'

import { BlackHoleScene } from '../BlackHoleScene'
import { OrbitScene } from '../OrbitScene'

import { ErrorScreen } from './ErrorScreen'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ErrorScreen,
  parameters: { dark: true, layout: 'fullscreen' },
  // ErrorScreen은 부모 높이를 채운다 — 페이지처럼 화면 높이를 준다.
  decorators: [
    (Story) => (
      <div
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    scene: <OrbitScene />,
    code: '404',
    label: 'PAGE NOT FOUND',
    tone: 'brand',
    title: '궤도를 벗어난 페이지예요',
    description:
      '주소가 바뀌었거나 사라진 페이지예요. 입력한 주소를 다시 확인해 주세요.',
    actions: (
      <>
        <Button rounded>홈으로 돌아가기</Button>
        <Button rounded variant="outline" color="close">
          이전 페이지
        </Button>
      </>
    ),
  },
} satisfies Meta<typeof ErrorScreen>

export default meta
type Story = StoryObj<typeof meta>

export const NotFound: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: '궤도를 벗어난 페이지예요' }),
    ).toBeVisible()
  },
}

/** 서버 오류 — 문의 코드를 문구 아래에 덧붙인다 */
export const ServerError: Story = {
  args: {
    scene: <BlackHoleScene />,
    code: '500',
    label: 'SERVER ERROR',
    tone: 'danger',
    title: '잠시 신호가 끊겼어요',
    description: '서버에 일시적인 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    children: <div>문의 코드 4bf92f3577b34da6a3ce929d0e0e4736</div>,
    actions: <Button rounded>다시 시도</Button>,
  },
}

/** 헤더가 없는 곳 — 로고를 대신 그린다 */
export const WithLogo: Story = {
  args: { showLogo: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'NOVA 홈' })).toHaveAttribute(
      'href',
      '/',
    )
  },
}

/** 관리자 본문처럼 낮은 자리 */
export const Compact: Story = {
  args: { compact: true },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', flexDirection: 'column', height: 560 }}>
        <Story />
      </div>
    ),
  ],
}

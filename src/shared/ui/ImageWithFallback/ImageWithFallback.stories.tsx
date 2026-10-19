import { expect } from 'storybook/test'

import { ImageWithFallback } from './ImageWithFallback'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ImageWithFallback,
  tags: ['ai-generated'],
  parameters: { dark: true },
  render: (args) => (
    <div style={{ width: 240, aspectRatio: '1.15', borderRadius: 12 }}>
      <ImageWithFallback
        {...args}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      />
    </div>
  ),
} satisfies Meta<typeof ImageWithFallback>

export default meta
type Story = StoryObj<typeof meta>

/** 주소가 없으면 대체 그림 — alt가 있으면 그 이름으로 읽힌다 */
export const Empty: Story = {
  args: { src: null, alt: '상품 이미지' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: '상품 이미지' })).toBeVisible()
  },
}

/** 불러오지 못한 주소도 대체 그림으로 바뀐다 */
export const Broken: Story = {
  args: { src: '/not-found.png', alt: '깨진 이미지' },
  play: async ({ canvas }) => {
    // 이미지 실패 이벤트는 네트워크를 거쳐 와서, 여러 스토리를 같이 돌리면 1초(기본)를 넘기기도 한다.
    await expect(
      await canvas.findByText(
        '이미지를 불러올 수 없어요',
        {},
        { timeout: 5000 },
      ),
    ).toBeInTheDocument()
  },
}

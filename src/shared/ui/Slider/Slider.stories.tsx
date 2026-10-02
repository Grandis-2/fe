import macbook1 from '@shared/assets/macbook_neo_sliver1.png'
import macbook2 from '@shared/assets/macbook_neo_sliver2.png'
import macbook3 from '@shared/assets/macbook_neo_sliver3.png'
import macbook4 from '@shared/assets/macbook_neo_sliver4.png'

import { Slider } from './Slider'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Slider,
  tags: ['ai-generated'],
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

const slideStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '240px',
  background: '#E8E9F5',
  fontSize: '24px',
} as const

export const Default: Story = {
  args: {
    children: [1, 2, 3].map((n) => (
      <div key={n} style={slideStyle}>
        Slide {n}
      </div>
    )),
  },
}

// PreorderCard.css.ts의 image 스타일(width 100% / aspectRatio 1:1 / objectFit cover)과
// 동일한 크기로 맞춰서, 실제 사용처와 같은 비율로 이미지 슬라이드를 확인할 수 있게 한다.
const imageStyle = {
  width: '100%',
  aspectRatio: '1 / 1',
  borderRadius: '8px',
  objectFit: 'cover',
} as const

export const WithImages: Story = {
  args: {
    children: [macbook1, macbook2, macbook3, macbook4].map((src, index) => (
      <img
        key={src}
        src={src}
        alt={`macbook ${index + 1}`}
        style={imageStyle}
      />
    )),
  },
}

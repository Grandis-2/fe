import { expect } from 'storybook/test'

import { products } from '@shared/api/mock/fixtures/product'

import { ProductDetailImages } from './ProductDetailImages'

import type { Meta, StoryObj } from '@storybook/react-vite'

const product = products[0]

const meta = {
  title: 'widgets/product-detail/ProductDetailImages',
  component: ProductDetailImages,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div data-theme="dark">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductDetailImages>

export default meta
type Story = StoryObj<typeof meta>

// 서버가 준 순서(position)대로 이어 붙인다. 영역 이름은 공백·대소문자를 무시하고 찾는다.
export const WithImages: Story = {
  args: {
    section: '구매 혜택',
    product: {
      ...product,
      images: {
        ...product.images,
        detail: [
          {
            bundleKey: '구매혜택',
            items: [
              { url: '/images/banner2.png', position: 1, primary: false },
              { url: '/images/banner1.png', position: 0, primary: true },
            ],
          },
        ],
      },
    },
  },
  play: async ({ canvas }) => {
    const images = canvas.getAllByRole('img')
    await expect(images[0]).toHaveAttribute('src', '/images/banner1.png')
    await expect(images[1]).toHaveAttribute('src', '/images/banner2.png')
  },
}

export const Empty: Story = {
  args: { section: '유의 사항', product },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('유의 사항 이미지가 아직 없어요.'),
    ).toBeInTheDocument()
  },
}

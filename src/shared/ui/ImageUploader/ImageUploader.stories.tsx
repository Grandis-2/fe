import { useState } from 'react'

import { expect, userEvent } from 'storybook/test'

import { ImageUploader, type UploadedImage } from './ImageUploader'

import type { Meta, StoryObj } from '@storybook/react-vite'

// 실제 업로드 없이 보여주려고 1x1 투명 PNG를 재사용한다.
const sample =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const makeImages = (count: number): UploadedImage[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `image-${index + 1}`,
    url: sample,
    name: `이미지 ${index + 1}`,
  }))

const meta = {
  component: ImageUploader,
  tags: ['ai-generated'],
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return <ImageUploader {...args} value={value} onChange={setValue} />
  },
} satisfies Meta<typeof ImageUploader>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { value: [], onChange: () => {}, label: '이미지' },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('이미지 추가')).toBeVisible()
    await expect(canvas.getByText('0 / 10')).toBeVisible()
  },
}

/** 옵션 이미지처럼 정사각 타일로 쓰는 경우. */
export const Filled: Story = {
  args: { value: makeImages(4), onChange: () => {}, label: '이미지' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('4 / 10')).toBeVisible()
    await userEvent.click(canvas.getByLabelText('이미지 2 삭제'))
    await expect(canvas.getByText('3 / 10')).toBeVisible()
    await expect(canvas.queryByAltText('이미지 2')).toBeNull()
  },
}

/** 상세 이미지처럼 세로로 긴 타일. */
export const Portrait: Story = {
  args: {
    value: makeImages(4),
    onChange: () => {},
    ratio: 'portrait',
    showCount: false,
  },
}

/** 최대 장수를 채우면 추가 타일이 사라진다. */
export const Full: Story = {
  args: { value: makeImages(3), onChange: () => {}, max: 3, label: '이미지' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3 / 3')).toBeVisible()
    await expect(canvas.queryByLabelText('이미지 추가')).toBeNull()
  },
}

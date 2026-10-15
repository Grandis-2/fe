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

const pngFile = (name: string) =>
  new File(
    [Uint8Array.from(atob(sample.split(',')[1]), (c) => c.charCodeAt(0))],
    name,
    {
      type: 'image/png',
    },
  )

/** upload를 주면 고르는 즉시 올리고, 끝나면 서버 주소로 바뀐다. */
export const Uploads: Story = {
  args: {
    value: [],
    onChange: () => {},
    label: '이미지',
    upload: async () => sample,
  },
  play: async ({ canvas }) => {
    await userEvent.upload(canvas.getByLabelText('이미지'), pngFile('a.png'))
    await expect(await canvas.findByAltText('a.png')).toBeVisible()
    await expect(canvas.queryByRole('status')).toBeNull()
    await expect(canvas.getByText('1 / 10')).toBeVisible()
  },
}

/** 올리는 중인 칸은 스피너로 덮는다. */
export const Uploading: Story = {
  args: {
    value: [{ ...makeImages(1)[0], status: 'uploading' }],
    onChange: () => {},
    label: '이미지',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      '이미지 1 올리는 중',
    )
  },
}

/** 실패하면 칸에 오류를 보여주고, ↻로 같은 파일을 다시 올린다. */
export const FailsThenRetries: Story = {
  args: { value: [], onChange: () => {}, label: '이미지' },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    const [attempts, setAttempts] = useState(0)
    return (
      <ImageUploader
        {...args}
        value={value}
        onChange={setValue}
        upload={async () => {
          setAttempts((count) => count + 1)
          if (attempts === 0) throw new Error('사진을 올리지 못했습니다.')
          return sample
        }}
      />
    )
  },
  play: async ({ canvas }) => {
    await userEvent.upload(canvas.getByLabelText('이미지'), pngFile('b.png'))
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      '사진을 올리지 못했습니다.',
    )
    await userEvent.click(canvas.getByLabelText('b.png 다시 올리기'))
    await expect(canvas.queryByRole('alert')).toBeNull()
    await expect(canvas.getByAltText('b.png')).toBeVisible()
  },
}

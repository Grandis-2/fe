import { Search } from 'lucide-react'
import { expect, waitFor } from 'storybook/test'

import { color } from '@shared/config/theme'

import { Input } from './Input'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Input,
  tags: ['ai-generated'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: '이름' },
}

export const Focused: Story = {
  args: { label: '이름' },
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole('textbox')
    await userEvent.click(field)
    await expect(field).toHaveFocus()

    const label = canvas.getByText('이름')
    await waitFor(() => expect(label).toHaveStyle({ fontSize: '12px' }))
    // 포커스하면 라벨도 포커스 색으로 올라온다(Input.css.ts의 :focus-within).
    await expect(label).toHaveStyle({ color: 'rgb(63, 72, 145)' }) // primary.base
  },
}

export const Filled: Story = {
  args: { label: '이름', defaultValue: '주현' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox')
    await expect(field).toHaveValue('주현')
    await expect(field).toHaveStyle({ color: 'rgb(40, 47, 100)' }) // primary.focus

    const label = canvas.getByText('이름')
    await expect(label).toHaveStyle({ fontSize: '12px' })
  },
}

export const Required: Story = {
  args: { label: '이름', required: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('이름 *')).toBeVisible()
    await expect(canvas.getByRole('textbox')).toBeRequired()
    await expect(
      canvas.queryByText(/필수로 작성해주세요/),
    ).not.toBeInTheDocument()
  },
}

export const Invalid: Story = {
  args: { label: '휴대폰 번호', required: true, invalid: true },
  play: async ({ canvas }) => {
    const message = canvas.getByText('휴대폰 번호을(를) 필수로 작성해주세요')
    await expect(message).toBeVisible()

    const label = canvas.getByText('휴대폰 번호 *')
    await expect(label).toHaveStyle({ color: 'rgb(220, 38, 38)' }) // status.danger

    const field = canvas.getByRole('textbox')
    await expect(field).toHaveStyle({ color: 'rgb(220, 38, 38)' })
    await expect(field).toBeRequired()
  },
}

export const InvalidWithoutRequired: Story = {
  args: { label: '이름', invalid: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText(/필수로 작성해주세요/),
    ).not.toBeInTheDocument()
  },
}

export const Stacked: Story = {
  args: {
    label: '상세 주소',
    variant: 'stacked',
    placeholder: '동, 호수',
    required: true,
  },
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{ padding: 24, background: color.background.base }}
      >
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    await expect(canvas.getByText('상세 주소 *')).toBeVisible()
    await expect(canvas.getByPlaceholderText('동, 호수')).toBeVisible()
  },
}

/** 위 라벨 없이 칸만 — 화면엔 안 보여도 label이 칸 이름으로 읽힌다 */
export const StackedWithoutLabel: Story = {
  args: {
    label: '상품 검색',
    variant: 'stacked',
    hideLabel: true,
    placeholder: '상품명으로 검색',
    icon: <Search />,
  },
  decorators: Stacked.decorators,
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('상품 검색')).not.toBeInTheDocument()
    await expect(
      canvas.getByRole('textbox', { name: '상품 검색' }),
    ).toBeVisible()
  },
}

/** 아이콘이 있으면 라벨을 띄우지 않고 placeholder로 보여준다 */
export const WithIcon: Story = {
  args: { label: '검색어', icon: <Search /> },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('검색어')).not.toBeInTheDocument()
    await expect(
      canvas.getByRole('textbox', { name: '검색어' }),
    ).toHaveAttribute('placeholder', '검색어')
  },
}

/** 필수 누락 말고도 형식·길이 오류 문구를 그 칸에 붙인다 — 스크린리더도 같이 읽는다 */
export const WithErrorMessage: Story = {
  args: { label: '모델명', error: '모델명은 40자까지입니다.' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: /모델명/ })
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(field).toHaveAccessibleDescription('모델명은 40자까지입니다.')
  },
}

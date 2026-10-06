import { useState } from 'react'

import { expect, waitFor } from 'storybook/test'

import { Dropdown } from './Dropdown'

import type { DropdownOption, DropdownProps } from './Dropdown'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Dropdown,
  tags: ['ai-generated'],
} satisfies Meta<DropdownProps<string>>

export default meta
type Story = StoryObj<typeof meta>

const options: DropdownOption<string>[] = [
  { label: '서울특별시', value: 'SEOUL' },
  { label: '경기도', value: 'GYEONGGI' },
  { label: '부산광역시', value: 'BUSAN' },
]

export const Closed: Story = {
  args: { label: '지역 선택', options, open: false },
}

export const Open: Story = {
  args: { label: '지역 선택', options, open: true, value: 'GYEONGGI' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '경기도', expanded: true }),
    ).toBeInTheDocument()
    await waitFor(() => expect(canvas.getByText('부산광역시')).toBeVisible())
  },
}

/** 열림 상태를 안 넘기면 컴포넌트가 직접 들고 여닫는다 */
export const Uncontrolled: Story = {
  args: { label: '지역 선택', options },
  // args를 펼치면 Storybook이 제네릭을 unknown으로 추론해 들어오므로 직접 조립한다.
  render: function Render() {
    const [value, setValue] = useState<string>()
    return (
      <Dropdown
        label="지역 선택"
        options={options}
        value={value}
        onSelect={setValue}
      />
    )
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: '지역 선택' })

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByText('부산광역시')).not.toBeInTheDocument()

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const busanOption = canvas.getByRole('button', { name: '부산광역시' })
    await waitFor(() => expect(busanOption).toBeVisible())

    await userEvent.click(busanOption)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveTextContent('부산광역시')

    // 위/아래 키로 열고 항목 사이를 옮긴다.
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{ArrowDown}')
    await expect(
      canvas.getByRole('button', { name: '서울특별시' }),
    ).toHaveFocus()

    // Esc로 닫히고 포커스가 트리거로 돌아온다.
    await userEvent.keyboard('{Escape}')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveFocus()

    // 메뉴 밖을 누르면 닫힌다.
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(document.body)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  },
}

/** 라벨이 같아도 값이 다르면 고른 항목 하나만 표시된다 */
export const DuplicateLabels: Story = {
  args: {
    label: '상품 선택',
    open: true,
    value: 'P2',
    options: [
      { label: '갤럭시 G999', value: 'P1' },
      { label: '갤럭시 G999', value: 'P2' },
    ],
  },
  play: async ({ canvas }) => {
    const matched = canvas
      .getAllByRole('button', { name: '갤럭시 G999' })
      .filter((button) => button.getAttribute('aria-expanded') === null)

    await expect(matched).toHaveLength(2)
    await expect(matched[0]).not.toHaveStyle({
      backgroundColor: 'rgb(232, 233, 245)',
    })
    await expect(matched[1]).toHaveStyle({
      backgroundColor: 'rgb(232, 233, 245)',
    })
  },
}

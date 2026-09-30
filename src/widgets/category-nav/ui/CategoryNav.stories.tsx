import { expect, waitFor } from 'storybook/test'

import { CategoryNav } from './CategoryNav'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: CategoryNav,
  tags: ['ai-generated'],
} satisfies Meta<typeof CategoryNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const ActiveLink: Story = {
  args: { activeLink: '이벤트' },
}

// 메뉴는 CSS :hover/:focus-within으로만 열린다. 헤드리스 브라우저는 hover 가능 기기로
// 잡히지 않아 :hover 경로를 재현할 수 없으므로, 여기선 포커스 경로를 확인한다
// (둘 다 같은 규칙을 쓰므로 하나가 열리면 다른 쪽도 열린다).
export const BrandMenuOpen: Story = {
  args: {},
  play: async ({ canvas, userEvent }) => {
    // 닫혀 있는 동안엔 visibility: hidden이라 접근성 이름이 빈 값이 된다 → 역할 대신 텍스트로 집는다.
    const tile = canvas.getByText('스마트폰')
    await expect(tile).not.toBeVisible()

    await userEvent.tab()
    await waitFor(() => expect(tile).toBeVisible())

    // 딤은 body::after라 요소로 못 집는다 — 계산된 스타일로 확인한다.
    const dim = () => getComputedStyle(document.body, '::after').opacity
    await waitFor(() => expect(dim()).toBe('1'))
  },
}

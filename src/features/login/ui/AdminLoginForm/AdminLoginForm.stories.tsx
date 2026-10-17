import { expect, fn, userEvent } from 'storybook/test'

import { AdminLoginForm } from './AdminLoginForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminLoginForm,
  tags: ['ai-generated'],
  args: { onLoggedIn: fn() },
} satisfies Meta<typeof AdminLoginForm>

export default meta
type Story = StoryObj<typeof meta>

const submitButton = () =>
  document.body.querySelector('button[type="submit"]') as HTMLButtonElement

/** 빈 칸으로는 보낼 수 없다 — 서버가 400을 주기 전에 막는다 */
export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '로그인' })).toBeDisabled()
  },
}

/** 둘 다 채우면 열린다. 비밀번호는 가려진다 */
export const Filled: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('아이디'), 'admin')
    await userEvent.type(canvas.getByLabelText('비밀번호'), 'admin1234')

    await expect(canvas.getByLabelText('비밀번호')).toHaveAttribute(
      'type',
      'password',
    )
    await expect(canvas.getByRole('button', { name: '로그인' })).toBeEnabled()
  },
}

/** 공백만 넣은 것도 빈 칸으로 본다 */
export const BlankUsername: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('아이디'), '   ')
    await userEvent.type(canvas.getByLabelText('비밀번호'), 'admin1234')
    await expect(canvas.getByRole('button', { name: '로그인' })).toBeDisabled()
  },
}

/**
 * 요청이 실패하면 안내가 뜨고 다시 보낼 수 있다.
 * Storybook엔 API 서버도 MSW도 없어 제출이 곧 실패한다(preview.tsx).
 */
export const ShowsError: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('아이디'), 'admin')
    await userEvent.type(canvas.getByLabelText('비밀번호'), 'wrong')
    await userEvent.click(canvas.getByRole('button', { name: '로그인' }))

    // 요청이 실패해 돌아오기를 기다린다 — 기본 1초로는 전체 스위트에서 못 기다린다.
    const alert = await canvas.findByRole('alert', {}, { timeout: 8000 })
    await expect(alert).toBeVisible()
    // 실패해도 다시 시도할 수 있어야 한다 — 버튼이 잠긴 채 남으면 안 된다.
    await expect(submitButton()).toBeEnabled()
  },
}

/** 회원으로 로그인한 채 관리자 주소로 들어온 경우 — 왜 여기 왔는지 알려 준다 */
export const NotAdminNotice: Story = {
  args: {
    notice: '관리자 계정으로 로그인해 주세요.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      '관리자 계정으로 로그인해 주세요.',
    )
  },
}

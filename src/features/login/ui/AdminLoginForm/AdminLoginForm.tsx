import { useState, type FormEvent } from 'react'

import { Lock } from 'lucide-react'

import { getErrorMessage } from '@shared/api/client'
import { Button, InlineAlert, Input } from '@shared/ui'

import { useAdminLogin } from '../../lib/useAdminLogin'

import * as styles from './AdminLoginForm.css'

export type AdminLoginFormProps = {
  onLoggedIn: () => void
  /**
   * 로그인은 됐지만 관리자가 아닐 때 왜 이 화면에 왔는지 알려 준다 —
   * 아무 설명 없이 로그인 화면이 다시 나오면 로그인이 풀린 줄 안다.
   */
  notice?: string
}

export function AdminLoginForm({ onLoggedIn, notice }: AdminLoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, isPending, error, waitSeconds } = useAdminLogin(onLoggedIn)

  // 아이디·비밀번호가 비면 서버가 400을 주는데, 시도 전에 막는 게 낫다.
  const filled = username.trim() !== '' && password !== ''
  const blocked = isPending || waitSeconds > 0 || !filled

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (blocked) return
    login({ username, password })
  }

  return (
    <form
      className={styles.root}
      aria-labelledby="admin-login-title"
      onSubmit={handleSubmit}
    >
      <div className={styles.heading}>
        <span className={styles.eyebrow}>관리자 전용</span>
        <h2 id="admin-login-title" className={styles.title}>
          관리자 로그인
        </h2>
        <div className={styles.lead}>
          발급받은 관리자 계정으로 들어와 주세요.
        </div>
      </div>

      {notice && <InlineAlert status="info">{notice}</InlineAlert>}

      {error && (
        <InlineAlert status="error">
          {/* 아이디·비밀번호 중 어느 쪽이 틀렸는지는 서버가 알려 주지 않는다. */}
          {getErrorMessage(error, '로그인 정보를 확인해 주세요.')}
        </InlineAlert>
      )}

      <Input
        label="아이디"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <Input
        label="비밀번호"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <Button type="submit" disabled={blocked}>
        {waitSeconds > 0
          ? `${waitSeconds}초 후 다시 시도`
          : isPending
            ? '로그인 중…'
            : '로그인'}
      </Button>

      <div className={styles.hint}>
        <Lock className={styles.hintIcon} aria-hidden="true" />
        관리자로 로그인하면 회원 로그인은 해제됩니다.
      </div>
    </form>
  )
}

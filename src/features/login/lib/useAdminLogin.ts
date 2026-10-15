import { useEffect, useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { loginAsAdmin } from '@entities/auth'
import type { AdminLoginRequest } from '@entities/auth'
import { ApiRequestError } from '@shared/api/client'

/** 429가 준 남은 대기 초. 429가 아니면 0이다. */
const retryAfterOf = (caught: unknown) =>
  caught instanceof ApiRequestError && caught.status === 429
    ? (caught.error.details?.retryAfterSeconds ?? 1)
    : 0

/**
 * 관리자 로그인. 시도 제한(429)에 걸리면 맞는 비밀번호여도 거절되므로, 남은 초를
 * 세면서 그 동안 제출을 막는다 — 계속 누르면 제한이 다시 늘어난다.
 */
export function useAdminLogin(onSuccess: () => void) {
  const [waitSeconds, setWaitSeconds] = useState(0)

  const login = useMutation({
    mutationFn: (body: AdminLoginRequest) => loginAsAdmin(body),
    onSuccess,
    onError: (caught) => setWaitSeconds(retryAfterOf(caught)),
  })

  useEffect(() => {
    if (waitSeconds < 1) return
    const timer = setTimeout(() => setWaitSeconds((left) => left - 1), 1000)
    return () => clearTimeout(timer)
  }, [waitSeconds])

  return {
    login: login.mutate,
    isPending: login.isPending,
    error: login.error,
    // 대기 중이면 제출을 막는다. 남은 초는 버튼 문구로 보여 준다.
    waitSeconds,
  }
}

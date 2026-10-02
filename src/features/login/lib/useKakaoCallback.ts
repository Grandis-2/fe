import { useEffect, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import { loginWithKakao } from '@entities/auth'
import { ApiRequestError } from '@shared/api/client'
import { HOME_PATH, SIGNUP_PATH } from '@shared/config/routes'

import { KAKAO_CALLBACK_PATH } from './getKakaoAuthorizeUrl'
import { consumeReturnTo, consumeStoredState } from './kakaoState'

type Status = 'processing' | 'error'

const GENERIC_ERROR = '로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요.'

// 카카오 인가 코드 콜백을 처리한다 — state 검증 → 세션 발급 → 돌아갈 화면(또는 /signup)으로 이동.
// 실패하면 메시지를 보여 준 뒤 로그인을 시작한 화면으로 돌려보낸다.
export function useKakaoCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('processing')
  const [message, setMessage] = useState(GENERIC_ERROR)
  // StrictMode에서 effect가 두 번 실행돼도 code(1회용)를 두 번 보내지 않도록 막는다.
  const started = useRef(false)
  // 성공/실패 모두 로그인을 시작한 화면으로 돌아간다 — state와 같이 한 번만 소비한다.
  const destination = useRef(HOME_PATH)

  useEffect(() => {
    if (started.current) return
    started.current = true
    destination.current = consumeReturnTo()

    async function run() {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      // state는 성공/실패와 무관하게 여기서 한 번만 소비한다.
      const stateValid = consumeStoredState(state)

      if (error) {
        setStatus('error')
        setMessage('로그인을 취소했습니다.')
        return
      }
      if (!stateValid || !code) {
        setStatus('error')
        setMessage(GENERIC_ERROR)
        return
      }

      const redirectUri = `${window.location.origin}${KAKAO_CALLBACK_PATH}`

      try {
        const { profileComplete } = await loginWithKakao({ code, redirectUri })
        // code는 1회용이라 새로고침으로 같은 code를 다시 보내면 반드시 실패한다 —
        // history.replaceState 대신 react-router의 replace 내비게이션으로 URL을 정리한다.
        //
        // profileComplete가 false면 여기서 바로 /signup으로 보낸다 — RootLayout에도
        // 같은 걸 보는 게이트가 있지만(새로고침으로 재발급을 탄 경우를 잡으려면 거기서도
        // 봐야 한다), 이 시점엔 이미 방금 받은 session이 있어 굳이 한 프레임 더 돌아
        // /products/1 같은 목적지에 잠깐 갔다가 다시 튕길 이유가 없다.
        navigate(profileComplete ? destination.current : SIGNUP_PATH, {
          replace: true,
          state: profileComplete ? undefined : { from: destination.current },
        })
      } catch (caught) {
        setStatus('error')
        setMessage(
          caught instanceof ApiRequestError &&
            caught.error.code === 'INVALID_OAUTH_CALLBACK'
            ? '로그인 코드가 만료되었거나 이미 사용됐습니다. 다시 시도해 주세요.'
            : GENERIC_ERROR,
        )
      }
    }

    void run()
  }, [navigate, searchParams])

  useEffect(() => {
    if (status !== 'error') return
    const timer = setTimeout(
      () => navigate(destination.current, { replace: true }),
      2000,
    )
    return () => clearTimeout(timer)
  }, [status, navigate])

  return { status, message }
}

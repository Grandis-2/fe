import { useState } from 'react'

import { flushSync } from 'react-dom'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { useSession } from '@entities/auth'
import { SignupBackground, SignupForm, SignupResult } from '@features/signup'
import { HOME_PATH } from '@shared/config/routes'

import * as styles from './SignupPage.css'

export function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthReady, isSignupPending } = useSession()
  // 가입을 마친 사람의 이름 — 있으면 환영 화면을 보여준다.
  const [welcomeName, setWelcomeName] = useState<string | null>(null)
  // 저장 실패 화면. 다시 시도하면 입력값 그대로 폼으로 돌아간다(폼은 숨겨 둔 채 유지).
  const [isFailed, setIsFailed] = useState(false)

  // 로그인이 필요한 곳에서 넘어왔으면 환영 화면 없이 그곳으로 돌려보낸다. 카카오 콜백은
  // 갈 곳이 없을 때도 홈을 from으로 넘기므로, 홈이면 환영 화면을 보여준다.
  const handleComplete = (name: string) => {
    const from = (location.state as { from?: string } | null)?.from
    if (from && from !== HOME_PATH) {
      navigate(from, { replace: true })
      return
    }
    // 폼은 이 직후 가입 완료(markProfileComplete)를 반영한다. 그 변경은 즉시 다시 그려지는데
    // 일반 setState는 그 뒤에 반영돼, 아래 가드가 먼저 홈으로 보낸다 — 환영 상태를 먼저 확정한다.
    flushSync(() => setWelcomeName(name))
  }

  // 가입 진행 중(카카오만 마침)인 사용자만 이 화면을 쓴다 — 비회원은 PUT할 세션이
  // 없고, 회원은 이미 가입을 마쳤다. 방금 가입을 마친 사람은 환영 화면을 봐야 하므로 제외.
  if (welcomeName === null && isAuthReady && !isSignupPending) {
    return <Navigate to={HOME_PATH} replace />
  }

  return (
    <div className={styles.root} data-header-theme="dark">
      <SignupBackground
        scene={welcomeName !== null ? 'welcome' : isFailed ? 'failed' : 'form'}
      />
      <div className={styles.content}>
        {welcomeName !== null ? (
          <div className={styles.result}>
            <SignupResult status="success" name={welcomeName} />
          </div>
        ) : (
          <>
            <div hidden={isFailed}>
              <SignupForm
                onComplete={handleComplete}
                onFail={() => setIsFailed(true)}
              />
            </div>
            {isFailed && (
              <div className={styles.result}>
                <SignupResult
                  status="fail"
                  onRetry={() => setIsFailed(false)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'

import { typography } from '@shared/config/theme'
import { InlineAlert } from '@shared/ui'

import { getKakaoAuthorizeUrl } from '../../lib/getKakaoAuthorizeUrl'

import * as styles from './KakaoLoginModal.css'

const FALLBACK_ERROR = '로그인을 시작할 수 없습니다. 다시 시도해 주세요.'

// 로그인 모달의 내용. 제목·안내 문구는 Modal이 그린다 — openLoginModal()로 띄운다.
export type KakaoLoginModalProps = {
  /** 로그인 후 돌아갈 경로. 없으면 모달을 연 지금 화면으로 돌아온다. */
  returnTo?: string
}

export function KakaoLoginModal({ returnTo }: KakaoLoginModalProps) {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className={styles.content}>
      {error && <InlineAlert status="error">{error}</InlineAlert>}
      <button
        type="button"
        className={[typography.button.mdBold, styles.kakaoButton].join(' ')}
        onClick={() => {
          try {
            window.location.href = getKakaoAuthorizeUrl(returnTo)
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : FALLBACK_ERROR)
          }
        }}
      >
        카카오로 로그인
      </button>
    </div>
  )
}

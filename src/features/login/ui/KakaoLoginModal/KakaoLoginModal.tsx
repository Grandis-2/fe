import { useState } from 'react'

import { typography } from '@shared/config/theme'
import { InlineAlert, ModalTitle } from '@shared/ui'

import { getKakaoAuthorizeUrl } from '../../lib/getKakaoAuthorizeUrl'

import * as styles from './KakaoLoginModal.css'

const FALLBACK_ERROR = '로그인을 시작할 수 없습니다. 다시 시도해 주세요.'

// 모달 껍데기(backdrop·X·애니메이션)는 shared/ui/Modal이 갖고 있다 —
// 여기선 내용만 만들고, 여는 쪽이 useModalStore.open(<KakaoLoginModal />)로 띄운다.
export function KakaoLoginModal() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className={styles.content}>
      <ModalTitle
        className={[typography.title.lgSemibold, styles.title].join(' ')}
      >
        로그인
      </ModalTitle>
      <div className={[typography.body.sub, styles.description].join(' ')}>
        카카오 계정으로 간편하게 시작하세요
      </div>
      {error && <InlineAlert status="error">{error}</InlineAlert>}
      <button
        type="button"
        className={[typography.button.mdBold, styles.kakaoButton].join(' ')}
        onClick={() => {
          try {
            window.location.href = getKakaoAuthorizeUrl()
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

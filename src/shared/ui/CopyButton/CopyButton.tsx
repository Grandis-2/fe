import { Copy } from 'lucide-react'

import { copyText } from '@shared/lib/copyText'
import { showToast } from '@shared/model/toastStore'

import * as styles from './CopyButton.css'

export type CopyButtonProps = {
  /** 복사할 글자 */
  value: string
  /** 무엇을 복사하는지 — 버튼 이름과 결과 안내에 쓴다(예: 'messageId') */
  label: string
  /** 아이콘 옆에 글자도 보일지 */
  showLabel?: boolean
  className?: string
}

/** 값을 클립보드에 복사하고 결과를 토스트로 알린다. 클립보드를 못 쓰는 환경이면 실패를 알린다 */
export function CopyButton({
  value,
  label,
  showLabel = false,
  className,
}: CopyButtonProps) {
  return (
    <button
      type="button"
      className={[showLabel ? styles.withLabel : styles.icon, className]
        .filter(Boolean)
        .join(' ')}
      aria-label={showLabel ? undefined : `${label} 복사`}
      onClick={() =>
        copyText(value).then(
          () => showToast(`${label}을(를) 복사했습니다.`),
          () => showToast(`${label}을(를) 복사하지 못했습니다.`),
        )
      }
    >
      <Copy className={styles.glyph} aria-hidden="true" />
      {showLabel && `${label} 복사`}
    </button>
  )
}

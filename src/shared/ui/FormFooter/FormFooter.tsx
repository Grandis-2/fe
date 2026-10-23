import type { ReactNode } from 'react'

import { Eye } from 'lucide-react'

import { Button } from '../Button'

import * as styles from './FormFooter.css'

export type FormFooterProps = {
  /** 주면 왼쪽에 미리보기 버튼이 붙는다 */
  onPreview?: () => void
  /** 버튼 사이에 띄우는 결과 문구(오류 등). 없으면 빈 자리로 남는다 */
  message?: ReactNode
  /** 오른쪽 버튼 — 취소·저장 */
  children: ReactNode
}

/**
 * 관리자 폼 맨 아래 버튼 줄. 스크롤해도 화면 아래에 붙어 있다 — 폼이 길어서 저장하려고
 * 끝까지 내려가지 않아도 된다. 폼(form) 안 마지막에 둔다.
 */
export function FormFooter({ onPreview, message, children }: FormFooterProps) {
  return (
    <div className={styles.root}>
      {onPreview && (
        <Button
          type="button"
          variant="outline"
          color="primary"
          icon={Eye}
          onClick={onPreview}
        >
          미리보기
        </Button>
      )}
      {/* 버튼은 화면 아래에 붙어 있어 맨 위 알림은 안 보인다 — 누른 자리에서 결과를
          알린다. 새로 생기면 스크린리더가 읽도록 alert로 둔다. */}
      <div className={styles.message} role="alert">
        {message}
      </div>
      <div className={styles.actions}>{children}</div>
    </div>
  )
}

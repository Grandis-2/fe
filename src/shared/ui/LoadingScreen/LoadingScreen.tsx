import { LoaderCircle } from 'lucide-react'

import * as styles from './LoadingScreen.css'

export type LoadingScreenProps = {
  // 무엇을 하고 있는지(예: '결제를 확인하고 있어요').
  children: React.ReactNode
  // 제목 아래 보조 문구. 기본은 진행 중이라는 안내.
  description?: React.ReactNode
}

/**
 * 콜백 화면(카카오 로그인·결제 승인)처럼 다른 내용 없이 처리만 기다리는 화면의 로딩.
 * 화면 가운데에 도는 아이콘과 문구를 둔다.
 */
export function LoadingScreen({
  children,
  description = '진행 중이에요. 잠시만 기다려 주세요.',
}: LoadingScreenProps) {
  return (
    // 회원 화면은 늘 어두운 테마다 — 지정하지 않으면 밝은 테마 글자색이 어두운 바탕에 묻힌다.
    <div className={styles.root} role="status" data-theme="dark">
      <LoaderCircle className={styles.spinner} size={40} aria-hidden="true" />
      <div className={styles.title}>{children}</div>
      <div className={styles.description}>{description}</div>
    </div>
  )
}

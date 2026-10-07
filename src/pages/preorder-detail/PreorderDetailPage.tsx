import { useParams } from 'react-router'

import { findMockPreorder } from '@entities/preorder'
import { Container, InlineAlert } from '@shared/ui'
import { PreorderDetail } from '@widgets/preorder-detail'

import * as styles from './PreorderDetailPage.css'

// 목록 페이지와 같은 어두운 바탕 — 헤더 뒤까지 끌어올리고 헤더 글자는 흰색(data-header-theme).
export function PreorderDetailPage() {
  const { preorderId } = useParams()
  const preorder = findMockPreorder(preorderId)

  return (
    <div className={styles.root} data-header-theme="dark">
      <Container desktopPaddingY={40}>
        {preorder ? (
          <PreorderDetail preorder={preorder} />
        ) : (
          <InlineAlert status="error">사전예약을 찾을 수 없어요.</InlineAlert>
        )}
      </Container>
    </div>
  )
}

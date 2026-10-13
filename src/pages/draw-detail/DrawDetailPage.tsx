import { useParams } from 'react-router'

import { Container } from '@shared/ui'
import { DrawDetail } from '@widgets/draw-detail'

import * as styles from './DrawDetailPage.css'

// 목록 페이지와 같은 어두운 바탕 — 헤더 뒤까지 끌어올리고 헤더 글자는 흰색(data-header-theme).
// 응모 다이얼로그의 입력칸이 어둡게 뜨도록 페이지에 data-theme="dark"를 둔다.
export function DrawDetailPage() {
  const { drawId = '' } = useParams()

  return (
    <div className={styles.root} data-theme="dark" data-header-theme="dark">
      <Container desktopPaddingY={40}>
        <DrawDetail drawId={drawId} />
      </Container>
    </div>
  )
}

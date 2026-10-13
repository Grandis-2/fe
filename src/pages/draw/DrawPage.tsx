import { Container } from '@shared/ui'
import { DrawList } from '@widgets/draw-list'

import * as styles from './DrawPage.css'

// 헤더는 투명이라, 배경을 헤더 높이만큼 끌어올려 헤더 뒤까지 빛이 이어지게 한다.
// data-header-theme="dark"로 헤더 글자는 흰색이 된다(useHeaderTheme).
export function DrawPage() {
  return (
    <div className={styles.root} data-header-theme="dark">
      <Container>
        <DrawList />
      </Container>
    </div>
  )
}

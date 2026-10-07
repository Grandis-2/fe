import { useNavigate } from 'react-router'

import { HOME_PATH } from '@shared/config/routes'
import { Button, Container, PlanetIcon } from '@shared/ui'

import * as styles from './NotFoundPage.css'

// 없는 주소로 들어왔을 때만 쓴다 — 서버 장애(5xx·네트워크)는 다시 시도하면 될 수 있어서
// "없다"고 말하지 않고 각 화면에서 재시도를 안내한다.
export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Container>
      <div className={styles.root}>
        <PlanetIcon size={200} className={styles.illustration} />
        <div className={styles.code}>404</div>
        <div className={styles.texts}>
          <div className={styles.title}>페이지를 찾을 수 없어요</div>
          <div className={styles.description}>
            주소가 잘못되었거나 삭제된 페이지예요.
          </div>
        </div>
        <Button icon="globe" onClick={() => void navigate(HOME_PATH)}>
          홈으로
        </Button>
      </div>
    </Container>
  )
}

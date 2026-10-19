import { useLocation, useNavigate } from 'react-router'

import { HOME_PATH } from '@shared/config/routes'
import { Button } from '@shared/ui'
import { ErrorScreen, OrbitScene } from '@widgets/error-screen'

import * as styles from './NotFoundPage.css'

// 없는 주소로 들어왔을 때만 쓴다 — 서버 장애(5xx·네트워크)는 다시 시도하면 될 수 있어서
// "없다"고 말하지 않고 각 화면에서 재시도를 안내한다.
export function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // 바깥 링크로 바로 들어왔으면(첫 기록은 key가 'default') 앱 밖으로 돌아가지 않게 홈으로 보낸다.
  const goBack = () =>
    location.key !== 'default' ? void navigate(-1) : void navigate(HOME_PATH)

  return (
    <div className={styles.root} data-header-theme="dark">
      <ErrorScreen
        scene={<OrbitScene />}
        code="404"
        label="PAGE NOT FOUND"
        tone="brand"
        title="궤도를 벗어난 페이지예요"
        description="주소가 바뀌었거나 사라진 페이지예요. 입력한 주소를 다시 확인해 주세요."
        actions={
          <>
            <Button rounded onClick={() => void navigate(HOME_PATH)}>
              홈으로 돌아가기
            </Button>
            <Button rounded variant="outline" color="close" onClick={goBack}>
              이전 페이지
            </Button>
          </>
        }
      />
    </div>
  )
}

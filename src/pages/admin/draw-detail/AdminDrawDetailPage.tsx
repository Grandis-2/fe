import { useParams } from 'react-router'

import { useAdminDraw } from '@entities/admin-draw'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_DRAWS_PATH } from '@shared/config/routes'
import { Breadcrumb, PageSkeleton } from '@shared/ui'
import { AdminDrawDetail } from '@widgets/admin/draw-detail'

import * as styles from './AdminDrawDetailPage.css'

/** 주소에서 회차를 읽어 진행 위젯에 넘긴다. 회차 조회 실패·로딩은 여기서 보여준다 */
export function AdminDrawDetailPage() {
  const { drawId = '' } = useParams()
  const draw = useAdminDraw(drawId)

  if (!draw.data) {
    // 불러오는 중이면 화면 모양을 먼저 깐다 — 실패일 때만 안내와 돌아갈 길을 보인다.
    if (!draw.isError) {
      return (
        <div className={styles.root}>
          <PageSkeleton sections={3} fieldsPerSection={1} />
        </div>
      )
    }
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          {getErrorMessage(draw.error, '회차를 불러오지 못했습니다.')}
          <Breadcrumb
            items={[
              { label: '럭키드로우 관리로 돌아가기', to: ADMIN_DRAWS_PATH },
            ]}
          />
        </div>
      </div>
    )
  }

  // 브레드크럼은 위젯이 마지막 갱신과 한 줄에 그린다.
  return (
    <div className={styles.root}>
      {/* 회차는 만든 뒤 바뀌지 않아 다시 받지 않는다 — 진행만 위젯이 자동으로 다시 받는다. */}
      <AdminDrawDetail draw={draw.data} fetchedAt={draw.dataUpdatedAt} />
    </div>
  )
}

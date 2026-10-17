import { useNavigate } from 'react-router'

import { useCreateAdminDraw } from '@entities/admin-draw'
import {
  ADMIN_DRAWS_PATH,
  ADMIN_PRODUCT_NEW_PATH,
  adminDrawPath,
} from '@shared/config/routes'
import { showToast } from '@shared/model/toastStore'
import { Breadcrumb } from '@shared/ui'
import { AdminDrawForm } from '@widgets/admin/draw-form'

import * as styles from './AdminDrawNewPage.css'

export function AdminDrawNewPage() {
  const navigate = useNavigate()
  const create = useCreateAdminDraw()

  return (
    <div className={styles.root}>
      <Breadcrumb
        items={[
          { label: '럭키드로우 관리', to: ADMIN_DRAWS_PATH },
          { label: '회차 만들기' },
        ]}
      />

      <h1 className={styles.title}>회차 만들기</h1>

      <AdminDrawForm
        submitting={create.isPending}
        submitError={create.error}
        onSubmit={(value) =>
          create.mutate(value, {
            onSuccess: (draw) => {
              showToast('회차를 만들었습니다.')
              navigate(adminDrawPath(draw.drawId))
            },
          })
        }
        onCancel={() => navigate(ADMIN_DRAWS_PATH)}
        onAddProduct={() => navigate(ADMIN_PRODUCT_NEW_PATH)}
        onStartOver={() => {
          create.startOver()
          create.reset()
        }}
      />
    </div>
  )
}

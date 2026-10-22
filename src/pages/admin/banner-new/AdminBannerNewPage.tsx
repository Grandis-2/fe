import { useNavigate } from 'react-router'

import { useCreateAdminBanner } from '@entities/admin-banner'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_BANNERS_PATH } from '@shared/config/routes'
import { showToast } from '@shared/model/toastStore'
import { InlineAlert } from '@shared/ui'
import { AdminBannerForm, useBannerTargets } from '@widgets/admin/banner-form'

import * as styles from './AdminBannerNewPage.css'

export function AdminBannerNewPage() {
  const navigate = useNavigate()
  const targets = useBannerTargets()
  const create = useCreateAdminBanner()

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>새 배너</h1>

      {create.isError && (
        <InlineAlert status="error">
          {getErrorMessage(create.error, '배너를 만들지 못했습니다.')}
        </InlineAlert>
      )}

      <AdminBannerForm
        targets={targets}
        submitting={create.isPending}
        onSubmit={(value) =>
          create.mutate(value, {
            onSuccess: () => {
              showToast('배너를 만들었습니다.')
              navigate(ADMIN_BANNERS_PATH)
            },
          })
        }
        onCancel={() => navigate(ADMIN_BANNERS_PATH)}
      />
    </div>
  )
}

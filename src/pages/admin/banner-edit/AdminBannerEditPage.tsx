import { useNavigate, useParams } from 'react-router'

import {
  toBannerFormValue,
  useAdminBanners,
  useUpdateAdminBanner,
} from '@entities/admin-banner'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_BANNERS_PATH } from '@shared/config/routes'
import { showToast } from '@shared/model/toastStore'
import { Breadcrumb, InlineAlert, PageSkeleton } from '@shared/ui'
import { AdminBannerForm, useBannerTargets } from '@widgets/admin/banner-form'

import * as styles from './AdminBannerEditPage.css'

// 배너 하나를 묻는 API가 없어 목록에서 찾는다 — 목록에서 들어오면 캐시라 바로 뜬다.
export function AdminBannerEditPage() {
  const navigate = useNavigate()
  const { bannerId = '' } = useParams()
  const banners = useAdminBanners()
  const targets = useBannerTargets(bannerId)
  const update = useUpdateAdminBanner(bannerId)
  const banner = banners.data?.find((item) => item.bannerId === bannerId)

  if (!banner) {
    if (banners.isPending) {
      return (
        <div className={styles.root}>
          <PageSkeleton sections={3} fieldsPerSection={1} />
        </div>
      )
    }
    return (
      <div className={styles.notFound}>
        <div>
          {banners.isError
            ? getErrorMessage(banners.error, '배너를 불러오지 못했습니다.')
            : '없거나 지운 배너입니다.'}
        </div>
        <Breadcrumb
          items={[{ label: '배너 관리로 돌아가기', to: ADMIN_BANNERS_PATH }]}
        />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <Breadcrumb
        items={[
          { label: '배너 관리', to: ADMIN_BANNERS_PATH },
          { label: banner.tabLabel },
        ]}
      />
      <h1 className={styles.title}>배너 수정</h1>

      {update.isError && (
        <InlineAlert status="error">
          {getErrorMessage(update.error, '배너를 수정하지 못했습니다.')}
        </InlineAlert>
      )}

      <AdminBannerForm
        // 다른 배너로 옮겨 가면 폼을 새 값으로 다시 연다.
        key={bannerId}
        targets={targets}
        defaultValue={toBannerFormValue(banner)}
        submitLabel="저장"
        submitting={update.isPending}
        onSubmit={(value) =>
          update.mutate(value, {
            onSuccess: () => {
              showToast('배너를 수정했습니다.')
              navigate(ADMIN_BANNERS_PATH)
            },
          })
        }
        onCancel={() => navigate(ADMIN_BANNERS_PATH)}
      />
    </div>
  )
}

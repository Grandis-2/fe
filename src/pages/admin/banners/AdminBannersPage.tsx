import { Plus, SquarePen } from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  useAdminBanners,
  useDeleteAdminBanner,
  useReorderAdminBanners,
  type AdminBanner,
  type BannerTargetType,
} from '@entities/admin-banner'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_BANNER_NEW_PATH, adminBannerPath } from '@shared/config/routes'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import { ActionMenu, Button, InlineAlert, Table, Tag } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './AdminBannersPage.css'

const targetLabel: Record<BannerTargetType, string> = {
  PRODUCT: '일반 상품',
  PROMOTION: '홍보',
}

// 관리자가 켜 뒀어도 대상 상품이 목록에 없거나 홍보 기간 밖이면(targetLive=false) 고객에게 안 보인다.
const visibility = ({ visible, targetLive }: AdminBanner) =>
  !visible
    ? { label: '숨김', color: 'gray' as const }
    : targetLive
      ? { label: '노출 중', color: 'green' as const }
      : { label: '대상 종료', color: 'yellow' as const }

const visibilityLabels = ['숨김', '노출 중', '대상 종료']

/** 배너 관리. 메인에 보이는 순서대로 나열한다 — 순서는 ⋮ 메뉴에서 한 칸씩 옮긴다. */
export function AdminBannersPage() {
  const navigate = useNavigate()
  const banners = useAdminBanners()
  const remove = useDeleteAdminBanner()
  const reorder = useReorderAdminBanners()
  const rows = banners.data ?? []
  const pending = remove.isPending || reorder.isPending

  // 순서 API는 모든 배너 id를 받는다 — 지금 목록에서 한 칸만 바꿔 통째로 보낸다.
  const move = (index: number, offset: -1 | 1) => {
    const ids = rows.map((banner) => banner.bannerId)
    ;[ids[index], ids[index + offset]] = [ids[index + offset], ids[index]]
    remove.reset()
    reorder.mutate(ids)
  }

  const confirmDelete = (banner: AdminBanner) =>
    openModal({
      theme: 'light',
      title: '배너 지우기',
      description: `'${banner.tabLabel}' 배너를 지울까요?\n되돌릴 수 없습니다. 잠시 내리려면 고치기에서 노출을 꺼 주세요.`,
      confirmLabel: '지우기',
      onConfirm: () => {
        closeModal()
        reorder.reset()
        remove.mutate(banner.bannerId, {
          onSuccess: () => showToast('배너를 지웠습니다.'),
        })
      },
    })

  const columns: TableColumn<AdminBanner>[] = [
    {
      key: 'tabLabel',
      header: '탭 이름',
      align: 'center',
      render: (banner) => banner.tabLabel,
    },
    {
      key: 'title',
      header: '제목',
      // 제목의 줄바꿈은 메인에서만 의미가 있어 표에선 한 줄로 붙인다.
      render: (banner) => (
        <span className={styles.bannerTitle}>
          {banner.title.replace(/\n/g, ' ')}
        </span>
      ),
    },
    {
      key: 'target',
      header: '이동 대상',
      align: 'center',
      render: (banner) => targetLabel[banner.target.type],
    },
    {
      key: 'visibility',
      header: '상태',
      align: 'center',
      render: (banner) => {
        const { label, color } = visibility(banner)
        return (
          <Tag
            variant="subtle"
            size="medium"
            rounded={false}
            widthOptions={visibilityLabels}
            color={color}
          >
            {label}
          </Tag>
        )
      },
    },
    {
      key: 'menu',
      header: '관리',
      align: 'center',
      width: '80px',
      render: (banner) => {
        const index = rows.indexOf(banner)
        return (
          <ActionMenu
            label={`${banner.tabLabel} 관리 메뉴`}
            disabled={pending}
            items={[
              {
                label: '위로 옮기기',
                onSelect: () => move(index, -1),
                disabledReason: index === 0 ? '맨 앞입니다.' : undefined,
              },
              {
                label: '아래로 옮기기',
                onSelect: () => move(index, 1),
                disabledReason:
                  index === rows.length - 1 ? '맨 뒤입니다.' : undefined,
              },
              {
                label: '지우기',
                onSelect: () => confirmDelete(banner),
                danger: true,
              },
            ]}
          />
        )
      },
    },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>배너 관리</h1>
        <Button
          icon={Plus}
          size="medium"
          onClick={() => navigate(ADMIN_BANNER_NEW_PATH)}
        >
          새 배너
        </Button>
      </div>

      {remove.isError && (
        <InlineAlert status="error">
          {getErrorMessage(remove.error, '배너를 지우지 못했습니다.')}
        </InlineAlert>
      )}
      {reorder.isError && (
        <InlineAlert status="error">
          {getErrorMessage(
            reorder.error,
            '순서를 바꾸지 못했습니다. 목록을 다시 불러왔으니 다시 시도해 주세요.',
          )}
        </InlineAlert>
      )}

      <Table
        columns={columns}
        rows={rows}
        rowKey={(banner) => banner.bannerId}
        pageSize={10}
        rowAction={{
          header: '수정',
          label: (banner) => `${banner.tabLabel} 수정`,
          onClick: (banner) => navigate(adminBannerPath(banner.bannerId)),
          icon: SquarePen,
        }}
        loading={banners.isPending}
        emptyMessage={
          banners.isError
            ? getErrorMessage(banners.error, '배너를 불러오지 못했습니다.')
            : '아직 배너가 없습니다.'
        }
      />
    </div>
  )
}

import { useState } from 'react'

import { GripVertical, Plus, SquarePen, Trash2 } from 'lucide-react'
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
import { useDragReorder } from '@shared/lib/useDragReorder'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import { Button, InlineAlert, Table, Tag } from '@shared/ui'
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

/** 배너 관리. 메인에 보이는 순서대로 나열한다 — 줄을 끌어 놓거나 ↑/↓로 순서를 바꾼다. */
export function AdminBannersPage() {
  const navigate = useNavigate()
  const banners = useAdminBanners()
  const remove = useDeleteAdminBanner()
  const reorder = useReorderAdminBanners()
  // 끄는 동안·저장하는 동안 화면에 보일 순서. 응답이 오면 캐시가 같은 순서라 비운다.
  const [order, setOrder] = useState<string[] | null>(null)
  const byId = new Map(banners.data?.map((banner) => [banner.bannerId, banner]))
  const rows = order?.flatMap((id) => byId.get(id) ?? []) ?? banners.data ?? []
  const pending = remove.isPending || reorder.isPending

  // 순서 API는 모든 배너 id를 받는다 — 바뀐 순서를 통째로 보낸다.
  const commit = (ids: string[]) => {
    const saved = banners.data?.map((banner) => banner.bannerId) ?? []
    if (ids.join() === saved.join()) {
      setOrder(null)
      return
    }
    setOrder(ids)
    remove.reset()
    reorder.mutate(ids, { onSettled: () => setOrder(null) })
  }

  const ids = rows.map((banner) => banner.bannerId)
  // 끄는 동안엔 화면용 순서만 바꾸고 놓을 때 한 번 저장한다. 키보드는 한 칸마다 저장한다.
  const { draggingId, itemProps } = useDragReorder({
    ids,
    onReorder: (next, via) =>
      via === 'keyboard' ? commit(next) : setOrder(next),
    // 표 밖에 놓았거나 Esc로 취소했다 — 브라우저도 그림을 제자리로 돌려보내니
    // 순서도 저장하지 않고 원래대로 둔다.
    onDragEnd: (cancelled) => (cancelled ? setOrder(null) : commit(ids)),
    isLocked: () => pending,
  })

  const confirmDelete = (banner: AdminBanner) =>
    openModal({
      theme: 'light',
      title: '배너 지우기',
      description: `'${banner.tabLabel}' 배너를 지울까요?\n되돌릴 수 없습니다. 잠시 내리려면 수정에서 노출을 꺼 주세요.`,
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
      // 줄을 잡아 끄는 손잡이 — 제목 없이 좁게 둔다.
      key: 'grip',
      header: '',
      align: 'center',
      width: '40px',
      render: () => <GripVertical className={styles.grip} aria-hidden="true" />,
    },
    {
      key: 'order',
      header: '순서',
      align: 'center',
      width: '64px',
      render: (banner) => (
        <span className={styles.order}>{rows.indexOf(banner) + 1}</span>
      ),
    },
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
      key: 'delete',
      header: '삭제',
      align: 'center',
      width: '80px',
      render: (banner) => (
        <button
          type="button"
          className={styles.deleteButton}
          aria-label={`${banner.tabLabel} 삭제`}
          disabled={pending}
          onClick={() => confirmDelete(banner)}
        >
          <Trash2 className={styles.deleteIcon} aria-hidden="true" />
        </button>
      ),
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
        // 쪽을 나누면 다른 쪽으로 끌어 옮길 수 없어 한 번에 다 보인다.
        animateRowMoves
        rowClassName={(banner) =>
          [styles.row, draggingId === banner.bannerId && styles.rowDragging]
            .filter(Boolean)
            .join(' ')
        }
        rowProps={(banner) => ({
          ...itemProps(banner.bannerId),
          tabIndex: 0,
          'aria-label': `${ids.indexOf(banner.bannerId) + 1}번째 ${banner.tabLabel}, 위아래 화살표로 순서 바꾸기`,
        })}
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

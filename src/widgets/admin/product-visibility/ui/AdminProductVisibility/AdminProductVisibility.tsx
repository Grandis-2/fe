import {
  AdminProductDisplayTag,
  type AdminDisplayStatus,
} from '@entities/admin-product'
import { Button } from '@shared/ui'

import * as styles from './AdminProductVisibility.css'

import type { VisibilityTarget } from '../../lib/useProductVisibility'

export type AdminProductVisibilityProps = {
  product: VisibilityTarget & { displayStatus: AdminDisplayStatus }
  onPublish: (product: VisibilityTarget) => void
  onHide: (product: VisibilityTarget) => void
  /** 전환 요청이 도는 중 — 같은 전환을 두 번 보내지 않게 버튼을 막는다 */
  pending?: boolean
  className?: string
}

/**
 * 전시 상태 Tag와 전환 버튼. 상태를 바꾸는 흐름은 useProductVisibility가 맡고
 * 여기는 그리기만 한다 — 목록 셀과 상세 헤더가 같은 모양으로 서야 한다.
 */
export function AdminProductVisibility({
  product,
  onPublish,
  onHide,
  pending = false,
  className,
}: AdminProductVisibilityProps) {
  const { displayStatus } = product

  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')}>
      <AdminProductDisplayTag status={displayStatus} />
      {displayStatus === 'PUBLISHED' ? (
        <Button
          size="small"
          variant="outline"
          color="cancel"
          disabled={pending}
          onClick={() => onHide(product)}
        >
          숨기기
        </Button>
      ) : (
        <Button
          size="small"
          disabled={pending}
          onClick={() => onPublish(product)}
        >
          공개
        </Button>
      )}
    </span>
  )
}

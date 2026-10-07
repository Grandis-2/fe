import { type AdminProduct } from '@entities/admin-product'
import { Button } from '@shared/ui'

import type { VisibilityTarget } from '../../lib/useProductVisibility'

export type AdminProductVisibilityProps = {
  /** 모양을 정하는 데 필요한 세 필드만 받는다 — 목록 요약과 상세 둘 다 넘길 수 있다 */
  product: Pick<AdminProduct, 'productId' | 'name' | 'displayStatus'>
  onPublish: (product: VisibilityTarget) => void
  onHide: (product: VisibilityTarget) => void
  /** 전환 요청이 도는 중 — 같은 전환을 두 번 보내지 않게 버튼을 막는다 */
  pending?: boolean
  className?: string
}

/**
 * 전시 상태를 바꾸는 버튼. 상태 자체는 AdminProductDisplayTag가 보여주므로 여기서는
 * 다음 상태로 가는 길만 연다.
 *
 * 문구에 도착할 상태를 그대로 적는다 — '공개'·'숨기기'만으로는 지금 상태를 말하는지
 * 누르면 그렇게 된다는 건지 헷갈린다. 뱃지에 쓰는 이름(게시중·숨김)을 그대로 써서
 * 누른 뒤 뱃지가 뭘로 바뀌는지 미리 알 수 있게 한다.
 */
export function AdminProductVisibility({
  product,
  onPublish,
  onHide,
  pending = false,
  className,
}: AdminProductVisibilityProps) {
  return product.displayStatus === 'PUBLISHED' ? (
    <Button
      className={className}
      size="small"
      variant="outline"
      color="cancel"
      disabled={pending}
      onClick={() => onHide(product)}
    >
      숨김으로 전환하기
    </Button>
  ) : (
    <Button
      className={className}
      size="small"
      disabled={pending}
      onClick={() => onPublish(product)}
    >
      게시중으로 전환하기
    </Button>
  )
}

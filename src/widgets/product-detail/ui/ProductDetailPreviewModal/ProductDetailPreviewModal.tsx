import type { Product, ShipmentBatch } from '@entities/product'
import { Modal } from '@shared/ui'

import { ProductDetailPreview } from '../ProductDetailPreview'

export type ProductDetailPreviewModalProps = {
  /** 있으면 열린다. 관리자 폼 값으로 만든 상품(toPreviewProduct) */
  product?: Product
  shipmentBatches?: ShipmentBatch[]
  onClose: () => void
}

/** 관리자 등록·수정 화면이 같이 쓰는 상품 상세 미리보기 창 */
export function ProductDetailPreviewModal({
  product,
  shipmentBatches,
  onClose,
}: ProductDetailPreviewModalProps) {
  return (
    <Modal
      open={product !== undefined}
      onClose={onClose}
      size="wide"
      title="상품 상세 미리보기"
      description="저장하지 않은 내용도 지금 입력한 그대로 보여줍니다. 결제·장바구니는 눌리지 않습니다."
    >
      {/* 열 때마다 새로 그려 옵션 선택이 처음 조합부터 시작한다. */}
      {product && (
        <ProductDetailPreview
          product={product}
          shipmentBatches={shipmentBatches}
        />
      )}
    </Modal>
  )
}

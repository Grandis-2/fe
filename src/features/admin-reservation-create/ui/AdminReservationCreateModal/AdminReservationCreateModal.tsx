import { useEffect, useState } from 'react'

import {
  displayStatusLabel,
  getAdminProduct,
  getAdminProducts,
  type AdminProduct,
  type AdminProductDetailModel,
} from '@/entities/admin-product'
import {
  createAdminReservation,
  getAdminMembers,
  getAdminReservations,
  reservationNo,
  type AdminMemberModel,
} from '@/entities/admin-reservation'
import {
  Button,
  Dropdown,
  InlineAlert,
  Input,
  Textarea,
  ModalTitle,
} from '@/shared/ui'

import * as styles from './AdminReservationCreateModal.css'

export type AdminReservationCreateModalProps = {
  /** 생성에 성공하면 목록을 다시 불러오라고 알린다 */
  onCreated: () => void
  onClose: () => void
}

const productLabel = (product: AdminProduct | AdminProductDetailModel) =>
  `${product.name} / ${displayStatusLabel[product.displayStatus]}`

export function AdminReservationCreateModal({
  onCreated,
  onClose,
}: AdminReservationCreateModalProps) {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [members, setMembers] = useState<AdminMemberModel[]>([])

  const [memberKeyword, setMemberKeyword] = useState('')
  const [productId, setProductId] = useState<string>()
  const [loadedDetail, setLoadedDetail] = useState<AdminProductDetailModel>()
  const [optionValues, setOptionValues] = useState<Record<string, string>>({})
  const [memo, setMemo] = useState('')

  const [openDropdown, setOpenDropdown] = useState<string>()
  /** 겹치는 예약이 있으면 그 예약 번호 — 있으면 옵션 선택과 생성을 막는다 */
  const [duplicate, setDuplicate] = useState<{
    key: string
    reservationNo?: string
  }>()
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void Promise.all([getAdminProducts({ size: 100 }), getAdminMembers()])
      .then(([paged, memberList]) => {
        setProducts(paged.items)
        setMembers(memberList.items)
      })
      .catch((cause: Error) => setError(cause.message))
  }, [])

  // 회원 이름은 예약 응답에 없어서 목록에서 이름 ↔ memberId를 이어준다.
  const member = members.find(
    (candidate) =>
      candidate.name === memberKeyword.trim() ||
      candidate.memberId === memberKeyword.trim(),
  )

  // 상품을 고르면 옵션 구성을 알아야 해서 상세를 받는다.
  useEffect(() => {
    if (!productId) return

    let cancelled = false
    getAdminProduct(productId)
      .then((loaded) => {
        if (!cancelled) setLoadedDetail(loaded)
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message)
      })

    return () => {
      cancelled = true
    }
  }, [productId])

  // 상품을 바꾸면 이전 상세가 잠시 남는다 — 지금 고른 상품의 것일 때만 쓴다.
  const detail =
    loadedDetail?.productId === productId ? loadedDetail : undefined

  const memberId = member?.memberId
  // 조회 결과에 대상 키를 같이 담아 둔다. 회원/상품이 바뀌면 키가 어긋나
  // 이전 결과가 저절로 무시되므로, 값을 지우려고 effect에서 setState할 필요가 없다.
  const duplicateKey = memberId && productId ? `${memberId}:${productId}` : ''

  // 중복 제한은 서버가 최종 판정하지만, 누르기 전에 미리 알려준다.
  useEffect(() => {
    if (!memberId || !productId) return

    let cancelled = false
    getAdminReservations({ memberId, productId, size: 100 })
      .then((paged) => {
        if (cancelled) return
        const active = paged.items.find(
          (item) => item.status === 'ACCEPTED' || item.status === 'CONFIRMED',
        )
        setDuplicate({
          key: duplicateKey,
          reservationNo: active
            ? reservationNo(active.reservationId)
            : undefined,
        })
      })
      .catch(() => {
        // 미리보기용 조회라 실패해도 생성 자체는 막지 않는다 — 서버가 다시 본다.
        if (!cancelled) setDuplicate({ key: duplicateKey })
      })

    return () => {
      cancelled = true
    }
  }, [duplicateKey, memberId, productId])

  const duplicatedNo =
    duplicate?.key === duplicateKey ? duplicate.reservationNo : undefined

  const optionGroups = detail?.optionGroups ?? []
  const blocked = duplicatedNo !== undefined

  // 고른 옵션 조합에 해당하는 변형을 찾는다 — 서버에는 optionCode로 보낸다.
  const variant = detail?.variants.find((candidate) =>
    optionGroups.every(
      (group) =>
        candidate.optionValues[group.groupCode] ===
        optionValues[group.groupCode],
    ),
  )

  const submit = () => {
    if (!member || !productId || !variant) return

    setSubmitting(true)
    createAdminReservation({
      memberId: member.memberId,
      productId,
      optionCode: variant.optionCode,
      quantity: 1,
      memo: memo.trim() || null,
    })
      .then(() => {
        onCreated()
        onClose()
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setSubmitting(false))
  }

  return (
    <div className={styles.content}>
      <ModalTitle className={styles.title}>예약 생성</ModalTitle>
      <div className={styles.description}>
        일반 사용자 신청과 동일한 절차로 접수됩니다.
        <br />
        중복 제한은 그대로 적용됩니다.
      </div>

      {error && <InlineAlert status="error">{error}</InlineAlert>}

      <div className={styles.field}>
        <div className={styles.fieldLabel}>대상 회원</div>
        <Input
          label="회원 이름 또는 ID"
          value={memberKeyword}
          invalid={memberKeyword.trim() !== '' && !member}
          onChange={(event) => setMemberKeyword(event.target.value)}
        />
        {memberKeyword.trim() !== '' && !member && (
          <div className={styles.hint}>일치하는 회원이 없습니다.</div>
        )}
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>상품</div>
        {blocked ? (
          <InlineAlert status="warning">
            이 회원은 {detail?.name ?? '해당 상품'}에 이미 진행 중인 예약(
            {duplicatedNo})이 있습니다.
            <br />
            다른 옵션을 선택해도 중복 신청으로 거절됩니다.
          </InlineAlert>
        ) : (
          <Dropdown
            label="상품 선택"
            width="100%"
            options={products.map(productLabel)}
            open={openDropdown === 'product'}
            selectedOption={detail ? productLabel(detail) : undefined}
            onToggle={() =>
              setOpenDropdown((prev) =>
                prev === 'product' ? undefined : 'product',
              )
            }
            onSelect={(_, index) => {
              setProductId(products[index].productId)
              // 상품이 바뀌면 이전 상품의 옵션 선택은 의미가 없다.
              setOptionValues({})
              setOpenDropdown(undefined)
            }}
          />
        )}
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>옵션</div>
        {blocked ? (
          <div className={styles.hint}>기존 예약이 정리된 후 선택 가능</div>
        ) : optionGroups.length === 0 ? (
          <div className={styles.hint}>상품을 먼저 선택해 주세요.</div>
        ) : (
          optionGroups.map((group) => {
            const selected = group.values.find(
              (value) => value.valueCode === optionValues[group.groupCode],
            )
            return (
              <div key={group.groupCode} className={styles.optionRow}>
                <span className={styles.optionName}>{group.name}</span>
                <Dropdown
                  label={`${group.name} 선택`}
                  width="100%"
                  options={group.values.map((value) => value.name)}
                  open={openDropdown === group.groupCode}
                  selectedOption={selected?.name}
                  onToggle={() =>
                    setOpenDropdown((prev) =>
                      prev === group.groupCode ? undefined : group.groupCode,
                    )
                  }
                  onSelect={(_, index) => {
                    setOptionValues((prev) => ({
                      ...prev,
                      [group.groupCode]: group.values[index].valueCode,
                    }))
                    setOpenDropdown(undefined)
                  }}
                />
              </div>
            )
          })
        )}
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>처리 사유 (내부 메모)</div>
        <Textarea
          size="small"
          label="처리 사유 내부 메모"
          placeholder="예: 앱 오류로 고객센터를 통해 신청 요청"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <Button variant="outline" color="cancel" onClick={onClose}>
          취소
        </Button>
        <Button
          disabled={!member || !variant || blocked || submitting}
          onClick={submit}
        >
          생성하기
        </Button>
      </div>
    </div>
  )
}

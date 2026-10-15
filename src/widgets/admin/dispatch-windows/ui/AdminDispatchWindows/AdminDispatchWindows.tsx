import { useState } from 'react'

import { Plus, X } from 'lucide-react'

import {
  batchDraftProblem,
  createBatchDraft,
  formatPositionRange,
  formatShipPeriod,
  toBatchDrafts,
  toBatches,
  toShipmentBatchesRequest,
  useAdminProduct,
  useAdminShipmentBatches,
  useSaveAdminShipmentBatches,
  type AdminShipmentBatch,
  type ShipmentBatchDraft,
} from '@entities/admin-product'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { Button, DateRangeField, InlineAlert, Input, Table } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './AdminDispatchWindows.css'

export type AdminDispatchWindowsProps = {
  productId: string
}

// 끝 번호 칸이 끝없이 길어지지 않게 자릿수를 막는다(백만 단위까지).
const SEQ_MAX_LENGTH = 7

const OPEN_END_NOTE = '마지막 차수는 그 뒤 순번 전부입니다.'

/**
 * 사전 예약 상품의 배송 차수 설정. 차수마다 끝 번호와 예상 배송 기간을 받고, 시작
 * 번호는 앞 차수에서 이어 계산한다(toBatches). 마지막 차수는 그 뒤 순번 전부다.
 *
 * 저장은 전체 교체다. 오픈 이후에는 잠긴다 — 이미 배정된 순번의 배송 약속을 뒤에서
 * 바꾸면 안 되고, 서버도 409로 막는다.
 */
export function AdminDispatchWindows({ productId }: AdminDispatchWindowsProps) {
  const product = useAdminProduct(productId)
  const shipmentBatches = useAdminShipmentBatches(productId)
  const save = useSaveAdminShipmentBatches(productId)
  const [editing, setEditing] = useState(false)
  const [drafts, setDrafts] = useState<ShipmentBatchDraft[]>([])

  const batches = shipmentBatches.data ?? []
  // 회차가 아직 없으면 서버가 404를 준다 — 차수는 회차에 딸려 있어 먼저 만들 수 없다.
  const noCampaign =
    shipmentBatches.error instanceof ApiRequestError &&
    shipmentBatches.error.status === 404
  // 차수 교체는 오픈 뒤 409다 — 접수 중(OPEN)뿐 아니라 마감(CLOSED)도 이미 오픈한 뒤다.
  const campaignStatus = product.data?.campaign?.status
  const editable =
    !!shipmentBatches.data &&
    campaignStatus !== 'OPEN' &&
    campaignStatus !== 'CLOSED'

  // 편집을 여는 순간 화면에 보이던 차수로 초안을 채운다. 비어 있으면 한 줄로 시작한다.
  const startEdit = () => {
    setDrafts(
      batches.length > 0 ? toBatchDrafts(batches) : [createBatchDraft()],
    )
    setEditing(true)
  }

  // 시작 번호는 앞 차수 끝 번호에서 매번 계산한다 — 상태로 들고 있지 않는다.
  const draftBatches = toBatches(drafts)
  const problem = batchDraftProblem(drafts)

  // 초안을 고치면 지난 저장 실패 문구를 지운다 — 남아 있으면 이미 고친 구성이
  // 여전히 잘못된 것처럼 보인다.
  const updateDrafts = (
    update: (prev: ShipmentBatchDraft[]) => ShipmentBatchDraft[],
  ) => {
    if (save.isError) save.reset()
    setDrafts(update)
  }

  const patchDraft = (id: string, partial: Partial<ShipmentBatchDraft>) =>
    updateDrafts((prev) =>
      prev.map((draft) => (draft.id === id ? { ...draft, ...partial } : draft)),
    )

  const close = () => {
    // 다음에 편집을 열었을 때 지난 저장 실패 문구가 남아 있지 않게 한다.
    save.reset()
    setEditing(false)
  }

  const submit = () => {
    if (problem || save.isPending) return
    save.mutate(toShipmentBatchesRequest(drafts), {
      // 화면을 떠난 뒤에 응답이 오면 TanStack Query가 이 콜백을 부르지 않는다.
      onSuccess: () => setEditing(false),
    })
  }

  const readColumns: TableColumn<AdminShipmentBatch>[] = [
    {
      key: 'batch',
      header: '차수',
      align: 'center',
      render: (batch) => `${batch.batchNumber}차`,
    },
    {
      key: 'position',
      header: '순번',
      align: 'center',
      width: '30%',
      render: (batch) => formatPositionRange(batch),
    },
    {
      key: 'period',
      header: '예상 배송 기간',
      align: 'center',
      width: '50%',
      render: (batch) => formatShipPeriod(batch),
    },
  ]

  const editColumns: TableColumn<ShipmentBatchDraft>[] = [
    {
      key: 'batch',
      header: '차수',
      align: 'center',
      width: '80px',
      render: (draft) => `${drafts.indexOf(draft) + 1}차`,
    },
    {
      key: 'position',
      header: '순번',
      align: 'center',
      render: (draft) => {
        const index = drafts.indexOf(draft)
        return (
          <div className={styles.seqRow}>
            <span className={styles.fromSeq}>
              {draftBatches[index].positionFrom.toLocaleString('ko-KR')}
            </span>
            <span className={styles.tilde}>~</span>
            {index === drafts.length - 1 ? (
              <span className={styles.openEnd}>끝까지</span>
            ) : (
              <div className={styles.toSeqField}>
                <Input
                  size="small"
                  label="끝 번호"
                  inputMode="numeric"
                  maxLength={SEQ_MAX_LENGTH}
                  value={
                    draft.positionTo === null ? '' : String(draft.positionTo)
                  }
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '')
                    patchDraft(draft.id, {
                      positionTo: digits ? Number(digits) : null,
                    })
                  }}
                />
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'period',
      header: '예상 배송 기간',
      align: 'center',
      width: '40%',
      render: (draft) => (
        <DateRangeField
          label={`${drafts.indexOf(draft) + 1}차 예상 배송 기간`}
          value={draft.period}
          onChange={(period) => patchDraft(draft.id, { period })}
        />
      ),
    },
    {
      key: 'remove',
      header: '',
      align: 'center',
      width: '60px',
      render: (draft) => (
        <button
          type="button"
          className={styles.removeButton}
          aria-label={`${drafts.indexOf(draft) + 1}차 삭제`}
          // 지우면 다음 차수의 시작 번호가 앞 차수 끝에 다시 이어진다.
          onClick={() =>
            updateDrafts((prev) => prev.filter((item) => item.id !== draft.id))
          }
        >
          <X className={styles.removeIcon} aria-hidden="true" />
        </button>
      ),
    },
  ]

  if (editing) {
    return (
      <div className={styles.root}>
        {save.isError && (
          <InlineAlert status="error">
            {getErrorMessage(save.error, '배송 차수를 저장하지 못했습니다.')}
          </InlineAlert>
        )}

        <Table
          columns={editColumns}
          rows={drafts}
          rowKey={(draft) => draft.id}
          emptyMessage="차수를 추가해주세요."
        />

        <button
          type="button"
          className={styles.addButton}
          onClick={() => updateDrafts((prev) => [...prev, createBatchDraft()])}
        >
          <Plus className={styles.addIcon} aria-hidden="true" />
          차수 추가
        </button>

        <div className={styles.editFooter}>
          <span className={problem ? styles.problem : styles.note}>
            {problem ?? OPEN_END_NOTE}
          </span>

          <div className={styles.actions}>
            <Button variant="outline" color="cancel" onClick={close}>
              취소
            </Button>
            <Button disabled={!!problem || save.isPending} onClick={submit}>
              {save.isPending ? '저장 중…' : '저장하기'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* 다시 불러오기에 실패해도 이전 데이터는 남아 표에 그대로 보인다 — 그 사실을 따로 알린다. */}
      {shipmentBatches.isError && shipmentBatches.data && (
        <InlineAlert status="warning">
          {getErrorMessage(
            shipmentBatches.error,
            '배송 차수를 다시 불러오지 못했습니다.',
          )}{' '}
          이전에 불러온 내용을 표시하고 있습니다.
        </InlineAlert>
      )}

      <Table
        columns={readColumns}
        rows={batches}
        rowKey={(batch) => String(batch.batchNumber)}
        // 조회 실패를 '차수 없음'으로 보이면 운영 판단이 정반대가 된다.
        emptyMessage={
          noCampaign
            ? '사전예약 회차가 아직 없어 배송 차수를 정할 수 없습니다. 판매 일정을 먼저 저장해 주세요.'
            : shipmentBatches.isError
              ? getErrorMessage(
                  shipmentBatches.error,
                  '배송 차수를 불러오지 못했습니다.',
                )
              : shipmentBatches.isPending
                ? '불러오는 중입니다.'
                : '설정된 배송 차수가 없습니다.'
        }
      />

      {(batches.length > 0 || editable) && (
        <div className={styles.editFooter}>
          {/* 안내가 없어도 버튼은 오른쪽에 붙도록 빈 칸을 둔다. */}
          <span className={styles.note}>
            {batches.length > 0 && OPEN_END_NOTE}
          </span>
          {editable && (
            <Button size="small" onClick={startEdit}>
              수정하기
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

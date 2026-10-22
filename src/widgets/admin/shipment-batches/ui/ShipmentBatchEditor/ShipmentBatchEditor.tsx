import { useState } from 'react'

import { Plus, X } from 'lucide-react'

import {
  batchDraftProblem,
  createBatchDraft,
  toBatchDrafts,
  toBatches,
  toShipmentBatchesRequest,
  type AdminShipmentBatch,
  type ShipmentBatchDraft,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { Button, DateRangeField, InlineAlert, Input, Table } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './ShipmentBatchEditor.css'

export type ShipmentBatchEditorProps = {
  /** 서버에 저장된 차수 — 처음 값이자 '변경 되돌리기'의 기준이다 */
  batches: AdminShipmentBatch[]
  saving: boolean
  /** 지난 저장 실패. 고치기 시작하면 onDismissError로 걷는다 */
  saveError: unknown
  onDismissError: () => void
  onSave: (body: ReturnType<typeof toShipmentBatchesRequest>) => void
}

// 끝 번호 칸이 끝없이 길어지지 않게 자릿수를 막는다(백만 단위까지).
const SEQ_MAX_LENGTH = 7

const initialDrafts = (batches: AdminShipmentBatch[]) =>
  batches.length > 0 ? toBatchDrafts(batches) : [createBatchDraft()]

// 서버 값과 같은지 — 같으면 저장할 게 없다.
const sameAsServer = (
  drafts: ShipmentBatchDraft[],
  batches: AdminShipmentBatch[],
) =>
  JSON.stringify(toBatches(drafts)) ===
  JSON.stringify(
    batches.map((batch) => ({
      batchNumber: batch.batchNumber,
      positionFrom: batch.positionFrom,
      positionTo: batch.positionTo,
      estimatedShipStart: batch.estimatedShipStart,
      estimatedShipEnd: batch.estimatedShipEnd,
    })),
  )

/**
 * 오픈 전 배송 차수 편집. 차수마다 끝 번호와 예상 배송 기간을 받고, 시작 번호는 앞 차수
 * 끝에서 이어 계산한다(toBatches). 마지막 차수는 그 뒤 순번 전부라 끝 번호가 없고 지울
 * 수 없다 — 새 차수는 마지막 앞에 끼워 넣는다. 서버 규칙(빈틈·겹침 없음, 상한 없는 차수는
 * 맨 끝 하나)을 구조로 지킨다.
 *
 * 저장은 전체 교체다. 서버 값이 바뀌면 부모가 key를 바꿔 새로 채운다.
 */
export function ShipmentBatchEditor({
  batches,
  saving,
  saveError,
  onDismissError,
  onSave,
}: ShipmentBatchEditorProps) {
  const [drafts, setDrafts] = useState(() => initialDrafts(batches))

  const draftBatches = toBatches(drafts)
  const problem = batchDraftProblem(drafts)
  const dirty = !sameAsServer(drafts, batches)

  // 초안을 고치면 지난 저장 실패 문구를 지운다 — 남아 있으면 이미 고친 구성이
  // 여전히 잘못된 것처럼 보인다.
  const updateDrafts = (
    update: (prev: ShipmentBatchDraft[]) => ShipmentBatchDraft[],
  ) => {
    if (saveError) onDismissError()
    setDrafts(update)
  }

  const patchDraft = (id: string, partial: Partial<ShipmentBatchDraft>) =>
    updateDrafts((prev) =>
      prev.map((draft) => (draft.id === id ? { ...draft, ...partial } : draft)),
    )

  const columns: TableColumn<ShipmentBatchDraft>[] = [
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
      render: (draft) => {
        const last = drafts.indexOf(draft) === drafts.length - 1
        return (
          <button
            type="button"
            className={styles.removeButton}
            // 마지막 차수(끝 번호 없음)는 늘 하나 있어야 한다.
            disabled={last}
            aria-label={
              last
                ? '마지막 차수는 지울 수 없어요'
                : `${drafts.indexOf(draft) + 1}차 삭제`
            }
            // 지우면 다음 차수의 시작 번호가 앞 차수 끝에 다시 이어진다.
            onClick={() =>
              updateDrafts((prev) =>
                prev.filter((item) => item.id !== draft.id),
              )
            }
          >
            <X className={styles.removeIcon} aria-hidden="true" />
          </button>
        )
      },
    },
  ]

  return (
    <div className={styles.root}>
      {!!saveError && (
        <InlineAlert status="error">
          {getErrorMessage(saveError, '배송 차수를 저장하지 못했습니다.')}
        </InlineAlert>
      )}

      <Table
        columns={columns}
        rows={drafts}
        rowKey={(draft) => draft.id}
        emptyMessage="차수를 추가해주세요."
      />

      <button
        type="button"
        className={styles.addButton}
        // 마지막 차수는 '그 뒤 전부'라 새 차수는 그 앞에 들어간다.
        onClick={() =>
          updateDrafts((prev) => [
            ...prev.slice(0, -1),
            createBatchDraft(),
            ...prev.slice(-1),
          ])
        }
      >
        <Plus className={styles.addIcon} aria-hidden="true" />
        차수 추가 · 마지막 차수 앞에 끼워 넣어요
      </button>

      <ul className={styles.rules}>
        <li>시작 번호는 앞 차수 끝 + 1로 저절로 맞춰져 빈틈·겹침이 없어요.</li>
        <li>끝 번호 없는 차수는 맨 마지막 하나예요.</li>
        <li>종료일은 시작일과 같거나 뒤여야 해요.</li>
        <li>오픈하면 바꿀 수 없어요.</li>
      </ul>

      <div className={styles.editFooter}>
        <span className={problem ? styles.problem : styles.dirty}>
          {problem ?? (dirty ? '저장하지 않은 변경이 있어요' : '')}
        </span>
        <div className={styles.actions}>
          <Button
            variant="outline"
            color="cancel"
            size="small"
            disabled={!dirty || saving}
            onClick={() => updateDrafts(() => initialDrafts(batches))}
          >
            변경 되돌리기
          </Button>
          <Button
            disabled={!!problem || !dirty || saving}
            size="small"
            onClick={() => onSave(toShipmentBatchesRequest(drafts))}
          >
            {saving ? '저장 중…' : '배송 구간 저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}

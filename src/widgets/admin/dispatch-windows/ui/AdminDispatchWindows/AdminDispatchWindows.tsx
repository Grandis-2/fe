import { useState } from 'react'

import { Plus, X } from 'lucide-react'

import {
  createWaveDraft,
  formatDeliveryDate,
  formatSeqRange,
  nextFromSeq,
  toDispatchWindowRequest,
  toWaveDrafts,
  toWaves,
  useAdminProduct,
  useDispatchWindow,
  useSaveDispatchWindow,
  waveDraftProblem,
  type DispatchWaveDraft,
  type DispatchWaveModel,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { Button, InlineAlert, Input, Table } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import { DeliveryDateField } from '../DeliveryDateField'

import * as styles from './AdminDispatchWindows.css'

export type AdminDispatchWindowsProps = {
  productId: string
}

// 끝 번호 칸이 끝없이 길어지지 않게 자릿수를 막는다(백만 단위까지).
const SEQ_MAX_LENGTH = 7

export function AdminDispatchWindows({ productId }: AdminDispatchWindowsProps) {
  const product = useAdminProduct(productId)
  const dispatchWindow = useDispatchWindow(productId)
  const save = useSaveDispatchWindow(productId)
  const [editing, setEditing] = useState(false)
  const [drafts, setDrafts] = useState<DispatchWaveDraft[]>([])

  const waves = dispatchWindow.data?.waves ?? []
  // 오픈 이후에는 배송 기준과 기존 배정을 바꾸지 않는다(서버도 409로 막는다).
  const editable = !!dispatchWindow.data && product.data?.saleStatus !== 'OPEN'

  // 편집을 여는 순간 화면에 보이던 구성으로 초안을 채운다.
  const startEdit = () => {
    setDrafts(toWaveDrafts(waves))
    setEditing(true)
  }

  // 시작 번호는 앞 차수 끝 번호에서 매번 계산한다 — 상태로 들고 있지 않는다.
  const draftWaves = toWaves(drafts)
  const problem = waveDraftProblem(drafts)

  // 초안을 고치면 지난 저장 실패 문구를 지운다 — 남아 있으면 이미 고친 구성이
  // 여전히 잘못된 것처럼 보인다.
  const updateDrafts = (
    update: (prev: DispatchWaveDraft[]) => DispatchWaveDraft[],
  ) => {
    if (save.isError) save.reset()
    setDrafts(update)
  }

  const patchDraft = (id: string, partial: Partial<DispatchWaveDraft>) =>
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
    save.mutate(toDispatchWindowRequest(drafts), {
      // 화면을 떠난 뒤에 응답이 오면 TanStack Query가 이 콜백을 부르지 않는다.
      onSuccess: () => setEditing(false),
    })
  }

  const readColumns: TableColumn<DispatchWaveModel>[] = [
    {
      key: 'wave',
      header: '차수',
      align: 'center',
      render: (wave) => `${wave.wave}차`,
    },
    {
      key: 'seq',
      header: '순번',
      align: 'center',
      width: '40%',
      render: (wave) => formatSeqRange(wave),
    },
    {
      key: 'date',
      header: '예상 배송일',
      align: 'center',
      width: '40%',
      render: (wave) => formatDeliveryDate(wave.estimatedDeliveryDate),
    },
  ]

  const editColumns: TableColumn<DispatchWaveDraft>[] = [
    {
      key: 'wave',
      header: '차수',
      align: 'center',
      width: '80px',
      render: (draft) => `${drafts.indexOf(draft) + 1}차`,
    },
    {
      key: 'seq',
      header: '순번',
      align: 'center',
      render: (draft) => (
        <div className={styles.seqRow}>
          <span className={styles.fromSeq}>
            {draftWaves[drafts.indexOf(draft)].fromSeq.toLocaleString('ko-KR')}
          </span>
          <span className={styles.tilde}>~</span>
          <div className={styles.toSeqField}>
            <Input
              size="small"
              label="끝 번호"
              inputMode="numeric"
              maxLength={SEQ_MAX_LENGTH}
              value={draft.toSeq === null ? '' : String(draft.toSeq)}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '')
                patchDraft(draft.id, {
                  toSeq: digits ? Number(digits) : null,
                })
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: '예상 배송일',
      align: 'center',
      width: '35%',
      render: (draft) => (
        <DeliveryDateField
          value={draft.estimatedDeliveryDate}
          onChange={(date) =>
            patchDraft(draft.id, { estimatedDeliveryDate: date })
          }
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
          onClick={() => updateDrafts((prev) => [...prev, createWaveDraft()])}
        >
          <Plus className={styles.addIcon} aria-hidden="true" />
          차수 추가
        </button>

        <div className={styles.editFooter}>
          <span className={problem ? styles.problem : styles.undeterminedNote}>
            {problem ??
              `${nextFromSeq(draftWaves).toLocaleString('ko-KR')}번부터는 예상 배송일이 미정입니다.`}
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
      {dispatchWindow.isError && dispatchWindow.data && (
        <InlineAlert status="warning">
          {getErrorMessage(
            dispatchWindow.error,
            '배송 차수를 다시 불러오지 못했습니다.',
          )}{' '}
          이전에 불러온 내용을 표시하고 있습니다.
        </InlineAlert>
      )}

      <Table
        columns={readColumns}
        rows={waves}
        rowKey={(wave) => String(wave.wave)}
        // 조회 실패를 '차수 없음'으로 보이면 운영 판단이 정반대가 된다.
        emptyMessage={
          dispatchWindow.isError
            ? getErrorMessage(
                dispatchWindow.error,
                '배송 차수를 불러오지 못했습니다.',
              )
            : dispatchWindow.isPending
              ? '불러오는 중입니다.'
              : '설정된 배송 차수가 없습니다.'
        }
      />

      {dispatchWindow.data && waves.length > 0 && (
        <div className={styles.undeterminedNote}>
          {dispatchWindow.data.undeterminedFromSeq.toLocaleString('ko-KR')}
          번부터는 예상 배송일이 미정입니다.
        </div>
      )}

      {editable && (
        <div className={styles.toolbar}>
          <Button size="small" onClick={startEdit}>
            수정하기
          </Button>
        </div>
      )}
    </div>
  )
}

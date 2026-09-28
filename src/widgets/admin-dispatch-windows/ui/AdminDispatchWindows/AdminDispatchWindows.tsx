import { useEffect, useState } from 'react'

import { Plus, X } from 'lucide-react'

import {
  createDispatchWindow,
  formatDeliveryDate,
  formatSeqRange,
  getDispatchWindows,
  nextFromSeq,
  pickActiveVersion,
  publishDispatchWindow,
  type DispatchWaveModel,
} from '@/entities/admin-product'
import { Button, Input, Table } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'

import * as styles from './AdminDispatchWindows.css'

export type AdminDispatchWindowsProps = {
  productId: string
  /**
   * 편집 모드 여부. '수정하기' 버튼이 탭과 같은 줄에 있어야 해서
   * 버튼과 상태를 페이지가 들고 이 컴포넌트는 결과만 받는다.
   */
  editing: boolean
  onEditingChange: (editing: boolean) => void
}

type DraftWave = DispatchWaveModel & { id: string }

const toDraft = (wave: DispatchWaveModel): DraftWave => ({
  ...wave,
  id: `wave-${wave.wave}`,
})

export function AdminDispatchWindows({
  productId,
  editing,
  onEditingChange,
}: AdminDispatchWindowsProps) {
  const [waves, setWaves] = useState<DispatchWaveModel[]>([])
  const [undeterminedFromSeq, setUndeterminedFromSeq] = useState(1)
  const [drafts, setDrafts] = useState<DraftWave[]>([])
  const [draftUndetermined, setDraftUndetermined] = useState('')
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false

    getDispatchWindows(productId)
      .then(({ items }) => {
        if (cancelled) return
        const active = pickActiveVersion(items)
        setWaves(active?.waves ?? [])
        setUndeterminedFromSeq(active?.undeterminedFromSeq ?? 1)
        setError(undefined)
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message)
      })

    return () => {
      cancelled = true
    }
  }, [productId])

  // 편집이 켜지는 순간 화면에 보이던 값으로 초안을 채운다.
  const [wasEditing, setWasEditing] = useState(editing)
  if (editing !== wasEditing) {
    setWasEditing(editing)
    if (editing) {
      setDrafts(waves.map(toDraft))
      setDraftUndetermined(String(undeterminedFromSeq))
      setError(undefined)
    }
  }

  const patchDraft = (id: string, partial: Partial<DraftWave>) =>
    setDrafts((prev) =>
      prev.map((draft) => (draft.id === id ? { ...draft, ...partial } : draft)),
    )

  const addWave = () =>
    setDrafts((prev) => {
      const fromSeq = nextFromSeq(prev)
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          wave: prev.length + 1,
          fromSeq,
          toSeq: fromSeq,
          estimatedDeliveryDate: null,
        },
      ]
    })

  /** 새 버전을 초안으로 만들고 바로 게시한다 */
  const save = () =>
    void createDispatchWindow(productId, {
      // 차수 번호는 화면 순서대로 다시 매긴다.
      waves: drafts.map((draft, index) => ({
        wave: index + 1,
        fromSeq: draft.fromSeq,
        toSeq: draft.toSeq,
        estimatedDeliveryDate: draft.estimatedDeliveryDate || null,
      })),
      undeterminedFromSeq: Number(draftUndetermined) || 0,
    })
      .then((created) => publishDispatchWindow(productId, created.version))
      .then((published) => {
        setWaves(published.waves)
        setUndeterminedFromSeq(published.undeterminedFromSeq ?? 1)
        onEditingChange(false)
        setError(undefined)
      })
      .catch((cause: Error) => setError(cause.message))

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
      render: (wave) => formatSeqRange(wave),
    },
    {
      key: 'date',
      header: '예상 배송일',
      align: 'center',
      render: (wave) => formatDeliveryDate(wave.estimatedDeliveryDate),
    },
  ]

  const editColumns: TableColumn<DraftWave>[] = [
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
          <Input
            size="small"
            label="시작"
            inputMode="numeric"
            value={String(draft.fromSeq)}
            onChange={(event) =>
              patchDraft(draft.id, {
                fromSeq: Number(event.target.value.replace(/\D/g, '')) || 0,
              })
            }
          />
          <span className={styles.tilde}>~</span>
          <Input
            size="small"
            label="끝"
            inputMode="numeric"
            value={String(draft.toSeq)}
            onChange={(event) =>
              patchDraft(draft.id, {
                toSeq: Number(event.target.value.replace(/\D/g, '')) || 0,
              })
            }
          />
        </div>
      ),
    },
    {
      key: 'date',
      header: '예상 배송일',
      align: 'center',
      width: '220px',
      render: (draft) => (
        <Input
          size="small"
          label="예상 배송일"
          type="date"
          value={draft.estimatedDeliveryDate ?? ''}
          onChange={(event) =>
            patchDraft(draft.id, {
              estimatedDeliveryDate: event.target.value || null,
            })
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
          onClick={() =>
            setDrafts((prev) => prev.filter((item) => item.id !== draft.id))
          }
        >
          <X className={styles.removeIcon} aria-hidden="true" />
        </button>
      ),
    },
  ]

  return (
    <div className={styles.root}>
      {error && <div className={styles.error}>{error}</div>}

      {editing ? (
        <>
          <Table
            columns={editColumns}
            rows={drafts}
            rowKey={(draft) => draft.id}
            emptyMessage="차수를 추가해주세요."
          />

          <button type="button" className={styles.addButton} onClick={addWave}>
            <Plus className={styles.addIcon} aria-hidden="true" />
            차수 추가
          </button>

          <div className={styles.undeterminedRow}>
            <span className={styles.undeterminedLabel}>
              배송일 미정 시작 순번
            </span>
            <div className={styles.undeterminedField}>
              <Input
                size="small"
                label="시작 순번"
                inputMode="numeric"
                value={draftUndetermined}
                onChange={(event) =>
                  setDraftUndetermined(event.target.value.replace(/\D/g, ''))
                }
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              variant="outline"
              color="cancel"
              onClick={() => onEditingChange(false)}
            >
              취소
            </Button>
            <Button onClick={save}>저장하기</Button>
          </div>
        </>
      ) : (
        <>
          <Table
            columns={readColumns}
            rows={waves}
            rowKey={(wave) => String(wave.wave)}
            emptyMessage="설정된 배송 차수가 없습니다."
          />

          {waves.length > 0 && (
            <div className={styles.undeterminedNote}>
              {undeterminedFromSeq.toLocaleString('ko-KR')}번부터는 예상
              배송일이 미정입니다.
            </div>
          )}
        </>
      )}
    </div>
  )
}

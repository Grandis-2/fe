import { useState, type ReactNode } from 'react'

import { ChevronRight } from 'lucide-react'

import { srOnly } from '@shared/config/theme'

import { Navigator } from '../Navigator'

import * as styles from './Table.css'

import type { LucideIcon } from 'lucide-react'

export type TableAlign = 'left' | 'center' | 'right'

export type TableColumn<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  align?: TableAlign
  width?: string
}

export type TableRowAction<T> = {
  /** 스크린리더용 문구. 행마다 무엇으로 들어가는지 구분돼야 한다 */
  label: (row: T) => string
  onClick: (row: T) => void
  header?: ReactNode
  /** 기본은 상세로 들어가는 > 다. 수정처럼 다른 동작이면 그에 맞는 아이콘을 넘긴다 */
  icon?: LucideIcon
}

export type TableProps<T> = {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
  pageSize?: number
  onRowClick?: (row: T) => void
  /**
   * 행 끝에 상세로 들어가는 > 열을 붙인다. onRowClick과 같이 쓰는 게 보통이며,
   * 행 전체가 눌린다는 걸 모르는 사용자를 위한 눈에 보이는 진입점이다.
   */
  rowAction?: TableRowAction<T>
  /**
   * 불러오는 중 — 행 자리에 회색 줄을 깐다. 빈 문구(emptyMessage)로 '불러오는 중'을 쓰면
   * 0건과 구별이 안 되고, 다 오면 표 높이가 갑자기 바뀐다.
   */
  loading?: boolean
  /** 로딩 줄 수. 안 주면 pageSize, 그것도 없으면 5줄 */
  loadingRows?: number
  className?: string
}

const ACTION_COLUMN_KEY = 'table-row-action'
const DEFAULT_LOADING_ROWS = 5

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = '데이터가 없습니다.',
  pageSize,
  onRowClick,
  rowAction,
  loading = false,
  loadingRows,
  className,
}: TableProps<T>) {
  const [page, setPage] = useState(1)
  const [lastRowCount, setLastRowCount] = useState(rows.length)
  if (rows.length !== lastRowCount) {
    setLastRowCount(rows.length)
    setPage(1)
  }

  const totalPages = pageSize ? Math.ceil(rows.length / pageSize) : 1
  const visibleRows = pageSize
    ? rows.slice((page - 1) * pageSize, page * pageSize)
    : rows

  // 액션 열은 평범한 열 하나로 만들어 둔다 — 헤더·빈 상태 colSpan·정렬이
  // 나머지 열과 같은 경로를 타서 따로 챙길 게 없어진다.
  const ActionIcon = rowAction?.icon ?? ChevronRight
  const allColumns: TableColumn<T>[] = rowAction
    ? [
        ...columns,
        {
          key: ACTION_COLUMN_KEY,
          header: rowAction.header ?? '',
          align: 'center',
          width: '80px',
          render: (row) => (
            <button
              type="button"
              className={styles.actionButton}
              aria-label={rowAction.label(row)}
              onClick={(event) => {
                // 행 클릭과 같이 쓰면 핸들러가 두 번 돈다.
                event.stopPropagation()
                rowAction.onClick(row)
              }}
            >
              <ActionIcon className={styles.actionIcon} aria-hidden="true" />
            </button>
          ),
        },
      ]
    : columns

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <div className={styles.root}>
        <table className={styles.table} aria-busy={loading || undefined}>
          <thead>
            <tr>
              {allColumns.map(({ key, header, align = 'left', width }) => (
                <th
                  key={key}
                  className={styles.headerCell[align]}
                  style={width ? { width } : undefined}
                  scope="col"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from(
                { length: loadingRows ?? pageSize ?? DEFAULT_LOADING_ROWS },
                (_, index) => (
                  <tr key={index} className={styles.row}>
                    {allColumns.map(({ key, align = 'left' }, column) => (
                      <td key={key} className={styles.cell[align]}>
                        <span
                          className={styles.skeletonBar}
                          aria-hidden="true"
                        />
                        {/* 스크린리더엔 한 번만 알린다. */}
                        {index === 0 && column === 0 && (
                          <span className={srOnly}>불러오는 중입니다.</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ),
              )
            ) : visibleRows.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={allColumns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={[styles.row, onRowClick && styles.rowClickable]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={onRowClick && (() => onRowClick(row))}
                >
                  {allColumns.map(({ key, render, align = 'left' }) => (
                    <td key={key} className={styles.cell[align]}>
                      {render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && totalPages > 1 && (
        <Navigator
          className={styles.navigator}
          totalPages={totalPages}
          currentPage={page}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

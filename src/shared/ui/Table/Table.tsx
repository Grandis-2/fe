import { useState, type ReactNode } from 'react'

import { ChevronRight } from 'lucide-react'

import { Navigator } from '../Navigator'

import * as styles from './Table.css'

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
  className?: string
}

const ACTION_COLUMN_KEY = 'table-row-action'

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = '데이터가 없습니다.',
  pageSize,
  onRowClick,
  rowAction,
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
              <ChevronRight className={styles.actionIcon} aria-hidden="true" />
            </button>
          ),
        },
      ]
    : columns

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <div className={styles.root}>
        <table className={styles.table}>
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
            {visibleRows.length === 0 ? (
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
      {totalPages > 1 && (
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

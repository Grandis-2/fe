import { useState, type ReactNode } from 'react'

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

export type TableProps<T> = {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
  pageSize?: number
  onRowClick?: (row: T) => void
  className?: string
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = '데이터가 없습니다.',
  pageSize,
  onRowClick,
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

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <div className={styles.root}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(({ key, header, align = 'left', width }) => (
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
                <td className={styles.emptyCell} colSpan={columns.length}>
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
                  {columns.map(({ key, render, align = 'left' }) => (
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

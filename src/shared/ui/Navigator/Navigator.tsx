import { ChevronLeft, ChevronsLeft } from 'lucide-react'

import { Button } from '../Button'

import * as styles from './Navigator.css'

export type NavigatorProps = {
  totalPages: number
  currentPage: number
  onPageChange?: (page: number) => void
  className?: string
}

const VISIBLE_PAGE_COUNT = 7
const SIBLING_COUNT = 1

type PageItem = number | 'ellipsis'

function getPageItems(totalPages: number, currentPage: number): PageItem[] {
  if (totalPages <= VISIBLE_PAGE_COUNT) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const leftSibling = Math.max(currentPage - SIBLING_COUNT, 1)
  const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < totalPages - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [
    1,
    'ellipsis',
    leftSibling,
    currentPage,
    rightSibling,
    'ellipsis',
    totalPages,
  ]
}

export function Navigator({
  totalPages,
  currentPage,
  onPageChange,
  className,
}: NavigatorProps) {
  const pageItems = getPageItems(totalPages, currentPage)

  return (
    <nav
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-label="pagination"
    >
      <Button
        className={styles.arrowButton}
        aria-label="first page"
        onClick={() => onPageChange?.(1)}
      >
        <ChevronsLeft className={styles.arrowIcon} aria-hidden="true" />
      </Button>
      <Button
        className={styles.arrowButton}
        aria-label="previous page"
        onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
      >
        <ChevronLeft className={styles.arrowIcon} aria-hidden="true" />
      </Button>
      {pageItems.map((item, index) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className={styles.ellipsis}
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            className={[
              styles.pageButton,
              item === currentPage && styles.pageButtonActive,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={item === currentPage ? 'page' : undefined}
            onClick={() => onPageChange?.(item)}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        className={styles.arrowButton}
        aria-label="next page"
        onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
      >
        <ChevronLeft
          className={`${styles.arrowIcon} ${styles.arrowIconFlipped}`}
          aria-hidden="true"
        />
      </Button>
      <Button
        className={styles.arrowButton}
        aria-label="last page"
        onClick={() => onPageChange?.(totalPages)}
      >
        <ChevronsLeft
          className={`${styles.arrowIcon} ${styles.arrowIconFlipped}`}
          aria-hidden="true"
        />
      </Button>
    </nav>
  )
}

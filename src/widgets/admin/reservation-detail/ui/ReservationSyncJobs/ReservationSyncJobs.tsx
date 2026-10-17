import {
  syncJobStatusLabel,
  syncJobTypeLabel,
  type ReservationSyncJob,
} from '@entities/admin-reservation'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { Table } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './ReservationSyncJobs.css'

export type ReservationSyncJobsProps = {
  jobs: ReservationSyncJob[]
}

type Attempt = ReservationSyncJob['attempts'][number]

const attemptColumns: TableColumn<Attempt>[] = [
  {
    key: 'no',
    header: '시도',
    align: 'center',
    width: '60px',
    render: (attempt) => attempt.attemptNumber,
  },
  {
    key: 'actor',
    header: '주체',
    align: 'center',
    render: (attempt) => (attempt.actor === 'ADMIN' ? '관리자 재처리' : '자동'),
  },
  {
    key: 'result',
    header: '결과',
    align: 'center',
    render: (attempt) =>
      [attempt.result, attempt.httpStatus].filter(Boolean).join(' · '),
  },
  {
    key: 'error',
    header: '오류',
    render: (attempt) =>
      attempt.errorCode
        ? [attempt.errorCode, attempt.errorMessage].filter(Boolean).join(' — ')
        : '—',
  },
  {
    key: 'at',
    header: '시각',
    align: 'center',
    render: (attempt) => formatDotDateTime(attempt.startedAt),
  },
]

/**
 * 외부 예약 시스템 연동 기록. 예약마다 접수 때 등록 작업 하나, 취소 때 취소 작업이
 * 하나 생긴다. 재처리가 왜 필요했는지(어떤 오류였는지) 확인하는 용도다.
 */
export function ReservationSyncJobs({ jobs }: ReservationSyncJobsProps) {
  if (jobs.length === 0) {
    return <div className={styles.empty}>연동 기록이 없습니다.</div>
  }

  return (
    <div className={styles.root}>
      {jobs.map((job) => (
        <div key={job.syncJobId} className={styles.job}>
          <div className={styles.jobTitle}>
            {syncJobTypeLabel[job.jobType]} · {syncJobStatusLabel[job.status]}
            <span className={styles.jobMeta}>시도 {job.attemptCount}회</span>
          </div>
          {job.attempts.length > 0 && (
            <Table
              columns={attemptColumns}
              rows={job.attempts}
              rowKey={(attempt) => String(attempt.attemptNumber)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

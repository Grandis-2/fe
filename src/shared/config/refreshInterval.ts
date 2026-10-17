/** 자동 갱신 간격(ms). false면 자동으로 다시 받지 않는다 */
export type RefreshInterval = number | false

export const DEFAULT_REFRESH_INTERVAL: RefreshInterval = 10_000

/**
 * 관리자 화면이 고를 수 있는 갱신 간격(RefreshStatus 옆 드롭다운). 예약 집계는 서버가
 * 5초 캐시해서 그보다 짧은 간격은 의미가 없다 — 직접 입력 대신 이 중에서 고르게 한다.
 */
export const refreshIntervalOptions: {
  label: string
  value: RefreshInterval
}[] = [
  { label: '5초마다', value: 5_000 },
  { label: '10초마다', value: 10_000 },
  { label: '30초마다', value: 30_000 },
  { label: '1분마다', value: 60_000 },
  { label: '자동 갱신 끄기', value: false },
]

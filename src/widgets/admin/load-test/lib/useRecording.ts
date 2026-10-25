import { useState } from 'react'

import type { ActiveRecording, RecordedWindow } from './recording'

type Saved = { active: ActiveRecording | null; records: RecordedWindow[] }

// 기록은 이 브라우저에만 둔다 — 개발자가 자기 부하를 비교하는 메모라 서버에 둘 일이 없다.
const STORAGE_KEY = 'nova.admin.load-test.recording'
const MAX_RECORDS = 20

// 범위·표본 칸이 생기기 전에 남긴 기록도 읽는다. 범위를 모르는 진행 중 기록은 어느 범위의
// 표본으로 끝낼지 몰라 버린다.
const normalize = ({ active, records }: Saved): Saved => ({
  active: active && 'productId' in active ? active : null,
  records: records.map((record) => ({
    ...record,
    scopeLabel: record.scopeLabel ?? '—',
    complete: record.complete ?? true,
  })),
})

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalize(JSON.parse(raw) as Saved)
  } catch {
    // 저장소를 못 쓰면(사생활 보호 창 등) 빈 기록으로 시작한다.
  }
  return { active: null, records: [] }
}

function save(next: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 못 남겨도 이번 화면에서는 보인다.
  }
}

/** 구간 기록 — 시작·끝을 누른 구간의 요약을 남긴다. 화면을 나갔다 와도 이어진다 */
export function useRecording() {
  const [saved, setSaved] = useState(load)
  const update = (next: Saved) => {
    setSaved(next)
    save(next)
  }
  return {
    active: saved.active,
    records: saved.records,
    start: (active: ActiveRecording) => update({ ...saved, active }),
    finish: (record: RecordedWindow) =>
      update({
        active: null,
        records: [record, ...saved.records].slice(0, MAX_RECORDS),
      }),
  }
}

// 오프셋 페이지(page는 0부터, 전체 건수 total)를 끝까지 이어 받아 items만 모은다.
// 화면이 전체 목록·건수를 한 번에 써야 하는데 서버가 쪽 크기를 100으로 막아 둔 목록용이다.
export const PAGE_SIZE_MAX = 100
// 이만큼 받아도 끝나지 않으면(받는 동안 쪽마다 새 항목이 쪽 크기 넘게 끼는 경우) 빠진 목록을 돌려주지 않고 실패한다.
const MAX_PAGES = 100

/**
 * 최신순 목록을 받는 동안 앞에 새 항목이 끼면 뒤 쪽이 밀려 이미 받은 항목이 다음 쪽에 또 온다. 그 중복이
 * total을 채우면 가장 오래된 항목을 받기 전에 멈춘다. 받는 중에도 늘어나는 목록(오픈 중 예약 등)은 keyOf를
 * 넘겨 중복을 거른다 — 중복 없는 수가 total에 못 미치면 빈 쪽이 나올 때까지 받아 빠지는 항목이 없다.
 * keyOf가 없으면 받은 그대로 센다(늘어나지 않는 목록).
 */
export async function fetchAllPages<TItem>(
  fetchPage: (page: number) => Promise<{ items: TItem[]; total: number }>,
  keyOf?: (item: TItem) => string,
): Promise<TItem[]> {
  const byKey = new Map<string, TItem>()
  for (let page = 0; ; page += 1) {
    if (page === MAX_PAGES)
      throw new Error('목록이 받는 동안 계속 늘어나 끝까지 받지 못했어요.')
    const result = await fetchPage(page)
    result.items.forEach((item, index) =>
      byKey.set(keyOf ? keyOf(item) : `${page}:${index}`, item),
    )
    // 빈 쪽이면 total이 도중에 줄었거나 끝까지 받은 것이라 거기서 멈춘다(무한 반복 방지).
    if (result.items.length === 0 || byKey.size >= result.total)
      return [...byKey.values()]
  }
}

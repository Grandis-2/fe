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

/**
 * 여러 목록을 앞 목록부터 차례로 이어 붙인 것처럼 page번째 쪽을 받는다. 서버가 한 번에 한
 * 조건만 거를 수 있는데 화면은 두 조건을 한 목록으로 보여줘야 할 때 쓴다 — 섞어 정렬하지
 * 않고 앞 목록이 다 나온 뒤 다음 목록이 나온다. 쪽이 두 목록에 걸치거나 서버 쪽 경계와
 * 어긋나면 한 목록에서 두 쪽을 받는다. 다 채운 뒤의 목록은 건수만 알려고 1건씩 묻는다.
 */
export async function fetchConcatPage<TItem>(
  sources: ((
    page: number,
    size: number,
  ) => Promise<{
    items: TItem[]
    total: number
  }>)[],
  page: number,
  size: number,
): Promise<{ items: TItem[]; page: number; size: number; total: number }> {
  const items: TItem[] = []
  let before = 0
  for (const fetchPage of sources) {
    const need = size - items.length
    if (need === 0) {
      before += (await fetchPage(0, 1)).total
      continue
    }
    // 앞 목록까지 다 썼으면 이 목록의 처음부터, 아니면 쪽 시작이 이 목록 안 어디인지.
    const offset = page * size + items.length - before
    const serverPage = Math.floor(offset / size)
    const first = await fetchPage(serverPage, size)
    items.push(...first.items.slice(offset % size, (offset % size) + need))
    const rest = size - items.length
    if (rest > 0 && offset % size > 0 && (serverPage + 1) * size < first.total)
      items.push(
        ...(await fetchPage(serverPage + 1, size)).items.slice(0, rest),
      )
    before += first.total
  }
  return { items, page, size, total: before }
}

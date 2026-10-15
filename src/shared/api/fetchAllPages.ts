// 오프셋 페이지(page는 0부터, 전체 건수 total)를 끝까지 이어 받아 items만 모은다.
// 화면이 전체 목록·건수를 한 번에 써야 하는데 서버가 쪽 크기를 100으로 막아 둔 목록용이다.
export const PAGE_SIZE_MAX = 100

export async function fetchAllPages<TItem>(
  fetchPage: (page: number) => Promise<{ items: TItem[]; total: number }>,
): Promise<TItem[]> {
  const items: TItem[] = []
  for (let page = 0; ; page += 1) {
    const result = await fetchPage(page)
    items.push(...result.items)
    // 빈 쪽이면 total이 도중에 줄어든 경우라 거기서 멈춘다(무한 반복 방지).
    if (result.items.length === 0 || items.length >= result.total) return items
  }
}

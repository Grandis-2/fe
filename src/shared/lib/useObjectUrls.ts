import { useCallback, useEffect, useRef } from 'react'

/**
 * 미리보기용 objectURL의 수명을 컴포넌트에 묶는다.
 *
 * objectURL은 문서가 닫힐 때까지 살아 있어서, SPA에서 화면만 바꾸면 파일
 * 참조가 그대로 남는다. 이 훅이 만든 URL만 추적해 언마운트 때 모두 해제한다.
 *
 * 소유권을 구분하는 게 핵심이다 — 서버에서 받아 온 이미지 URL을 섞어서
 * 해제하면 아직 쓰는 이미지가 깨진다. 여기서 만든 것만 해제한다.
 */
export function useObjectUrls() {
  const ownedRef = useRef<Set<string>>(new Set())

  const create = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    ownedRef.current.add(url)
    return url
  }, [])

  const release = useCallback((url: string | undefined) => {
    // 내가 만든 게 아니면(서버 URL 등) 손대지 않는다.
    if (!url || !ownedRef.current.delete(url)) return
    URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    const owned = ownedRef.current
    return () => {
      for (const url of owned) URL.revokeObjectURL(url)
      owned.clear()
    }
  }, [])

  return { create, release }
}

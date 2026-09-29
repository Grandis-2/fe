import { useEffect, useRef } from 'react'

import { loadDaumPostcode } from './loadDaumPostcode'

export type DaumPostcodeAddress = {
  postcode: string
  address: string
}

// 컨테이너(모달/바텀시트)와 무관한 부분 — 다음 우편번호 iframe을 주어진 div에
// embed()하고, 결과가 나오면 onComplete로 돌려준다. 컨테이너 두 종류(Modal/
// BottomSheet)가 이 훅 하나를 공유한다.
//
// open이 true일 때만 로드/embed한다 — 두 가지 이유. ① Modal은 <dialog>를 항상
// 마운트해 둬서 open과 무관하게 컨테이너가 존재하므로, 이 가드가 없으면 결제
// 페이지에 들어가자마자 서드파티 스크립트가 로드된다. ② BottomSheet(vaul)는
// open이 true가 되기 전엔 컨테이너 자체가 DOM에 없어서, open 없이 마운트 시
// 한 번만 도는 effect로는 ref가 항상 null이라 영영 embed가 안 걸린다.
//
// containerKey는 호출부가 Modal ↔ BottomSheet 중 뭘 렌더 중인지 나타내는 값
// (예: isDesktop)이다 — 열려 있는 도중 리사이즈로 컨테이너가 바뀌면 DOM 노드가
// 통째로 새로 마운트되는데, open/onComplete는 그대로라 effect가 재실행되지
// 않아 새 노드엔 영영 embed가 안 걸린다. 이 값을 deps에 넣어 컨테이너가 바뀔
// 때마다 새 노드에 다시 embed하게 한다.
export function useDaumPostcodeEmbed(
  open: boolean,
  containerKey: unknown,
  onComplete: (address: DaumPostcodeAddress) => void,
) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    loadDaumPostcode().then((daum) => {
      if (cancelled || !containerRef.current || !daum) return
      // width/height는 embed()의 두 번째 인자가 아니라 생성자 옵션으로 줘야
      // 반영된다 — embed()의 두 번째 인자는 q(검색어)/autoClose만 본다. 여기서
      // 안 주면 항상 500x500 고정으로 그려진다(다음 스크립트 소스에서 확인).
      new daum.Postcode({
        width: '100%',
        height: '100%',
        oncomplete: (data) => {
          onComplete({
            postcode: data.zonecode,
            address:
              data.userSelectedType === 'R'
                ? data.roadAddress
                : data.jibunAddress,
          })
        },
      }).embed(containerRef.current)
    })

    return () => {
      cancelled = true
    }
  }, [open, containerKey, onComplete])

  return containerRef
}

// 다음(카카오) 우편번호 서비스 — 타입을 제공하는 공식 npm 패키지가 없어 스크립트가
// 전역에 심는 최소한의 형태만 직접 선언한다. 문서: https://postcode.map.daum.net/guide
export {}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        // 퍼센트 문자열('100%')을 줘야 embed()가 iframe을 컨테이너 크기에 맞춰
        // 늘린다 — 숫자/px 문자열을 주면 그 고정 크기로, 아예 안 주면 500x500
        // 기본값으로 그려진다(다음 스크립트 소스에서 직접 확인함).
        width?: string
        height?: string
        oncomplete: (data: {
          zonecode: string
          roadAddress: string
          jibunAddress: string
          userSelectedType: 'R' | 'J'
        }) => void
      }) => {
        open: () => void
        embed: (element: HTMLElement) => void
      }
    }
  }
}

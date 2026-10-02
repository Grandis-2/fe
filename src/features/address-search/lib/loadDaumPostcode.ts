const SCRIPT_SRC =
  '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

// 스크립트 로드는 한 번만 — 검색을 여러 번 열어도 같은 Promise를 재사용한다
// (tossClient.ts와 같은 패턴).
let loader: Promise<Window['daum']> | null = null

export function loadDaumPostcode() {
  loader ??= new Promise<Window['daum']>((resolve, reject) => {
    if (window.daum?.Postcode) {
      resolve(window.daum)
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.onload = () => resolve(window.daum)
    script.onerror = () =>
      reject(new Error('우편번호 서비스를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
  return loader
}

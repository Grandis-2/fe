// 휴대폰 번호 입력칸은 숫자만 상태로 들고(서버도 숫자만 받는다) 화면에만 하이픈을 붙인다.
// 붙여넣은 '010-1234-5678'도 숫자만 남긴 뒤 11자로 자른다.
export const toPhoneDigits = (value: string) =>
  value.replace(/\D/g, '').slice(0, 11)

// 입력 중에도 3-4-4로 끊는다 — 다음 칸에 숫자가 생길 때만 '-'를 붙여야 지울 때 '-'에 걸리지 않는다.
export const formatPhoneInput = (digits: string) =>
  [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7)]
    .filter(Boolean)
    .join('-')

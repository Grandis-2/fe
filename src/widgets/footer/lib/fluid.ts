// 데스크톱 구간(744px → 1280px)에서 min → max(px)로 선형으로 커지는 clamp().
// 그 사이엔 궤도가 칸 폭에 맞춰 줄어드는데, 오른쪽 글자·간격도 같이 줄여 비율을 맞춘다.
const FROM = 744
const TO = 1280

export const fluid = (min: number, max: number) => {
  const slope = (max - min) / (TO - FROM)
  const base = min - slope * FROM
  return `clamp(${min}px, ${base.toFixed(2)}px + ${(slope * 100).toFixed(3)}vw, ${max}px)`
}

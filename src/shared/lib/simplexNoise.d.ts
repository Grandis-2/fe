// 인스턴스 타입 이름을 기본 내보내기(SimplexNoise)와 다르게 둔다 — 같은 이름이면
// 기본 import가 동명의 named export를 가린다고 import-x/no-named-as-default가 경고한다.
export interface SimplexNoiseInstance {
  noise2D(x: number, y: number): number
  noise3D(x: number, y: number, z: number): number
  noise4D(x: number, y: number, z: number, w: number): number
}

export interface SimplexNoiseConstructor {
  new (seed?: number | string | (() => number)): SimplexNoiseInstance
}

declare const SimplexNoise: SimplexNoiseConstructor
export default SimplexNoise

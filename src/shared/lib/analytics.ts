// 사용 행태 분석(Amplitude). VITE_AMPLITUDE_API_KEY가 있을 때만 켠다 — 비워 두면 꺼지고 track()도 아무것도 안 한다.
// 페이지 이동·클릭·폼 제출은 autocapture가 남긴다. track()은 autocapture가 모르는 업무 단계(퍼널)에만 쓴다.
// SDK가 커서 켤 때만 따로 받는다 — 바로 import하면 꺼진 배포에도 첫 번들에 실린다.
// main.tsx에서 일찍 import해 첫 페이지 조회부터 남긴다.
const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY

// window 확인: vanilla-extract가 .css.ts를 Node에서 실행할 때 배럴(@widgets/header 등)을 타고
// 이 파일까지 불러온다 — 그때 SDK를 켜면 document가 없어 dev 서버가 죽는다.
const sdk =
  apiKey && typeof window !== 'undefined'
    ? import('@amplitude/analytics-browser')
        .then((amplitude) => {
          amplitude.init(apiKey, { autocapture: true })
          return amplitude
        })
        // 받기에 실패하면(광고 차단·네트워크) 분석만 꺼진다 — track()마다 미처리 거부가 쌓이지 않게.
        .catch(() => null)
    : null

/** 이벤트 이름과 속성. 이름은 Amplitude 관례대로 "대상 + 과거형 동사" */
type AnalyticsEvents = {
  // 사전예약 퍼널 — 클릭 → (대기열 입장) → 접수 → 결제 시작 → 결제 완료
  'Preorder Apply Clicked': { productId: string; queued: boolean }
  'Preorder Queue Admitted': { productId: string }
  'Preorder Submitted': { productId: string; preorderId: string }
  'Preorder Payment Started': { preorderId: string; orderId: string }
  'Preorder Paid': { preorderId: string; orderId: string }
}

// dedupeKey: 같은 일이 두 번 보고돼도(새로고침·재전송) 한 번으로 세야 할 때 준다 — Amplitude가
// 같은 insert_id를 7일 동안 한 번만 받는다.
export const track = <E extends keyof AnalyticsEvents>(
  event: E,
  properties: AnalyticsEvents[E],
  dedupeKey?: string,
) => {
  void sdk?.then((amplitude) =>
    amplitude?.track(
      event,
      properties,
      dedupeKey ? { insert_id: `${event}:${dedupeKey}` } : undefined,
    ),
  )
}

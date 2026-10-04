---
type: feature
title: 사전예약 목록·상세와 대기열
description: 사전예약 목록과 상세 페이지의 구성, useCountdown으로 갈리는 알림 신청/예약 CTA, 로그인 게이트 뒤에 여는 BottomSheet 모델 선택, PreorderModelSummary의 표시·동작 책임 분리, 가짜 진행으로 도는 preorder-queue 대기열과 상품 상세로의 이동을 설명한다.
tags: [feature, preorder, countdown, bottom-sheet, queue]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-d51b86988bbf97dac31f74a0
    resource: repo://src/entities/preorder/ui/PreorderCard/PreorderCard.tsx
  - id: openwiki-source-e4650c7a5b3a8fb12d7e59a1
    resource: repo://src/entities/preorder/ui/PreorderModelSummary/PreorderModelSummary.tsx
  - id: openwiki-source-bdd71870f159ba0d435017cc
    resource: repo://src/features/preorder-queue/lib/usePreorderQueue.ts
  - id: openwiki-source-e41748dfb2846a6af4063246
    resource: repo://src/pages/preorder-detail/PreorderDetailPage.tsx
  - id: openwiki-source-141d0f941b557bf255223cb1
    resource: repo://src/pages/preorder/PreorderPage.tsx
  - id: openwiki-source-db400565b0bb014f48bfe5af
    resource: repo://src/shared/lib/useCountdown.ts
  - id: openwiki-source-2ceede115a3430c4a9aaf46c
    resource: repo://src/shared/ui/BottomSheet/BottomSheet.css.ts
  - id: openwiki-source-78363aa32feea4375d1eaacf
    resource: repo://src/shared/ui/BottomSheet/BottomSheet.tsx
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

사전예약 화면은 아직 API 없이 목업 데이터로 동작한다.

- `/preorder` — `PreorderPage`. 목업 `PREORDERS`를 `entities/preorder`의 `PreorderCard` 그리드로 그린다.
  카드 전체가 `preorderPath(id)`로 가는 링크이고, 제목은 `lineClamp(2)`로 두 줄 말줄임한다.
- `/preorder/:preorderId` — `PreorderDetailPage`. 오픈 시각(`TEMP_OPENS_AT`)과 기간 문구가 하드코딩돼 있고,
  본문 정보 구간 세 개는 회색 자리표시자다. `Container`의 padding 네 값을 모두 0으로 넘겨 자체 레이아웃을 쓴다.

## 흐름

```
CTA 버튼 ── useRequireLogin ──(비회원)──> 로그인 모달
   │(회원)
   ▼
BottomSheet: 모델 목록(PreorderModelSummary × 2)
   ├ 오픈 전: "알림 신청" → handleNotify (isAlert = true, alert 안내)
   └ 오픈 후: "예약 하기" → handleReserve(id, name)
                              시트 닫고 Modal(PreorderQueueCard) 열기
                              대기열 순번이 1이 되면 → /products/:id
```

## 카운트다운 게이트

`shared/lib/useCountdown(target)`은 1초마다 남은 시간을 다시 계산해 `days`·`hours`·`minutes`·`seconds`(분·초는
두 자리 문자열)와 `isOver`(남은 시간 0)를 돌려준다. `target`이 바뀌면 타이머를 새로 건다 — 그래서 호출부는 렌더마다
새 `Date`를 만들지 말고 모듈 상수처럼 고정된 값을 넘겨야 한다.

상세 페이지는 `isOver`로 문구만 바꾼다.

|                | 오픈 전 (`isOver` false)                         | 오픈 후                                     |
| -------------- | ------------------------------------------------ | ------------------------------------------- |
| 카운트다운     | "N일 N시간 MM분 SS초 후 신청 시작"               | 숨김                                        |
| CTA 버튼       | 예약알림 신청하기                                | 사전예약 하러가기                           |
| 시트 제목/설명 | 예약알림 신청 / 알림을 받을 모델을 선택해주세요. | 사전예약 이동 / 예약할 모델을 선택해주세요. |

CTA 버튼은 두 경우 모두 같은 동작이다 — `useRequireLogin()`으로 감싼 `setBottomSheetOpen(true)`. 비회원이면 시트
대신 로그인 모달이 열린다(사전예약·예약알림 모두 회원 전용).

## PreorderModelSummary: 무엇을 보여줄지 vs 무엇을 할지

`entities/preorder`의 `PreorderModelSummary`는 썸네일(없으면 자리표시자)·모델명·오픈일과 CTA 버튼 한 줄이다.

- **표시는 스스로 계산한다** — `isOver`/`isAlert` 조합으로 라벨(`예약 하기` / `알림 신청` / `신청 완료`)과
  비활성화(`!isOver && isAlert`)를 정한다.
- **동작은 호출부에 위임한다** — 오픈 후면 `onReserve`, 전이면 `onNotify` 콜백을 부른다. 엔티티는 라우팅이나 API를
  모른다.

현재 상세 페이지는 두 모델(MacBook Pro 14/16)이 **하나의 `isAlert` 상태를 공유**한다. 한쪽에서 알림을 신청하면 두
모델 모두 "신청 완료"가 되고, 안내 `alert` 문구는 누른 모델과 무관하게 항상 "MacBook Pro 14"다. 알림 신청 API가
붙기 전의 임시 처리다. 시트 하단 "닫기" 버튼은 시트만 닫는다.

## BottomSheet

`shared/ui`의 `BottomSheet`(vaul 래퍼)를 쓴다. `Root` 기본값이 `modal={false}`라 배경 스크롤을 잠그지 않고,
`Content`가 닫기 오버레이를 직접 그린다. `content`는 `maxWidth.content`(1200px) + `boxSizing: 'border-box'`로
페이지 콘텐츠 폭 계약을 따르고, 높이는 최대 90vh다. 자세한 설계 이유는
[shared/ui 컴포넌트 라이브러리](../architecture/shared-ui.md) 참고.

## 대기열: features/preorder-queue

예약을 고르면 시트를 닫고 전역 스토어가 아닌 페이지 소유의 `Modal`에 `PreorderQueueCard`를 띄운다.

- `usePreorderQueue(onComplete)`는 **가짜 진행**이다(대기열 API 연동 전). 시작 순번 80~300, 뒤 대기 100~400을
  무작위로 잡고, 1초마다 앞사람이 무작위 수만큼 빠지고 뒤 인원은 0~8명씩 늘어난다. 순번이 1이 되면 0.8초 동안
  100%를 보여 준 뒤 `onComplete`를 부른다.
- `onComplete`는 React의 `useEffectEvent`로 감싸서, 호출부가 매 렌더 새 함수를 넘겨도 타이머가 리셋되지 않는다.
- 표시는 `entities/order`의 `QueueCard`(내 순번, 진행률, 전체 대기 인원)가 맡는다.
- 상세 페이지는 완료 시 선택한 모델 id로 `productPath(id)`(`/products/MBP-14` 등)로 이동한다 — 이후 구매는
  [상품 구매와 결제 흐름](product-purchase-payment.md)으로 이어진다.

## 관련

- [상품 구매와 결제 흐름](product-purchase-payment.md)
- [마이페이지: 장바구니·배송지·내역](mypage.md) — 사전예약 확인 탭(결제 마감 카운트다운)
- [로그인과 세션 관리](auth-session.md) — `useRequireLogin`

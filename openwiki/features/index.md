# 파일

- [관리자 콘솔](admin-console.md) - /admin 아래 관리자 화면의 구성(AdminLayout·사이드바·헤더 분기), 상품 등록·수정 폼 모델과 재고·출고 회차 API를 나눠 저장하는 흐름, 예약 현황 폴링과 재처리, 아직 목 데이터로 도는 프로모션 화면, 이전 구조로 남은 데이터 조회 방식을 설명한다.
- [로그인과 세션 관리](auth-session.md) - 카카오 OAuth 로그인(state CSRF 검증·returnTo·콜백 처리), 메모리에만 두는 세션 토큰과 리프레시 쿠키 재발급, 재발급 single-flight와 탭 간 동기화(Web Locks·BroadcastChannel), 앱 부팅 시 세션 복구, 로그인 게이트와 회원가입(프로필 완성) 흐름을 설명한다.
- [메인 페이지 히어로와 상품 캐러셀](main-page-carousel.md) - MainPage의 구성(헤더 아래로 끌어올린 배너, 어두운 히어로의 베스트 상품 무한 오토스크롤 캐러셀, 추천 상품 그리드), embla-carousel loop 구현에서 겪은 세 가지 제약, 상품 카드 조회와 로딩·에러·빈 상태 처리, 현재 비활성화된 SwirlBackground를 설명한다.
- [마이페이지: 장바구니·배송지·내역](mypage.md) - /mypage의 쿼리 파라미터 탭 구성과 mypage-* 위젯, 장바구니 조회·수량 변경·삭제와 헤더 배지 갱신, 기본 배송지 저장과 다음 우편번호 검색, 아직 목업으로 도는 구매·사전예약 내역, 헤더 알림 배지 폴링을 설명한다.
- [사전예약 목록·상세와 대기열](preorder-detail.md) - 사전예약 목록과 상세 페이지의 구성, useCountdown으로 갈리는 알림 신청/예약 CTA, 로그인 게이트 뒤에 여는 BottomSheet 모델 선택, PreorderModelSummary의 표시·동작 책임 분리, 가짜 진행으로 도는 preorder-queue 대기열과 상품 상세로의 이동을 설명한다.
- [상품 카탈로그와 탐색](product-catalog.md) - entities/product의 모델·API·UI(ProductCard와 카드 데이터 변환, 색상 스와치, 옵션 선택, 결제 카드 variant)가 나누는 책임, 카드 목록 조회와 카드별 선택 상태, 헤더 메가 메뉴에서 검색 페이지로 이어지는 카테고리 탐색을 설명한다.
- [상품 구매와 결제 흐름](product-purchase-payment.md) - 상품 상세에서 옵션·수량·가격을 고르는 useProductPurchase와 구매 UI, 회원 게이트를 거쳐 사전예약 결과 또는 결제 페이지로 넘어가는 주문 초안, 결제 페이지의 수령인·배송지·약관 입력, 결제 준비 API → 토스 결제창 → 콜백 승인 → 결과 페이지로 이어지는 3단계 결제와 각 단계의 실패 처리를 설명한다.

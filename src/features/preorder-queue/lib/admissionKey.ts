// 입장권 하나에 접수 키 하나 — 키를 입장권에서 계산해, 어느 창·기기에서 같은 입장권으로 접수해도 같은 키가 된다.
// 서버는 같은 키를 이미 쓴 입장권보다 먼저 보고 기존 예약을 돌려준다(재전송). 무작위 키면 같은 입장권을 다시 받은
// 창(결제 화면에서 나갔다 다시 예약, 다른 창)이 새 접수로 보내져 ADMISSION_TICKET_STALE·USED로 거절된다.
// SHA-256 16진수라 64자 — 서버 규칙(8~64자) 안이다. 키는 회원마다 따로라 다른 회원과 겹치지 않는다.
export const admissionKey = async (admissionTicket: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(admissionTicket),
      ),
    ),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')

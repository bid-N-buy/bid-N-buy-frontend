// src/features/mypage/utils/statusLabel.ts

/**
 * 서버 status/statusText/sellingStatus 같은 원시 문자열을
 * 사용자에게 보여줄 한국어 라벨로 변환.
 */
export function toKoreanStatusLabel(raw?: string): string {
  if (!raw) return "";

  const s = raw.toUpperCase().trim();

  // 대표적으로 "진행 중" 계열
  if (
    /PROGRESS|IN PROGRESS|WAIT|WAITING|결제|결제중|결제 중|결제 대기|결제 대기 중|배송|발송|처리중|진행|진행중|PROCESS|SHIP|PAID|PAY/.test(
      s
    )
  ) {
    return "진행 중";
  }

  // "종료" / "마감" / "유찰"
  if (/FINISH|FINISHED|CLOSED|CLOSE|ENDED|END|종료|마감|유찰/.test(s)) {
    return "종료";
  }

  // "완료" / "거래완료" / "구매확정" / "정산완료"
  if (
    /COMPLETED|COMPLETE|TRANSACTION COMPLETE|거래완료|구매확정|수취완료|정산완료|완료됨|DONE|CLOSED/.test(
      s
    )
  ) {
    return "완료";
  }

  // "판매 중", "입찰 중" 등
  if (/SALE|SELLING|BIDDING|입찰|판매중|ON_SALE|RUNNING/.test(s)) {
    return "판매 중";
  }

  // "경매 전" / "등록 전"
  if (/BEFORE|대기|준비중|등록전|비공개|검수|READY|NOT_STARTED/.test(s)) {
    return "대기";
  }

  // 서버가 이미 한글을 예쁘게 줬다면 그대로 보여주자.
  return raw;
}

/**
 * 논리용 상태(진행중/종료 등) 판별에 쓰는 enum-ish
 * -> 기존 toStatus랑 역할 비슷하게 유지 가능
 */
export type TradeStatus =
  | "BEFORE"
  | "SALE"
  | "PROGRESS"
  | "COMPLETED"
  | "FINISH";

/**
 * 서버의 sellingStatus/status/statusText 등을
 * 비교적 안정적인 내부 상태 코드로 변환
 * (isOngoing 같은 로직에서 씀)
 */
export function toStatus(raw?: string): TradeStatus {
  const s = (raw ?? "").trim().toUpperCase();

  if (
    /COMPLETED|COMPLETE|TRANSACTION COMPLETE|거래완료|구매확정|수취완료|정산완료|완료됨|DONE/.test(
      s
    )
  )
    return "COMPLETED";

  if (/FINISH|FINISHED|CLOSED|CLOSE|ENDED|END|종료|마감|유찰/.test(s))
    return "FINISH";

  if (
    /PROGRESS|IN PROGRESS|WAIT|WAITING|결제|결제중|결제 중|배송|발송|처리중|진행|진행중|PROCESS|SHIP|PAID|PAY/.test(
      s
    )
  )
    return "PROGRESS";

  if (/SALE|SELLING|BIDDING|입찰|판매중|ON_SALE|RUNNING/.test(s)) return "SALE";

  if (/BEFORE|대기|준비중|등록전|비공개|검수|READY|NOT_STARTED/.test(s))
    return "BEFORE";

  // 잘 모르겠으면 종료 취급 (안 ongoing 처리되도록)
  return "FINISH";
}

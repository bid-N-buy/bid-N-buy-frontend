// src/features/mypage/mocks/tradeMocks.ts
import type { TradeItem } from "../types/trade";

export const MOCK_PURCHASES: TradeItem[] = [
  {
    id: "p-101",
    title: "커피 머신 DeLonghi EC685",
    thumbUrl: "https://picsum.photos/seed/coffee/200/200",
    status: "WAIT_PAY",
    counterparty: "민수", // 판매자
    auctionStart: "2025-10-11T14:31:00",
    auctionEnd: "2025-10-11T14:35:00",
  },
  {
    id: "p-102",
    title: "닌텐도 스위치 OLED",
    thumbUrl: "https://picsum.photos/seed/switch/200/200",
    status: "PAID",
    counterparty: "영희",
    auctionStart: "2025-10-10T20:00:00",
    auctionEnd: "2025-10-10T20:10:00",
  },
  {
    id: "p-103",
    title: "아이패드 에어 5세대 64GB",
    thumbUrl: "https://picsum.photos/seed/ipad/200/200",
    status: "CLOSED", // DONE -> CLOSED
    counterparty: "철수",
    auctionStart: "2025-10-09T19:00:00",
    auctionEnd: "2025-10-09T19:05:00",
  },
];

export const MOCK_SALES: TradeItem[] = [
  {
    id: "s-201",
    title: "에어팟 프로 2 미개봉",
    thumbUrl: "https://picsum.photos/seed/airpods/200/200",
    status: "BIDDING",
    counterparty: "구매자 미정", // 판매자 관점에선 상대가 구매자/낙찰자
    auctionStart: "2025-10-12T12:00:00",
    auctionEnd: "2025-10-12T12:05:00",
  },
  {
    id: "s-202",
    title: "맥북 에어 M2 16GB/512",
    thumbUrl: "https://picsum.photos/seed/macbook/200/200",
    status: "WAIT_PAY",
    counterparty: "Hyuk", // 예시
    auctionStart: "2025-10-10T10:00:00",
    auctionEnd: "2025-10-10T10:06:00",
  },
  {
    id: "s-203",
    title: "소니 a7C 바디",
    thumbUrl: "https://picsum.photos/seed/a7c/200/200",
    status: "PAID",
    counterparty: "민수",
    auctionStart: "2025-10-09T09:00:00",
    auctionEnd: "2025-10-09T09:07:00",
  },
];

export const MOCK_WISH: TradeItem[] = [
  {
    id: "w-1",
    title: "물건 이름 물건이름 물건 이름",
    thumbUrl: "https://picsum.photos/seed/wish1/200/200",
    counterparty: "판매자 이름",
    auctionEnd: "2025-12-01T12:34:00",
    price: 150000,
    status: "BIDDING",
  },
  {
    id: "w-2",
    title: "두 번째 찜 상품",
    thumbUrl: "https://picsum.photos/seed/wish2/200/200",
    counterparty: "판매자 이름",
    auctionEnd: "2025-12-01T16:00:00",
    price: 150000,
    status: "CLOSED",
  },
  {
    id: "w-3",
    title: "세 번째 찜 상품",
    thumbUrl: "https://picsum.photos/seed/wish3/200/200",
    counterparty: "판매자 이름",
    auctionEnd: "2025-12-03T11:00:00",
    price: 150000,
    status: "PAID",
  },
];

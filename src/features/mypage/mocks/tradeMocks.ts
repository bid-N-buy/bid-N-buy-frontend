// src/features/mypage/mocks/tradeMocks.ts
import type { TradeItem } from "../types/trade";

/* 구매내역 (BUYER 관점) */
export const MOCK_PURCHASES: TradeItem[] = [
  {
    id: "p-301",
    title: "다이슨 V15 무선청소기",
    thumbUrl: "https://picsum.photos/seed/dyson/200/200",
    status: "WAIT_PAY", // 결제 대기
    counterparty: "서진", // 판매자
    auctionStart: "2025-10-20T19:00:00",
    auctionEnd: "2025-10-20T19:10:00",
  },
  {
    id: "p-302",
    title: "아이폰 15 프로 256GB",
    thumbUrl: "https://picsum.photos/seed/iphone15/200/200",
    status: "PAID", // 결제 완료
    counterparty: "도윤",
    auctionStart: "2025-10-17T14:00:00",
    auctionEnd: "2025-10-17T14:05:00",
  },
  {
    id: "p-303",
    title: "플스5 디스크 버전 + 듀얼센스",
    thumbUrl: "https://picsum.photos/seed/ps5/200/200",
    status: "CLOSED", // 거래 완료
    counterparty: "현우",
    auctionStart: "2025-10-15T21:00:00",
    auctionEnd: "2025-10-15T21:06:00",
  },
  {
    id: "p-304",
    title: "LG 27인치 4K 모니터",
    thumbUrl: "https://picsum.photos/seed/monitor/200/200",
    status: "CANCELLED", // 유찰 또는 취소
    counterparty: "지수",
    auctionStart: "2025-10-10T11:00:00",
    auctionEnd: "2025-10-10T11:05:00",
  },
];

/* 판매내역 (SELLER 관점) */
export const MOCK_SALES: TradeItem[] = [
  {
    id: "s-401",
    title: "닌텐도 스위치 라이트 옐로우",
    thumbUrl: "https://picsum.photos/seed/switchlite/200/200",
    status: "BIDDING", // 경매 진행 중
    counterparty: "입찰자 미정",
    auctionStart: "2025-10-21T15:00:00",
    auctionEnd: "2025-10-21T15:05:00",
  },
  {
    id: "s-402",
    title: "갤럭시 Z 플립5 퍼플",
    thumbUrl: "https://picsum.photos/seed/zflip/200/200",
    status: "WAIT_PAY",
    counterparty: "민재",
    auctionStart: "2025-10-18T13:00:00",
    auctionEnd: "2025-10-18T13:07:00",
  },
  {
    id: "s-403",
    title: "맥북 프로 M3 14인치",
    thumbUrl: "https://picsum.photos/seed/macbookpro/200/200",
    status: "PAID",
    counterparty: "하윤",
    auctionStart: "2025-10-16T22:00:00",
    auctionEnd: "2025-10-16T22:10:00",
  },
  {
    id: "s-404",
    title: "아이패드 프로 12.9 6세대",
    thumbUrl: "https://picsum.photos/seed/ipadpro/200/200",
    status: "CLOSED",
    counterparty: "지호",
    auctionStart: "2025-10-14T09:00:00",
    auctionEnd: "2025-10-14T09:05:00",
  },
];

/* 찜 목록 (Wish List) */
export const MOCK_WISH: TradeItem[] = [
  {
    id: "w-11",
    title: "브라운 전기면도기 시리즈9",
    thumbUrl: "https://picsum.photos/seed/shaver/200/200",
    counterparty: "판매자 A",
    auctionEnd: "2025-12-20T10:00:00",
    price: 220000,
    status: "BIDDING",
  },
  {
    id: "w-12",
    title: "애플워치 9 미개봉 블루",
    thumbUrl: "https://picsum.photos/seed/applewatch/200/200",
    counterparty: "판매자 B",
    auctionEnd: "2025-11-15T14:00:00",
    price: 450000,
    status: "WAIT_PAY",
  },
  {
    id: "w-13",
    title: "BOSE QC Ultra 헤드폰",
    thumbUrl: "https://picsum.photos/seed/bose/200/200",
    counterparty: "판매자 C",
    auctionEnd: "2025-11-30T22:00:00",
    price: 380000,
    status: "PAID",
  },
  {
    id: "w-14",
    title: "나이키 덩크 로우 그레이",
    thumbUrl: "https://picsum.photos/seed/nike/200/200",
    counterparty: "판매자 D",
    auctionEnd: "2025-12-10T19:30:00",
    price: 150000,
    status: "CLOSED",
  },
];

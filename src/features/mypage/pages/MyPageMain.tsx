import React from "react";
// import SideBar from "../components/SideBar";
import ProfilePreview from "../components/profile/ProfilePreview";
// import SaleList from "./SaleList";
// import PurchaseList from "./PurchaseList";
// import TradeHistoryPage from "./TradeHistory";
import ThreeItems from "../components/items/ThreeItems";
import useMyTrades from "../hooks/useMyTrade";
import type { TradeItem } from "../types/trade";
const MOCK_PURCHASES: TradeItem[] = [
  // {
  //   id: "101",
  //   title: "커피 머신 DeLonghi EC685",
  //   sellerName: "민수",
  //   thumbUrl: "https://picsum.photos/seed/coffee/120/120",
  //   status: "입찰 중",
  //   auctionStart: "2025-10-11T14:31:00",
  //   auctionEnd: "2025-10-11T14:35:00",
  // },
  // {
  //   id: "102",
  //   title: "닌텐도 스위치 OLED",
  //   sellerName: "영희",
  //   thumbUrl: "https://picsum.photos/seed/switch/120/120",
  //   status: "대기",
  //   auctionStart: "2025-10-10T20:00:00",
  //   auctionEnd: "2025-10-10T20:10:00",
  // },
  // {
  //   id: "103",
  //   title: "아이패드 에어 5세대 64GB",
  //   sellerName: "철수",
  //   thumbUrl: "https://picsum.photos/seed/ipad/120/120",
  //   status: "낙찰",
  //   auctionStart: "2025-10-09T19:00:00",
  //   auctionEnd: "2025-10-09T19:05:00",
  // },
  // {
  //   id: "104",
  //   title: "LG 27인치 4K 모니터",
  //   sellerName: "소라",
  //   thumbUrl: "https://picsum.photos/seed/monitor/120/120",
  //   status: "마감",
  //   auctionStart: "2025-10-08T18:00:00",
  //   auctionEnd: "2025-10-08T18:08:00",
  // },
];

const MOCK_SALES: TradeItem[] = [
  // {
  //   id: "201",
  //   title: "에어팟 프로 2 미개봉",
  //   sellerName: "나",
  //   thumbUrl: "https://picsum.photos/seed/airpods/120/120",
  //   status: "입찰 중",
  //   auctionStart: "2025-10-12T12:00:00",
  //   auctionEnd: "2025-10-12T12:05:00",
  // },
  // {
  //   id: "202",
  //   title: "맥북 에어 M2 16GB/512",
  //   sellerName: "나",
  //   thumbUrl: "https://picsum.photos/seed/macbook/120/120",
  //   status: "대기",
  //   auctionStart: "2025-10-10T10:00:00",
  //   auctionEnd: "2025-10-10T10:06:00",
  // },
  // {
  //   id: "203",
  //   title: "소니 a7C 바디",
  //   sellerName: "나",
  //   thumbUrl: "https://picsum.photos/seed/a7c/120/120",
  //   status: "낙찰",
  //   auctionStart: "2025-10-09T09:00:00",
  //   auctionEnd: "2025-10-09T09:07:00",
  // },
];

const MyPageMain = () => {
  // const { purchases, sales, loading } = useMyTrades(); // {purchases: TradeItem[], sales: TradeItem[]}
  return (
    <>
      <ProfilePreview />
      <ThreeItems
        title="구매 내역"
        items={MOCK_PURCHASES}
        role="buyer"
        seeAllTo="/purchases"
        sortBy="auctionEnd"
      />

      <ThreeItems
        title="판매 내역"
        items={MOCK_SALES}
        role="seller"
        seeAllTo="/sales"
        sortBy="auctionEnd"
      />
      {/* <TradeHistoryPage /> */}
    </>
  );
};

export default MyPageMain;

import React from "react";
import SideBar from "../components/SideBar";
import ProfilePreview from "../components/profile/ProfilePreview";
import SaleList from "./SaleList";
import PurchaseList from "./PurchaseList";
import TradeHistoryPage from "./TradeHistory";

const MyPageMain = () => {
  return (
    <>
      <ProfilePreview />
      <SaleList />
      <PurchaseList />
      {/* <TradeHistoryPage /> */}
    </>
  );
};

export default MyPageMain;

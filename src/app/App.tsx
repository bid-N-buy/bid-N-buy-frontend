import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "../shared/components/Header";
import AuctionDetail from "../features/auction/pages/AuctionDetail";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container">
          <Routes>
            {/* 경매 상세 */}
            <Route path="/auctions/:id" element={<AuctionDetail />} />

            {/* 404 */}
            <Route
              path="*"
              element={<div className="py-20">페이지를 찾을 수 없습니다.</div>}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

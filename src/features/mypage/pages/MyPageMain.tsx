// src/features/mypage/pages/MyPageMain.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ProfilePreview from "../components/profile/ProfilePreview";
import ThreeCompactSection from "../components/items/ThreeItems"; // ← 경로 확인 ('items/ThreeItems'가 아니라 sections/ThreeCompactSection 인지 확인!)
import { usePurchases } from "../hooks/usePurchases";
import { useSales } from "../hooks/useSales";
import { useProfile } from "../hooks/useProfile";

const MyPageMain: React.FC = () => {
  const nav = useNavigate();

  // ✅ 내 프로필 정보
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
  } = useProfile(undefined, { endpoint: "/mypage" });

  // ✅ 구매/판매 프리뷰 (실제 데이터만 사용)
  const { data: purchaseData } = usePurchases({
    page: 0,
    size: 3,
    sort: "end",
  });

  const { data: saleData } = useSales({
    page: 0,
    size: 3,
    sort: "end",
  });

  // 최대 3개만 노출
  const purchaseItems = useMemo(
    () => (purchaseData ?? []).slice(0, 3),
    [purchaseData]
  );

  const saleItems = useMemo(() => (saleData ?? []).slice(0, 3), [saleData]);

  return (
    <>
      {/* 프로필 영역 */}
      <ProfilePreview
        nickname={profile?.nickname}
        avatarUrl={profile?.avatarUrl ?? ""}
        temperature={profile?.temperature ?? 0}
        email={profile?.email}
      />

      {profileLoading && (
        <div className="px-6 py-2 text-xs text-gray-500">프로필 로딩 중…</div>
      )}

      {profileError && (
        <div className="px-6 py-2 text-xs text-red-500">
          프로필 정보를 불러오지 못했습니다.
        </div>
      )}

      {/* 구매 내역 프리뷰 */}
      <ThreeCompactSection
        title="구매 내역"
        items={purchaseItems}
        role="buyer"
        seeAllTo="/purchase"
        sortBy="auctionEnd"
        emptyCtaLabel="구매하러 가기"
        onEmptyCtaClick={() => nav("/auctions")} // ← 상품 둘러보는 곳으로 맞춰줘
      />

      {/* 판매 내역 프리뷰 */}
      <ThreeCompactSection
        title="판매 내역"
        items={saleItems}
        role="seller"
        seeAllTo="/sales"
        sortBy="auctionEnd"
        emptyCtaLabel="경매 등록하기"
        onEmptyCtaClick={() => nav("/auctions/new")} // ← 경매 생성 페이지 경로 맞춰줘
      />
    </>
  );
};

export default MyPageMain;

// src/features/mypage/pages/MyPageMain.tsx
import React, { useMemo } from "react";
import ProfilePreview from "../components/profile/ProfilePreview";
import ThreeCompactSection from "../components/items/ThreeItems";
import { usePurchases } from "../hooks/usePurchases";
import { useSales } from "../hooks/useSales";
import { useProfile } from "../hooks/useProfile";
import { MOCK_PURCHASES, MOCK_SALES } from "../mocks/tradeMocks";

const MyPageMain: React.FC = () => {
  // ✅ 표준화된 프로필 (nickname, email, avatarUrl, temperature)
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
  } = useProfile(undefined, { endpoint: "/mypage" });

  // ✅ 구매/판매 3개 프리뷰
  const { data: purchaseData } = usePurchases({
    page: 0,
    size: 3,
    sort: "end",
    useMock: true,
  });

  const { data: saleData } = useSales({
    page: 0,
    size: 3,
    sort: "end",
    useMock: true,
  });

  const purchaseItems = useMemo(
    () => (purchaseData?.length ? purchaseData : MOCK_PURCHASES).slice(0, 3),
    [purchaseData]
  );

  const saleItems = useMemo(
    () => (saleData?.length ? saleData : MOCK_SALES).slice(0, 3),
    [saleData]
  );

  return (
    <>
      {/* 🔥 여기서 profile 값을 그냥 그대로 넘긴다 */}
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

      <ThreeCompactSection
        title="구매 내역"
        items={purchaseItems}
        role="buyer"
        seeAllTo="/purchase"
        sortBy="auctionEnd"
      />

      <ThreeCompactSection
        title="판매 내역"
        items={saleItems}
        role="seller"
        seeAllTo="/sales"
        sortBy="auctionEnd"
      />
    </>
  );
};

export default MyPageMain;

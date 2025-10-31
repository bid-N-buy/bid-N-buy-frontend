// src/features/mypage/pages/MyPageMain.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ProfilePreview from "../components/profile/ProfilePreview";
import ThreeCompactSection from "../components/items/ThreeItems";
import { usePurchases } from "../hooks/usePurchases";
import { useSales } from "../hooks/useSales";
import { useProfile } from "../hooks/useProfile";

const MyPageMain: React.FC = () => {
  const nav = useNavigate();

  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
  } = useProfile(undefined, { endpoint: "/mypage" });

  const { data: purchaseData } = usePurchases({
    page: 0,
    size: 3,
    sort: "end",
  });
  const { data: saleData } = useSales({ page: 0, size: 3, sort: "end" });

  const purchaseItems = useMemo(
    () => (purchaseData ?? []).slice(0, 3),
    [purchaseData]
  );
  const saleItems = useMemo(() => (saleData ?? []).slice(0, 3), [saleData]);

  return (
    // ✅ 동일한 폭 컨테이너 (부모에서 폭 결정, 내부는 w-full)
    <div className="mx-auto w-full max-w-[840px] px-4">
      <div className="min-w-0 space-y-10 md:space-y-12">
        {/* 프로필 카드 */}
        <div className="w-full">
          <ProfilePreview
            className="mb-6 md:mb-8"
            nickname={profile?.nickname}
            avatarUrl={profile?.avatarUrl ?? ""}
            temperature={profile?.temperature ?? 0}
            email={profile?.email}
          />

          {profileLoading && (
            <div className="px-1 text-xs text-gray-500">프로필 로딩 중…</div>
          )}
          {profileError && (
            <div className="px-1 text-xs font-medium text-red-500">
              프로필 정보를 불러오지 못했습니다.
            </div>
          )}
        </div>

        {/* 구매 내역 */}
        <div className="w-full">
          <ThreeCompactSection
            title="구매 내역"
            items={purchaseItems}
            role="buyer"
            seeAllTo="/purchase"
            sortBy="auctionEnd"
            emptyCtaLabel="구매하러 가기"
            onEmptyCtaClick={() => nav("/auctions")}
          />
        </div>

        {/* 판매 내역 */}
        <div className="w-full">
          <ThreeCompactSection
            title="판매 내역"
            items={saleItems}
            role="seller"
            seeAllTo="/sales"
            sortBy="auctionEnd"
            emptyCtaLabel="경매 등록하기"
            onEmptyCtaClick={() => nav("/auctions/new")}
          />
        </div>
      </div>
    </div>
  );
};

export default MyPageMain;

// src/features/mypage/pages/MyPageMain.tsx
import React, { useMemo } from "react";
import ProfilePreview from "../components/profile/ProfilePreview";
import ThreeItems from "../components/items/ThreeItems";
import { usePurchases } from "../hooks/usePurchases";
import { useSales } from "../hooks/useSales";
import { useProfile } from "../hooks/useProfile"; // ✅ 프로필 훅
import { MOCK_PURCHASES, MOCK_SALES } from "../mocks/tradeMocks";

const MyPageMain: React.FC = () => {
  /** ✅ 프로필: /mypage 기준으로 불러오기 */
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
  } = useProfile(undefined, { endpoint: "/mypage" });

  /** ✅ 목록: 기존 훅 유지(최대 3개) */
  const {
    data: purchaseData,
    // loading: purchaseLoading,
    // error: purchaseError,
  } = usePurchases({ page: 0, size: 3, sort: "end", useMock: true });

  const {
    data: saleData,
    // loading: saleLoading,
    // error: saleError,
  } = useSales({ page: 0, size: 3, sort: "end", useMock: true });

  /** ✅ 비어있으면 목업 대체 (3개 제한) */
  const purchaseItems = useMemo(
    () => (purchaseData?.length ? purchaseData : MOCK_PURCHASES).slice(0, 3),
    [purchaseData]
  );

  const saleItems = useMemo(
    () => (saleData?.length ? saleData : MOCK_SALES).slice(0, 3),
    [saleData]
  );

  /** ✅ ProfilePreview로 넘길 안전 값 보정 */
  const nickname = profile?.nickname ?? "사용자";
  const avatarUrl = profile?.avatarUrl; // 혹시 훅 외부에서 직접 넣을 때 대비
  const temperature =
    typeof profile?.temperature === "number" &&
    Number.isFinite(profile.temperature)
      ? profile.temperature
      : 0;

  return (
    <>
      {/* 프로필 영역 */}
      <ProfilePreview
        nickname={nickname}
        avatarUrl={avatarUrl}
        temperature={temperature}
        email={profile?.email}
        // email={profile?.email} // 컴포넌트가 지원하면 주석 해제
        // 로딩/에러 UI를 내부에서 처리하지 않는다면 아래 메시지 노출
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
      <ThreeItems
        title="구매 내역"
        items={purchaseItems}
        role="buyer"
        seeAllTo="/purchase"
        sortBy="auctionEnd"
      />

      {/* 판매 내역 프리뷰 */}
      <ThreeItems
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

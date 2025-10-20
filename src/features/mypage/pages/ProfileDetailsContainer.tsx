// src/features/mypage/pages/ProfileDetailsContainer.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ProfileDetails from "../components/profile/ProfileDetails";
import { useProfile } from "../hooks/useProfile";
import { useSalePreview } from "../hooks/useSalePreview";

const ProfileDetailsContainer: React.FC = () => {
  const nav = useNavigate();

  /** ✅ /mypage API로 현재 사용자 프로필 */
  const {
    data: profile,
    loading: pLoading,
    error: pError,
  } = useProfile(undefined, { endpoint: "/mypage" });

  /** ✅ 판매(완료/진행중) 프리뷰 그대로 유지 */
  const {
    items: soldPreview,
    count: soldCount,
    loading: soldLoading,
    error: soldError,
  } = useSalePreview("DONE");

  const {
    items: sellingPreview,
    count: sellingCount,
    loading: sellingLoading,
    error: sellingError,
  } = useSalePreview("BIDDING");

  if (pLoading || soldLoading || sellingLoading) {
    return <div className="p-6 text-sm text-gray-500">불러오는 중…</div>;
  }

  if (pError || soldError || sellingError) {
    return (
      <div className="p-6 text-sm text-rose-600">
        프로필 또는 거래 내역을 불러오지 못했습니다.
      </div>
    );
  }

  // ✅ /mypage 응답 매핑 + 보정
  const nickname = profile?.nickname ?? "NickName";
  const email = profile?.email ?? "";
  const avatarUrl =
    // 훅에서 이미 매핑되어 오도록 했다면 profile.avatarUrl 사용
    (profile as any)?.avatarUrl ?? (profile as any)?.profileImageUrl ?? "";
  const temperature =
    typeof profile?.temperature === "number" &&
    Number.isFinite(profile.temperature)
      ? profile.temperature
      : 0; // null → 0 보정

  return (
    <ProfileDetails
      avatarUrl={avatarUrl}
      nickname={nickname}
      email={email}
      temperature={temperature}
      soldCount={soldCount ?? 0}
      sellingCount={sellingCount ?? 0}
      soldPreview={soldPreview ?? []}
      sellingPreview={sellingPreview ?? []}
      onClickSold={() => nav("/mypage/sales")}
      onClickSelling={() => nav("/mypage/sales?tab=ongoing")}
    />
  );
};

export default ProfileDetailsContainer;

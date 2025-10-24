// src/features/mypage/pages/ProfileDetailsContainer.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ProfileDetails from "../components/profile/ProfileDetails";
import { useProfile } from "../hooks/useProfile";
import { useSalePreview } from "../hooks/useSalePreview";

const ProfileDetailsContainer: React.FC = () => {
  const nav = useNavigate();

  const {
    data: profile,
    loading: pLoading,
    error: pError,
  } = useProfile(undefined, { endpoint: "/mypage" });

  // 완료/결제중/종료 프리뷰
  const {
    items: soldPreview,
    count: soldCount,
    loading: soldLoading,
    error: soldError,
  } = useSalePreview("DONE", { page: 0, size: 3, sort: "end" });

  // 진행중(경매전/판매중) 프리뷰 — 목록형 엔드포인트만 사용
  const {
    items: sellingPreview,
    count: sellingCount,
    loading: sellingLoading,
    error: sellingError,
  } = useSalePreview("BIDDING", {
    ongoingListEndpoint: "/auctions", // ✅ 상세 호출 없이 목록으로만
    size: 3,
  });

  if (pLoading || soldLoading || sellingLoading)
    return <div className="p-6 text-sm text-gray-500">불러오는 중…</div>;

  if (pError || soldError || sellingError)
    return (
      <div className="p-6 text-sm text-rose-600">
        프로필 또는 판매 내역을 불러오지 못했습니다.
      </div>
    );

  const nickname = profile?.nickname ?? "NickName";
  const email = profile?.email ?? "";
  const avatarUrl =
    (profile as any)?.avatarUrl ?? (profile as any)?.profileImageUrl ?? "";
  const temperature =
    typeof profile?.temperature === "number" &&
    Number.isFinite(profile.temperature)
      ? profile.temperature
      : 0;

  return (
    <ProfileDetails
      avatarUrl={avatarUrl}
      nickname={nickname}
      email={email}
      temperature={temperature}
      soldCount={soldCount}
      sellingCount={sellingCount}
      soldPreview={soldPreview}
      sellingPreview={sellingPreview}
      onClickSold={() => nav("/mypage/sales?tab=completed")}
      onClickSelling={() => nav("/mypage/my-auctions?status=BEFORE,SALE")}
      onItemClick={(id) => nav(`/auctions/${id}`)}
    />
  );
};

export default ProfileDetailsContainer;

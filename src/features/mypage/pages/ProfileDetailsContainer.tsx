// src/features/mypage/pages/ProfileDetailsContainer.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProfileDetails from "../components/profile/ProfileDetails";
import { useProfile } from "../hooks/useProfile";
import { useSalePreview } from "../hooks/useSalePreview";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";

type OtherProfileRes = {
  nickname: string;
  temperature: number | null;
  profileImageUrl?: string | null;
  totalProductsCount: number;
  salesCompletedCount: number;
};

const ProfileDetailsContainer: React.FC = () => {
  const nav = useNavigate();
  const myUserId = useAuthStore((s) => s.userId); // 로그인 유저 id

  const { targetUserId } = useParams<{ targetUserId?: string }>();
  const isOtherUserPage = Boolean(targetUserId);

  console.log("[PDC] targetUserId =", targetUserId);
  console.log(
    "[PDC] isOtherUserPage =",
    isOtherUserPage,
    "myUserId =",
    myUserId
  );

  // ✅ 내 id로 /users/:id 접근하면 /profile 로 보내 혼동 방지
  React.useEffect(() => {
    if (!targetUserId || myUserId == null) return;
    if (String(myUserId) === String(targetUserId)) {
      console.log("[PDC] same user id detected. redirect -> /profile");
      nav("/profile", { replace: true });
    }
  }, [targetUserId, myUserId, nav]);

  // 1) 내 프로필 데이터 (/mypage) - 내 페이지에서만 호출
  const {
    data: myProfile,
    loading: myProfileLoading,
    error: myProfileError,
  } = useProfile(undefined, {
    endpoint: "/mypage",
    enabled: !isOtherUserPage,
  });

  // 2) 다른 유저 프로필 데이터 (/auth/other/:id) - 남의 페이지에서만 호출
  const [otherProfile, setOtherProfile] =
    React.useState<OtherProfileRes | null>(null);
  const [otherLoading, setOtherLoading] = React.useState(false);
  const [otherError, setOtherError] = React.useState<unknown>(null);

  React.useEffect(() => {
    if (!isOtherUserPage || !targetUserId) return;

    let alive = true;

    (async () => {
      try {
        setOtherLoading(true);
        setOtherError(null);

        console.log("[PDC] fetching other profile for", targetUserId);

        const { data } = await api.get<OtherProfileRes>(
          `/auth/other/${targetUserId}`,
          {
            withCredentials: true,
          }
        );

        if (!alive) return;
        console.log("[PDC] /auth/other response =", data);
        setOtherProfile(data ?? null);
      } catch (err) {
        if (!alive) return;
        console.error("[PDC] otherProfile error =", err);
        setOtherError(err);
      } finally {
        if (alive) setOtherLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOtherUserPage, targetUserId]);

  // 3) 판매 프리뷰

  // (A) 내 판매완료 프리뷰
  //  - 중요: COMPLETED일 땐 ownerUserId를 넘기지 않아야
  //          훅에서 viewingOther=false로 판단해서 /mypage/sales 타게 됨
  const {
    items: completedPreviewMine,
    count: completedCountMine,
    loading: completedLoading,
    error: completedError,
  } = useSalePreview("COMPLETED", {
    page: 0,
    size: 3,
    sort: "end",
    enabled: !isOtherUserPage, // 내 페이지에서만
    ownerUserId: undefined, // <= CHECK: undefined 유지
    ownerNickname: myProfile?.nickname,
  });

  // (B) 진행중 프리뷰
  // 진행중은 내 페이지/남의 페이지 둘 다 가능
  const ongoingEnabled = isOtherUserPage
    ? Boolean(otherProfile?.nickname)
    : Boolean(myProfile?.nickname);

  const {
    items: ongoingPreviewRaw,
    count: ongoingCountRaw,
    loading: ongoingLoading,
    error: ongoingError,
  } = useSalePreview("ONGOING", {
    page: 0,
    size: 3,
    sort: "end",
    enabled: ongoingEnabled,
    ownerUserId: isOtherUserPage ? targetUserId : myUserId,
    ownerNickname: isOtherUserPage
      ? otherProfile?.nickname
      : myProfile?.nickname,
  });

  // 4) 로딩/에러 상태
  const stillPreparingOther =
    isOtherUserPage && (!otherProfile || otherLoading);

  const isLoading = isOtherUserPage
    ? stillPreparingOther || ongoingLoading
    : myProfileLoading || completedLoading || ongoingLoading;

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500" aria-live="polite">
        불러오는 중…
      </div>
    );
  }

  const loadError = isOtherUserPage
    ? otherError || ongoingError
    : myProfileError || completedError || ongoingError;

  if (loadError) {
    return (
      <div className="p-6 text-sm text-rose-600">
        프로필 또는 판매 내역을 불러오지 못했습니다.
      </div>
    );
  }

  // 5) 최종 뷰 데이터 조립

  // 닉네임 / 이메일
  const nickname = isOtherUserPage
    ? otherProfile?.nickname || "사용자"
    : myProfile?.nickname || "NickName";

  const email = isOtherUserPage ? undefined : myProfile?.email || "";

  // 아바타
  const avatarUrl = isOtherUserPage
    ? otherProfile?.profileImageUrl || undefined
    : myProfile?.avatarUrl || (myProfile as any)?.profileImageUrl || undefined;

  // 매너온도
  const temperature = isOtherUserPage
    ? typeof otherProfile?.temperature === "number" &&
      Number.isFinite(otherProfile.temperature)
      ? otherProfile.temperature
      : null
    : typeof myProfile?.temperature === "number" &&
        Number.isFinite(myProfile.temperature)
      ? myProfile.temperature
      : null;

  // 판매완료 카운트
  const effectiveCompletedCount =
    completedCountMine ??
    (completedPreviewMine ? completedPreviewMine.length : 0);

  const soldCount = isOtherUserPage
    ? (otherProfile?.salesCompletedCount ?? 0)
    : effectiveCompletedCount;

  // 판매중 카운트
  const effectiveOngoingCount =
    ongoingCountRaw ?? (ongoingPreviewRaw ? ongoingPreviewRaw.length : 0);

  const sellingCount = isOtherUserPage
    ? Math.max(
        0,
        (otherProfile?.totalProductsCount ?? 0) -
          (otherProfile?.salesCompletedCount ?? 0)
      )
    : effectiveOngoingCount;

  // 미리보기 아이템들
  const soldPreview = isOtherUserPage ? [] : (completedPreviewMine ?? []);
  const sellingPreview = ongoingPreviewRaw ?? [];

  console.log("[PDC] final nickname =", nickname);
  console.log("[PDC] final email =", email);
  console.log("[PDC] final otherProfile =", otherProfile);
  console.log("[PDC] final myProfile =", myProfile);
  console.log("[PDC] completedPreviewMine =", completedPreviewMine);
  console.log("[PDC] completedCountMine =", completedCountMine);
  console.log("[PDC] ongoingPreviewRaw =", ongoingPreviewRaw);
  console.log("[PDC] ongoingCountRaw =", ongoingCountRaw);

  // 6) 핸들러
  const handleClickSoldList = () => {
    if (isOtherUserPage) nav(`/users/${targetUserId}/sales?tab=completed`);
    else nav("/mypage/sales?tab=completed");
  };

  const handleClickSellingList = () => {
    if (isOtherUserPage) nav(`/users/${targetUserId}/sales?tab=ongoing`);
    else nav(`/mypage/sales?tab=ongoing`);
  };

  const handleClickItem = (id: string | number) => {
    nav(`/auctions/${id}`);
  };

  // ✅ 새 핸들러: 경매 시작하기 버튼 눌렀을 때 이동
  const handleClickStartAuction = () => {
    // 여기 라우트는 실제 등록/작성 페이지에 맞춰서 바꿔줘
    nav("/auctions/new");
  };

  // 7) 렌더
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
      onClickSold={handleClickSoldList}
      onClickSelling={handleClickSellingList}
      onItemClick={handleClickItem}
      onClickStartAuction={handleClickStartAuction} // ⬅ 추가된 부분
    />
  );
};

export default ProfileDetailsContainer;

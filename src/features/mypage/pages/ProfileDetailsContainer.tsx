// src/features/mypage/containers/ProfileDetailsContainer.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProfileDetails from "../components/profile/ProfileDetails";
import { useProfile } from "../hooks/useProfile";
import { useSalePreview } from "../hooks/useSalePreview";
import api from "../../../shared/api/axiosInstance";

type OtherProfileRes = {
  nickname: string;
  temperature: number | null;
  profileImageUrl?: string | null;
  totalProductsCount: number;
  salesCompletedCount: number;
};

const ProfileDetailsContainer: React.FC = () => {
  const nav = useNavigate();

  // /profile  -> targetUserId undefined
  // /users/:targetUserId -> targetUserId "123"
  const { targetUserId } = useParams<{ targetUserId?: string }>();
  const isOtherUserPage = Boolean(targetUserId);

  /* =========================================================
   * 1) 내 프로필 (내 페이지에서만 호출)
   * ========================================================= */
  const {
    data: myProfile,
    loading: myProfileLoading,
    error: myProfileError,
  } = useProfile(undefined, {
    endpoint: "/mypage",
    enabled: !isOtherUserPage,
  });

  /* =========================================================
   * 2) 다른 유저 프로필 (/users/:id 에서만 호출)
   * ========================================================= */
  const [otherProfile, setOtherProfile] =
    React.useState<OtherProfileRes | null>(null);
  const [otherLoading, setOtherLoading] = React.useState(false);
  const [otherError, setOtherError] = React.useState<unknown>(null);

  React.useEffect(() => {
    // only run when looking at someone else's profile
    if (!isOtherUserPage || !targetUserId) return;

    let alive = true;

    (async () => {
      try {
        setOtherLoading(true);
        setOtherError(null);

        const { data } = await api.get<OtherProfileRes>(
          `/auth/other/${targetUserId}`,
          { withCredentials: true }
        );

        if (!alive) return;
        setOtherProfile(data ?? null);
      } catch (err) {
        if (!alive) return;
        setOtherError(err);
      } finally {
        if (alive) {
          setOtherLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOtherUserPage, targetUserId]);

  /* =========================================================
   * 3) 판매 프리뷰 (완료된 거래 / 판매중 거래)
   *    - 내 페이지일 때는 둘 다 호출
   *    - 상대 페이지일 때:
   *        COMPLETED 프리뷰는 굳이 안 보여주면 enabled=false
   *        ONGOING 프리뷰만 ownerUserId로 가져오기
   * ========================================================= */

  // 판매완료(내 것만)
  const {
    items: completedPreviewMine,
    count: completedCountMine,
    loading: completedLoading,
    error: completedError,
  } = useSalePreview("COMPLETED", {
    page: 0,
    size: 3,
    sort: "end",
    enabled: !isOtherUserPage, // 다른 유저 프로필에서는 안 불러옴
    ownerUserId: undefined,
    ownerNickname: myProfile?.nickname,
  });

  // 판매중
  const {
    items: ongoingPreview,
    count: ongoingCount,
    loading: ongoingLoading,
    error: ongoingError,
  } = useSalePreview("ONGOING", {
    page: 0,
    size: 3,
    sort: "end",
    // 다른 유저 화면에서도 보고 싶으면 true.
    // 만약 "상대방 판매중 목록은 비공개" 정책이면 isOtherUserPage ? false : true 로 바꿔.
    enabled: true,
    ownerUserId: isOtherUserPage ? targetUserId : undefined,
    ownerNickname: isOtherUserPage
      ? otherProfile?.nickname
      : myProfile?.nickname,
  });

  /* =========================================================
   * 4) 로딩/에러 상태 머지
   * ========================================================= */
  // 로딩: 내페이지면 내프로필/완료/진행중, 상대페이지면 상대/진행중
  const isLoading = isOtherUserPage
    ? otherLoading || ongoingLoading
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

  /* =========================================================
   * 5) 뷰에 넣을 데이터 가공
   * ========================================================= */

  // 닉네임
  const nickname = isOtherUserPage
    ? otherProfile?.nickname || "사용자"
    : myProfile?.nickname || "NickName";

  // 이메일: 다른 사람 프로필이면 숨김
  const email = isOtherUserPage ? undefined : myProfile?.email || "";

  // 아바타 URL
  const avatarUrl = isOtherUserPage
    ? otherProfile?.profileImageUrl || undefined
    : myProfile?.avatarUrl ||
      // 혹시 백엔드에서 profileImageUrl만 주는 케이스 커버
      (myProfile as any)?.profileImageUrl ||
      undefined;

  // 매너 온도
  // - 상대 유저: number면 그대로, 아니면 null
  // - 내 프로필: 내 temperature가 number면 그대로, 아니면 null
  const temperature = isOtherUserPage
    ? typeof otherProfile?.temperature === "number" &&
      Number.isFinite(otherProfile.temperature)
      ? otherProfile.temperature
      : null
    : typeof myProfile?.temperature === "number" &&
        Number.isFinite(myProfile.temperature)
      ? myProfile.temperature
      : null;

  // 판매완료 / 판매중 개수
  const soldCount = isOtherUserPage
    ? (otherProfile?.salesCompletedCount ?? 0)
    : (completedCountMine ?? 0);

  const sellingCount = isOtherUserPage
    ? Math.max(
        0,
        (otherProfile?.totalProductsCount ?? 0) -
          (otherProfile?.salesCompletedCount ?? 0)
      )
    : (ongoingCount ?? 0);

  // 미리보기 리스트
  const soldPreview = isOtherUserPage ? [] : (completedPreviewMine ?? []);
  const sellingPreview = ongoingPreview ?? [];

  /* =========================================================
   * 6) 이동 핸들러
   * ========================================================= */
  const handleClickSoldList = () => {
    if (isOtherUserPage) {
      nav(`/users/${targetUserId}/sales?tab=completed`);
    } else {
      nav("/mypage/sales?tab=completed");
    }
  };

  const handleClickSellingList = () => {
    if (isOtherUserPage) {
      nav(`/users/${targetUserId}/sales?tab=ongoing`);
    } else {
      nav("/mypage/sales?tab=ongoing");
    }
  };

  const handleClickItem = (id: string | number) => {
    nav(`/auctions/${id}`);
  };

  /* =========================================================
   * 7) 렌더
   * ========================================================= */
  return (
    <ProfileDetails
      avatarUrl={avatarUrl}
      nickname={nickname}
      email={email}
      temperature={temperature} // null 가능
      soldCount={soldCount}
      sellingCount={sellingCount}
      soldPreview={soldPreview}
      sellingPreview={sellingPreview}
      onClickSold={handleClickSoldList}
      onClickSelling={handleClickSellingList}
      onItemClick={handleClickItem}
    />
  );
};

export default ProfileDetailsContainer;

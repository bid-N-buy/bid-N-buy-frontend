// src/containers/profile/ProfileDetailsContainer.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProfileDetails, {
  type Item as PreviewItemUI,
} from "../components/profile/ProfileDetails";
import { useProfile } from "../hooks/useProfile";
import { useSalePreview } from "../hooks/useSalePreview";
import { useOtherUserSales } from "../hooks/useOtherUserSales";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";

/* ---------------- Types ---------------- */
type OtherProfileRes = {
  nickname: string;
  temperature: number | null;
  profileImageUrl?: string | null;
  totalProductsCount: number;
  salesCompletedCount: number;
};

type AnyPreview = {
  id?: number | string;
  auctionId?: number | string;
  title?: string;
  itemImageUrl?: string | null;
  mainImageUrl?: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null; // 내 훅에서 올 수 있는 이름
  productImageUrl?: string | null; // 혹시 모를 다른 이름
};

/* ---------------- Image Mapper ---------------- */
/** 백엔드/훅별 제각각인 이미지 필드를 UI 컴포넌트가 기대하는 { thumbnail }로 통일 */
function toUIItem(src: AnyPreview): PreviewItemUI {
  return {
    id: (src.auctionId ?? src.id) as number | string,
    title: src.title ?? "",
    thumbnail:
      src.thumbnail ?? // useSalePreview 에서 오는 경우
      src.productImageUrl ?? // 여분 명칭
      src.itemImageUrl ?? // 타인 판매완료 API
      src.mainImageUrl ?? // 타인 판매중 API
      src.thumbnailUrl ?? // 기타
      src.imageUrl ?? // 기타
      undefined,
  };
}

const ProfileDetailsContainer: React.FC = () => {
  const nav = useNavigate();
  const myUserId = useAuthStore((s) => s.userId);

  const { targetUserId } = useParams<{ targetUserId?: string }>();
  const isOtherUserPage = Boolean(targetUserId);

  /* 내 ID로 /users/:id 접근하면 /profile 로 리다이렉트 */
  React.useEffect(() => {
    if (!targetUserId || myUserId == null) return;
    if (String(myUserId) === String(targetUserId)) {
      nav("/profile", { replace: true });
    }
  }, [targetUserId, myUserId, nav]);

  /* 1) 내 프로필 */
  const {
    data: myProfile,
    loading: myProfileLoading,
    error: myProfileError,
  } = useProfile(undefined, {
    endpoint: "/mypage",
    enabled: !isOtherUserPage,
  });

  /* 2) 타인 프로필 */
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
        const { data } = await api.get<OtherProfileRes>(
          `/auth/other/${targetUserId}`,
          {
            withCredentials: false,
          }
        );
        if (alive) setOtherProfile(data ?? null);
      } catch (err) {
        if (alive) setOtherError(err);
      } finally {
        if (alive) setOtherLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOtherUserPage, targetUserId]);

  /* 3) 판매 프리뷰 */

  // 3-A) 내 판매완료
  const {
    items: completedPreviewMineRaw,
    count: completedCountMine,
    loading: completedLoading,
    error: completedError,
  } = useSalePreview("COMPLETED", {
    page: 0,
    size: 3,
    sort: "end",
    enabled: !isOtherUserPage,
    ownerUserId: undefined,
    ownerNickname: myProfile?.nickname,
  });

  // 3-B) 내 진행중
  const ongoingEnabledMine = !isOtherUserPage && Boolean(myProfile?.nickname);
  const {
    items: ongoingPreviewMineRaw,
    count: ongoingCountMine,
    loading: ongoingLoadingMine,
    error: ongoingErrorMine,
  } = useSalePreview("ONGOING", {
    page: 0,
    size: 3,
    sort: "end",
    enabled: ongoingEnabledMine,
    ...(myUserId != null ? { ownerUserId: myUserId } : {}),
    ownerNickname: myProfile?.nickname,
  });

  // 3-C) 타인 판매완료/판매중 (전용 API)
  const {
    data: otherSalesData, // { completedSalesCount, completedSales, onSaleCount, onSale }
    loading: otherSalesLoading,
    error: otherSalesError,
  } = useOtherUserSales({
    targetUserId,
    enabled: isOtherUserPage,
  });

  /* 4) 로딩 / 에러 */
  const stillPreparingOther =
    isOtherUserPage && (!otherProfile || otherLoading);

  const isLoading = isOtherUserPage
    ? stillPreparingOther || otherSalesLoading
    : myProfileLoading || completedLoading || ongoingLoadingMine;

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500" aria-live="polite">
        불러오는 중…
      </div>
    );
  }

  const loadError = isOtherUserPage
    ? otherError || otherSalesError
    : myProfileError || completedError || ongoingErrorMine;

  if (loadError) {
    return (
      <div className="p-6 text-sm text-rose-600">
        프로필 또는 판매 내역을 불러오지 못했습니다.
      </div>
    );
  }

  /* 5) 최종 데이터 조립 */
  const nickname = isOtherUserPage
    ? otherProfile?.nickname || "사용자"
    : myProfile?.nickname || "NickName";
  const email = isOtherUserPage ? undefined : myProfile?.email || "";

  const avatarUrl = isOtherUserPage
    ? otherProfile?.profileImageUrl || undefined
    : myProfile?.avatarUrl || (myProfile as any)?.profileImageUrl || undefined;

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
  const soldCount = isOtherUserPage
    ? (otherSalesData?.completedSalesCount ?? 0)
    : (completedCountMine ?? completedPreviewMineRaw?.length ?? 0);

  // 판매중 카운트
  const sellingCount = isOtherUserPage
    ? (otherSalesData?.onSaleCount ?? otherSalesData?.onSale?.length ?? 0)
    : (ongoingCountMine ??
      (ongoingPreviewMineRaw ? ongoingPreviewMineRaw.length : 0));

  // 프리뷰 리스트(이미지 필드 통일)
  const soldPreview: PreviewItemUI[] = isOtherUserPage
    ? (otherSalesData?.completedSales ?? []).slice(0, 3).map(toUIItem)
    : (completedPreviewMineRaw ?? []).map(toUIItem);

  const sellingPreview: PreviewItemUI[] = isOtherUserPage
    ? (otherSalesData?.onSale ?? []).slice(0, 3).map(toUIItem)
    : (ongoingPreviewMineRaw ?? []).map(toUIItem);

  /* 6) 핸들러 */
  const handleClickSoldList = () => {
    if (isOtherUserPage) {
      // 타인 프로필 → 경매 목록으로
      // 절대 URL로 나가고 싶다면 window.location.assign("http://localhost:5173/auctions");
      nav("/auctions?includeEnded=1");
      return;
    }
    // 내 프로필
    nav("/mypage/sales?tab=completed");
  };

  const handleClickSellingList = () => {
    if (isOtherUserPage) {
      // 타인 프로필 → 경매 목록으로
      // 절대 URL로 나가고 싶다면 window.location.assign("http://localhost:5173/auctions");
      nav("/auctions");
      return;
    }
    // 내 프로필
    nav("/mypage/sales?tab=ongoing");
  };

  const handleClickItem = (id: string | number) => {
    nav(`/auctions/${id}`);
  };

  const handleClickStartAuction = () => {
    nav("/auctions/new");
  };

  /* 7) Render */
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
      onClickStartAuction={handleClickStartAuction}
      // 내 페이지에는 목업 허용, 타인 페이지는 실데이터만
      useMockOnEmpty={!isOtherUserPage}
    />
  );
};

export default ProfileDetailsContainer;

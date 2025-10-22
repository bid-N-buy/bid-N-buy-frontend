// src/features/mypage/components/profile/ProfilePreview.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../../shared/api/axiosInstance";
import { useAuthStore } from "../../../auth/store/authStore";

type ApiUser = {
  email?: string;
  nickname?: string;
  profileImageUrl?: string | null;
  profile_image_url?: string | null;
  temperature?: number | null;
};

type Props = {
  userId?: number | string;
  avatarUrl?: string;
  nickname?: string;
  email?: string;
  temperature?: number;
  onManageProfile?: () => void; // (선택) 추가 행동이 필요할 때만 사용
  onAuction?: () => void;
};

const ProfilePreview: React.FC<Props> = ({
  userId,
  avatarUrl = "",
  nickname = "NickName",
  email = "test123@test.com",
  temperature = 55,
  onManageProfile,
  onAuction,
}) => {
  // ✅ 스토어 준비/토큰 가드
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = (useAuthStore as any).persist?.hasHydrated?.() ?? true;

  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ApiUser | null>(null);

  useEffect(() => {
    let alive = true;

    // 준비되지 않았거나 식별자 없으면 요청 금지
    if (!hasHydrated || !userId || !accessToken) {
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();

    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ApiUser>(`/auth/${userId}`, {
          signal: ctrl.signal,
          // 인터셉터가 붙여주지만, 혹시 모를 타이밍 이슈 대비
          headers: { Authorization: `Bearer ${accessToken}` },
          validateStatus: (s) => s >= 200 && s < 500, // 401을 catch로 안 던지게
        });

        if (!alive) return;

        if (!data || (data as any).status === 401) {
          // ❌ 여기서 clear() 절대 금지! 그냥 화면에만 표시
          setError("세션이 만료되었을 수 있어요. 다시 시도해 주세요.");
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (e: any) {
        if (!alive) return;
        if (e.name === "CanceledError") return;
        setError(
          e?.response?.data?.message ??
            e?.message ??
            "프로필 정보를 불러오지 못했습니다."
        );
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [userId, accessToken, hasHydrated]);

  const merged = useMemo(() => {
    const apiAvatar =
      profile?.profileImageUrl ?? profile?.profile_image_url ?? null;
    return {
      nickname: profile?.nickname ?? nickname,
      email: profile?.email ?? email,
      avatarUrl: apiAvatar ?? avatarUrl ?? "",
      temperature:
        typeof profile?.temperature === "number"
          ? profile!.temperature!
          : (temperature ?? 55),
    };
  }, [profile, nickname, email, avatarUrl, temperature]);

  const clamped = Math.max(0, Math.min(100, merged.temperature ?? 0));

  return (
    <section className="h-[200px] w-[786px] rounded-[20px] bg-[#ECDEF5] pt-[20px] pr-[30px] pl-[25px] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-6">
        {/* 아바타 */}
        <div className="size-[150px] overflow-hidden rounded-full bg-neutral-700/90 md:size-[150px]">
          {merged.avatarUrl ? (
            <img
              src={merged.avatarUrl}
              alt={`${merged.nickname} avatar`}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        {/* 가운데 정보 */}
        <div className="min-w-0 flex-1 gap-[10px]">
          <h3 className="leading-tight font-bold text-neutral-900">
            {!hasHydrated
              ? "불러오는 중…"
              : loading
                ? "불러오는 중…"
                : merged.nickname}
          </h3>
          <h4 className="mt-1 truncate text-[20px] text-neutral-700">
            {loading ? "—" : merged.email}
          </h4>

          {/* 온도 바 */}
          <div className="mt-4 h-[14px] max-w-[354px]">
            <div className="relative md:h-[20px]">
              <div className="absolute inset-0 rounded-full bg-neutral-900/90" />
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-[#8322BF]"
                style={{ width: `${clamped}%` }}
              />
              <div
                className="absolute top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[0_6px_18px_rgba(131,34,191,0.25)] ring-4 ring-[#8322BF] md:size-9"
                style={{ left: `calc(${clamped}% - 0.5rem)` }}
                aria-hidden
              />
            </div>
          </div>

          {error && (
            <p className="mt-2 text-sm text-rose-600">
              프로필 불러오기 실패: {error}
            </p>
          )}
        </div>

        {/* 오른쪽 버튼: 단순 라우팅만 */}
        <div className="hidden flex-col gap-5 self-start md:flex">
          <Link to="/profile">
            <button
              onClick={onManageProfile /* 필요 시 추가 동작만 */}
              className="h-[40px] w-[120px] rounded-[10px] bg-white/90 px-7 text-[15px] font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[5px]"
            >
              프로필 보기
            </button>
          </Link>
          <Link to="/auctions/new">
            <button
              onClick={onAuction}
              className="h-[40px] w-[120px] rounded-[10px] bg-white/90 px-7 text-[15px] font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[5px]"
            >
              경매 등록
            </button>
          </Link>
        </div>
      </div>

      {/* 모바일 버튼 */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:hidden">
        <Link to="/profile" className="contents">
          <button
            onClick={onManageProfile}
            className="rounded-2xl bg-white/90 px-4 py-3 font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[1px]"
          >
            프로필 보기
          </button>
        </Link>
        <Link to="/auctions/new" className="contents">
          <button
            onClick={onAuction}
            className="rounded-2xl bg-white/90 px-4 py-3 font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[1px]"
          >
            경매 등록
          </button>
        </Link>
      </div>
    </section>
  );
};

export default ProfilePreview;

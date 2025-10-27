// src/features/mypage/components/profile/ProfilePreview.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";

type Props = {
  nickname?: string;
  email?: string;
  avatarUrl?: string;
  temperature?: number; // 0~100
  onManageProfile?: () => void;
  onAuction?: () => void;
};

const ProfilePreview: React.FC<Props> = ({
  nickname = "NickName",
  email = "test123@test.com",
  avatarUrl = "",
  temperature = 0,
  onManageProfile,
  onAuction,
}) => {
  // 안전 0~100 보정
  const temp = useMemo(() => {
    const n = Number(temperature);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }, [temperature]);

  return (
    <section className="w-[786px] rounded-[20px] bg-[#ECDEF5] p-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-6">
        {/* 아바타 */}
        <div className="size-[150px] flex-shrink-0 overflow-hidden rounded-full bg-neutral-700/90">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${nickname} avatar`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>

        {/* 가운데 정보 영역 */}
        <div className="min-w-0 flex-1">
          {/* 닉네임 */}
          <div className="text-[28px] leading-tight font-bold text-neutral-900">
            {nickname}
          </div>

          {/* 이메일 */}
          <div className="mt-2 truncate text-[16px] text-neutral-800">
            {email || "—"}
          </div>

          {/* 온도 게이지 (카드 없이 그냥 라인만) */}
          <div className="mt-5 w-[320px] max-w-full">
            {/* 라벨 + 현재 온도 */}
            <div className="mb-2 flex items-center justify-between text-[12px] leading-none text-neutral-800">
              <span className="font-medium text-neutral-800">매너온도</span>
              <span className="font-semibold text-[#8322BF]">
                {temp}
                <span className="align-top text-[11px] font-normal text-[#8322BF]">
                  ℃
                </span>
              </span>
            </div>

            {/* 게이지 바 자체 */}
            <div className="relative h-[12px] w-full rounded-full bg-neutral-800/80 shadow-[inset_0_0_4px_rgba(0,0,0,0.4)]">
              {/* 채워진 부분 */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#8322BF] transition-[width] duration-300"
                style={{ width: `${temp}%` }}
              />

              {/* 포인터 동그라미 */}
              <div
                className="absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#8322BF] shadow-[0_6px_18px_rgba(131,34,191,0.4)] ring-[3px] ring-[#8322BF]/30"
                style={{ left: `${temp}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* 오른쪽 버튼 영역 */}
        <div className="flex flex-col gap-4">
          <Link to="/profile">
            <button
              onClick={onManageProfile}
              className="min-w-[110px] rounded-[10px] bg-white/90 px-4 py-3 text-[14px] font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[3px]"
            >
              프로필보기
            </button>
          </Link>

          <Link to="/auctions/new">
            <button
              onClick={onAuction}
              className="min-w-[110px] rounded-[10px] bg-white/90 px-4 py-3 text-[14px] font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[3px]"
            >
              경매등록
            </button>
          </Link>
        </div>
      </div>

      {/* 모바일 버튼 (데스크탑에선 숨김, 필요하면 md:hidden으로 조건부 처리 가능) */}
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

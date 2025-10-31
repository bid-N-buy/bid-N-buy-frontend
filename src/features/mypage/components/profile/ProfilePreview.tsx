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
  /** 외부에서 여백/폭 제어용 */
  className?: string;
};

// 범위 고정 유틸
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const ProfilePreview: React.FC<Props> = ({
  nickname = "NickName",
  email = "test123@test.com",
  avatarUrl = "",
  temperature,
  onManageProfile,
  onAuction,
  className = "",
}) => {
  // 안전 0~100 보정 + 소수점 1자리 반올림
  const temp = useMemo<number | null>(() => {
    const n = Number(temperature);
    if (!Number.isFinite(n)) return null;
    return parseFloat(clamp(n, 0, 100).toFixed(1));
  }, [temperature]);

  const knobLeft = temp !== null ? `${temp}%` : "0%";

  return (
    <section
      className={[
        // ✅ 고정폭 제거: 부모의 max-width를 그대로 따름
        "w-full min-w-0 rounded-[16px] bg-[#ECDEF5] md:rounded-[20px]",
        "p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-5 md:p-6",
        className,
      ].join(" ")}
    >
      {/* 본문: 모바일 세로, md부터 가로 */}
      <div className="flex min-w-0 flex-col items-stretch gap-4 md:flex-row md:items-start md:gap-6">
        {/* 아바타 */}
        <div className="size-20 flex-shrink-0 overflow-hidden rounded-full bg-neutral-700/90 sm:size-24 md:size-[120px] lg:size-[150px]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${nickname} avatar`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>

        {/* 가운데 정보 */}
        <div className="min-w-0 flex-1">
          <div className="text-xl leading-tight font-bold text-neutral-900 sm:text-2xl md:text-[26px] lg:text-[28px]">
            {nickname}
          </div>

          <div className="mt-1.5 truncate text-sm text-neutral-800 sm:text-[15px] md:text-[16px]">
            {email || "—"}
          </div>

          {/* 온도 게이지 */}
          <div className="mt-4 w-full md:mt-5 md:max-w-[360px] lg:max-w-[420px]">
            <div className="mb-2 flex items-center justify-between text-[11px] leading-none text-neutral-800 sm:text-[12px]">
              <span className="font-medium text-neutral-800">매너온도</span>
              {temp === null ? (
                <span className="font-normal text-neutral-500">-</span>
              ) : (
                <span className="font-semibold text-[#8322BF]">
                  {temp}
                  <span className="align-top text-[10px] font-normal text-[#8322BF] sm:text-[11px]">
                    ℃
                  </span>
                </span>
              )}
            </div>

            <div className="relative h-[10px] w-full rounded-full bg-neutral-800/80 shadow-[inset_0_0_4px_rgba(0,0,0,0.4)] sm:h-[12px]">
              {temp !== null && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#8322BF] transition-[width] duration-300"
                  style={{ width: `${temp}%` }}
                />
              )}
              {temp !== null && (
                <div
                  className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-white bg-[#8322BF] shadow-[0_6px_18px_rgba(131,34,191,0.4)] ring-2 ring-[#8322BF]/30 sm:h-[20px] sm:w-[20px] sm:border-[3px] sm:ring-[3px] lg:h-[22px] lg:w-[22px]"
                  style={{ left: knobLeft }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </div>

        {/* 우측 버튼: md 이상 */}
        <div className="hidden md:flex md:flex-col md:gap-3 lg:gap-4">
          <Link to="/profile">
            <button
              onClick={onManageProfile}
              className="min-w-[110px] rounded-[10px] bg-white/90 px-4 py-2.5 text-[13px] font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[2px] lg:py-3 lg:text-[14px]"
            >
              프로필보기
            </button>
          </Link>
          <Link to="/auctions/new">
            <button
              onClick={onAuction}
              className="min-w-[110px] rounded-[10px] bg-white/90 px-4 py-2.5 text-[13px] font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[2px] lg:py-3 lg:text-[14px]"
            >
              경매등록
            </button>
          </Link>
        </div>
      </div>

      {/* 모바일 버튼 */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 md:hidden">
        <Link to="/profile" className="contents">
          <button
            onClick={onManageProfile}
            className="rounded-2xl bg-white/90 px-3 py-2.5 text-sm font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[1px] sm:px-4 sm:py-3"
          >
            프로필 보기
          </button>
        </Link>
        <Link to="/auctions/new" className="contents">
          <button
            onClick={onAuction}
            className="rounded-2xl bg-white/90 px-3 py-2.5 text-sm font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[1px] sm:px-4 sm:py-3"
          >
            경매 등록
          </button>
        </Link>
      </div>
    </section>
  );
};

export default ProfilePreview;

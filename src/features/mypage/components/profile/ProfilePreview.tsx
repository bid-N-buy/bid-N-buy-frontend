// ProfilePreview.tsx
import React from "react";

type Props = {
  avatarUrl?: string;
  nickname?: string;
  email?: string;
  temperature?: number; // 0~100
  onManageProfile?: () => void;
  onAuction?: () => void;
};

const ProfilePreview: React.FC<Props> = ({
  avatarUrl = "",
  nickname = "NickName",
  email = "test123@test.com",
  temperature = 55,
  onManageProfile,
  onAuction,
}) => {
  const clamped = Math.max(0, Math.min(100, temperature));

  return (
    <section className="w-full rounded-[32px] bg-[#ECDEF5] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] md:p-10">
      <div className="flex items-center gap-6 md:gap-10">
        {/* 아바타 */}
        <div className="size-[96px] shrink-0 overflow-hidden rounded-full bg-neutral-700/90 md:size-[176px]">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={`${nickname} avatar`}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* 가운데 정보 */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[28px] leading-tight font-extrabold text-neutral-900 md:text-[48px]">
            {nickname}
          </h3>
          <p className="mt-2 truncate text-[20px] text-neutral-700 md:text-[40px]">
            {email}
          </p>

          {/* 온도 바 */}
          <div className="mt-5 max-w-[800px] md:mt-8">
            <div className="relative h-6 md:h-8">
              {/* 바(배경) */}
              <div className="absolute inset-0 rounded-full bg-neutral-900/90" />
              {/* 채워진 부분 */}
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-[#8322BF]"
                style={{ width: `${clamped}%` }}
              />
              {/* 썸(손잡이) */}
              <div
                className="absolute top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[0_6px_18px_rgba(131,34,191,0.25)] ring-4 ring-[#8322BF] md:size-9"
                style={{ left: `calc(${clamped}% - 0.5rem)` }}
                aria-hidden
              />
            </div>

            {/* 툴팁 */}
            <div className="mt-3 inline-flex items-center rounded-full bg-neutral-400/60 px-3 py-1 text-sm text-neutral-900 md:px-4 md:py-1.5 md:text-base">
              온도 : {clamped}°C
            </div>
          </div>
        </div>

        {/* 오른쪽 버튼 */}
        <div className="hidden flex-col gap-5 self-start md:flex">
          <button
            onClick={onManageProfile}
            className="rounded-2xl bg-white/90 px-7 py-4 text-[20px] font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[1px]"
          >
            프로필 관리
          </button>
          <button
            onClick={onAuction}
            className="rounded-2xl bg-white/90 px-7 py-4 text-[20px] font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[1px]"
          >
            경매 하기
          </button>
        </div>
      </div>

      {/* 모바일 버튼 영역 */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:hidden">
        <button
          onClick={onManageProfile}
          className="rounded-2xl bg-white/90 px-4 py-3 font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[1px]"
        >
          프로필 관리
        </button>
        <button
          onClick={onAuction}
          className="rounded-2xl bg-white/90 px-4 py-3 font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-white active:translate-y-[1px]"
        >
          경매 하기
        </button>
      </div>
    </section>
  );
};

export default ProfilePreview;

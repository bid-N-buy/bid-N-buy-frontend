// src/features/mypage/components/profile/ProfileDetails.tsx
import React from "react";

export type Item = {
  id: string | number;
  title: string;
  thumbnail?: string;
};

type Props = {
  avatarUrl?: string | null;
  nickname: string;
  email?: string;
  temperature: number | null | undefined; // 0~100 가정, 없으면 null
  soldCount: number;
  sellingCount: number;
  soldPreview?: Item[];
  sellingPreview?: Item[];
  onClickSold?: () => void;
  onClickSelling?: () => void;
  onItemClick?: (id: string | number) => void;
};

// 안전하게 0~100 사이로 자르는 함수
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

// 아바타 없을 때 닉네임 이니셜 원형
function Initials({ name }: { name: string }) {
  const trimmed = (name || "").trim();
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[1][0] ?? "") : "";
  const initials = (first + second).toUpperCase() || "U";

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-4xl font-bold text-white">
      {initials}
    </div>
  );
}

// 거래 미리보기 리스트 (최대 3개)
const ItemRowList: React.FC<{
  items: Item[];
  emptyText: string;
  onItemClick?: (id: string | number) => void;
}> = ({ items, emptyText, onItemClick }) => {
  const list = (items ?? []).slice(0, 3);

  if (list.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
        {emptyText}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
      {list.map((it) => (
        <li
          key={it.id}
          className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-gray-50"
          role="button"
          tabIndex={0}
          onClick={() => onItemClick?.(it.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onItemClick?.(it.id);
            }
          }}
          aria-label={`${it.title} 상세로 이동`}
        >
          {/* 썸네일 */}
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-200 text-[10px] text-gray-400">
            {it.thumbnail ? (
              <img
                src={it.thumbnail}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                NO IMG
              </div>
            )}
          </div>

          {/* 타이틀 */}
          <p className="min-w-0 flex-1 truncate text-sm text-gray-800">
            {it.title}
          </p>

          {/* 화살표 아이콘 */}
          <svg
            className="h-4 w-4 shrink-0 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </li>
      ))}
    </ul>
  );
};

// 섹션 헤더
const SectionHeader: React.FC<{
  label: string;
  count: number;
  buttonText: string;
  disabled: boolean;
  onClick?: () => void;
}> = ({ label, count, buttonText, disabled, onClick }) => (
  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <h3 className="text-base font-semibold text-gray-900">
      {label}{" "}
      <span className="font-bold text-purple-600" aria-live="polite">
        {count}
      </span>
      <span className="text-gray-700"> 건</span>
    </h3>

    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="self-start rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition enabled:hover:bg-gray-50 enabled:hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
      aria-disabled={disabled}
    >
      {buttonText}
    </button>
  </div>
);

const ProfileDetails: React.FC<Props> = ({
  avatarUrl,
  nickname,
  email,
  temperature,
  soldCount,
  sellingCount,
  soldPreview = [],
  sellingPreview = [],
  onClickSold,
  onClickSelling,
  onItemClick,
}) => {
  // ✅ 온도 처리: 없으면 null
  const hasTemp =
    typeof temperature === "number" && Number.isFinite(temperature);

  const temp = hasTemp ? clamp(temperature as number, 0, 100) : null;
  const knobLeft = temp !== null ? `${temp}%` : "0%";

  // mock 데이터 (API 비어 있을 때만 표시)
  const MOCK_SOLD: Item[] = [
    { id: "ms1", title: "판매완료 샘플 1" },
    { id: "ms2", title: "판매완료 샘플 2" },
    { id: "ms3", title: "판매완료 샘플 3" },
  ];
  const MOCK_SELLING: Item[] = [
    { id: "mm1", title: "판매중 샘플 1" },
    { id: "mm2", title: "판매중 샘플 2" },
  ];

  const usingMockSold = soldPreview.length === 0;
  const usingMockSelling = sellingPreview.length === 0;

  const soldList = (usingMockSold ? MOCK_SOLD : soldPreview).slice(0, 3);
  const sellingList = (usingMockSelling ? MOCK_SELLING : sellingPreview).slice(
    0,
    3
  );

  const displaySoldCount =
    typeof soldCount === "number" && soldCount >= 0
      ? soldCount
      : soldList.length;

  const displaySellingCount =
    typeof sellingCount === "number" && sellingCount >= 0
      ? sellingCount
      : sellingList.length;

  return (
    <section className="mx-auto mb-[200px] min-h-[800px] w-[646px] max-w-full px-6 py-10 text-gray-900">
      {/* 프로필 헤더 */}
      <div className="mb-10 flex items-center gap-6">
        <div
          className="h-36 w-36 overflow-hidden rounded-full bg-gray-200 ring-1 ring-gray-300"
          aria-label={`${nickname}의 프로필 이미지`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Initials name={nickname} />
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <h2 className="truncate text-2xl font-semibold text-gray-800">
            {nickname || "사용자"}
          </h2>

          {email ? (
            <p className="mt-1 truncate text-sm text-gray-500">{email}</p>
          ) : null}

          {/* 매너 온도 게이지 */}
          <div className="mt-4 w-[350px] max-w-full">
            <div className="mb-1 flex items-center justify-between text-[11px] leading-none text-gray-700">
              <span className="font-medium text-gray-700">매너온도</span>

              {temp === null ? (
                <span className="font-normal text-gray-400">-</span>
              ) : (
                <span className="font-semibold text-purple-600">
                  {temp}
                  <span className="align-top text-[10px] font-normal text-purple-600">
                    ℃
                  </span>
                </span>
              )}
            </div>

            <div className="relative h-[10px] rounded-full bg-gray-900/90 shadow-[inset_0_0_4px_rgba(0,0,0,0.4)]">
              {temp !== null && (
                <>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-purple-500 transition-[width] duration-300"
                    style={{ width: `${temp}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-white bg-purple-500 shadow-[0_4px_12px_rgba(131,34,191,0.5)] ring-[2px] ring-purple-400/40"
                    style={{ left: knobLeft }}
                    aria-hidden="true"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 판매완료 섹션 */}
      <section className="mb-10">
        <SectionHeader
          label="판매완료된 거래"
          count={displaySoldCount}
          buttonText="판매완료물품 보러가기"
          disabled={displaySoldCount === 0}
          onClick={onClickSold}
        />

        <ItemRowList
          items={soldList}
          emptyText="판매완료 물품이 없습니다."
          onItemClick={(id) => onItemClick?.(id)}
        />

        {usingMockSold && (
          <p className="mt-2 text-xs text-gray-400">
            ※ 아직 실제 판매완료 데이터가 없어서 샘플을 보여주는 중이에요.
          </p>
        )}
      </section>

      {/* 판매중 섹션 */}
      <section>
        <SectionHeader
          label="판매 중인 물품"
          count={displaySellingCount}
          buttonText="판매물품 보러가기"
          disabled={displaySellingCount === 0}
          onClick={onClickSelling}
        />

        <ItemRowList
          items={sellingList}
          emptyText="판매 중인 물품이 없습니다."
          onItemClick={(id) => onItemClick?.(id)}
        />

        {usingMockSelling && (
          <p className="mt-2 text-xs text-gray-400">
            ※ 아직 실제 판매중 데이터가 없어서 샘플을 보여주는 중이에요.
          </p>
        )}
      </section>
    </section>
  );
};

export default ProfileDetails;

// src/features/mypage/components/profile/ProfileDetails.tsx
import React from "react";
import defaultAvatar from "../../../../assets/avatar.svg";

/* ---------------- Types ---------------- */
export type Item = {
  id: string | number;
  title: string;
  thumbnail?: string;
};

type Props = {
  avatarUrl?: string | null;
  nickname: string;
  email?: string;
  temperature: number | null | undefined;
  soldCount: number;
  sellingCount: number;
  soldPreview?: Item[];
  sellingPreview?: Item[];
  onClickSold?: () => void;
  onClickSelling?: () => void;
  onItemClick?: (id: string | number) => void;
  onClickStartAuction?: () => void;

  /** ✅ 데이터가 비었을 때 목업을 보여줄지 (기본: true) */
  useMockOnEmpty?: boolean;
  /** ✅ 섹션별 커스텀 목업 주입(선택). 미전달 시 기본 목업 사용 */
  mockSoldItems?: Item[];
  mockSellingItems?: Item[];
};

/* ---------------- Mock Data (기본 제공) ---------------- */
/** 외부 파일이 없어도 바로 보이게 picsum 이미지를 사용합니다. */
const MOCK_SOLD: Item[] = [
  {
    id: "m-sold-1",
    title: "애플 에어팟 프로 (2세대, 상태 A급)",
    thumbnail: "https://picsum.photos/seed/bnb-sold1/112/112",
  },
  {
    id: "m-sold-2",
    title: "닌텐도 스위치 OLED 화이트 세트",
    thumbnail: "https://picsum.photos/seed/bnb-sold2/112/112",
  },
  {
    id: "m-sold-3",
    title: "LEGO 아이콘 10327 Dune Atreides Royal Ornithopter",
    thumbnail: "https://picsum.photos/seed/bnb-sold3/112/112",
  },
];

const MOCK_SELLING: Item[] = [
  {
    id: "m-sell-1",
    title: "아이패드 프로 11형 M2 256GB",
    thumbnail: "https://picsum.photos/seed/bnb-sell1/112/112",
  },
  {
    id: "m-sell-2",
    title: "PS5 디스크 에디션 + 듀얼센스",
    thumbnail: "https://picsum.photos/seed/bnb-sell2/112/112",
  },
  {
    id: "m-sell-3",
    title: "Kindle Scribe 64GB 펜 포함",
    thumbnail: "https://picsum.photos/seed/bnb-sell3/112/112",
  },
];

/* ---------------- Utils ---------------- */
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/* ---------------- Small Components ---------------- */
// 프로필 이미지 없을 때 이니셜 (현재는 defaultAvatar 사용 중이라 미사용)
function Initials({ name }: { name: string }) {
  const trimmed = (name || "").trim();
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[1][0] ?? "") : "";
  const initials = (first + second).toUpperCase() || "U";
  return (
    <div className="from-purple flex h-full w-full items-center justify-center bg-gradient-to-br to-indigo-600 text-4xl font-bold text-white">
      {initials}
    </div>
  );
}

/** 공용 리스트 + 목업 처리 */
const ItemRowList: React.FC<{
  items: Item[];
  emptyText: string;
  onItemClick?: (id: string | number) => void;
  onClickStartAuction?: () => void; // 비었을 때 CTA
  /** ✅ 비었을 때 목업 보여주기 */
  useMockOnEmpty?: boolean;
  /** ✅ 이 섹션 전용 목업 (없으면 기본 목업) */
  mockItems?: Item[];
  /** 목업임을 표시할지(작은 뱃지) */
  showMockBadge?: boolean;
}> = ({
  items,
  emptyText,
  onItemClick,
  onClickStartAuction,
  useMockOnEmpty = true,
  mockItems,
  showMockBadge = true,
}) => {
  const base = (items ?? []).slice(0, 3);
  const shouldUseMock = useMockOnEmpty && base.length === 0;
  const mock = (mockItems ?? []).slice(0, 3);

  if (shouldUseMock && mock.length > 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-violet-200 bg-white">
        <div className="flex items-center justify-between border-b border-violet-200 bg-violet-50 px-3 py-2">
          <span className="text-xs text-gray-600">{emptyText}</span>
          {/* {showMockBadge && (
            <span className="rounded-full bg-violet-600/90 px-2 py-[2px] text-[10px] font-semibold text-white">
              MOCK
            </span>
          )} */}
        </div>
        <ul className="divide-y divide-gray-200">
          {mock.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-3 px-3 py-3"
              aria-label={`${it.title} (목업)`}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                {it.thumbnail ? (
                  <img
                    src={it.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm text-gray-800">
                {it.title}
              </p>
              {/* 목업은 클릭 막기 아이콘만 표시 */}
              <svg
                className="h-4 w-4 shrink-0 text-gray-300"
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
        {/* 비었을 때만 CTA 버튼 노출 */}
        {onClickStartAuction && (
          <div className="flex justify-center border-t border-gray-200 p-3">
            <button
              type="button"
              onClick={onClickStartAuction}
              className="bg-purple hover:bg-deep-purple rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md focus:outline-none"
            >
              경매 등록
            </button>
          </div>
        )}
      </div>
    );
  }

  // 실제 데이터가 있으면 기존 리스트
  if (base.length === 0) {
    // 목업 사용 안 할 때의 기존 빈 상태
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-10 text-sm text-gray-600">
        <span>{emptyText}</span>
        {onClickStartAuction && (
          <button
            type="button"
            onClick={onClickStartAuction}
            className="bg-purple hover:bg-deep-purple rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md focus:outline-none"
          >
            경매 등록
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
      {base.map((it) => (
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
          <p className="min-w-0 flex-1 truncate text-sm text-gray-800">
            {it.title}
          </p>
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

/** 섹션 헤더 */
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
      <span className="text-purple font-bold" aria-live="polite">
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

/* ---------------- Main ---------------- */
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
  onClickStartAuction,
  useMockOnEmpty = true,
  mockSoldItems,
  mockSellingItems,
}) => {
  // 매너온도
  const hasTemp =
    typeof temperature === "number" && Number.isFinite(temperature);
  const temp = hasTemp
    ? parseFloat(clamp(temperature as number, 0, 100).toFixed(1))
    : null;
  const knobLeft = temp !== null ? `${temp}%` : "0%";

  // 섹션 데이터
  const soldList = soldPreview.slice(0, 3);
  const sellingList = sellingPreview.slice(0, 3);

  // 카운트 표기
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
            <img
              src={defaultAvatar}
              alt="default avatar"
              className="h-full w-full object-cover p-2"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <h2 className="truncate text-2xl font-semibold text-gray-800">
            {nickname || "사용자"}
          </h2>

          {email ? (
            <p className="mt-1 truncate text-sm text-gray-500">{email}</p>
          ) : null}

          {/* 매너온도 */}
          <div className="mt-4 w-[350px] max-w-full">
            <div className="mb-1 flex items-center justify-between text-[11px] leading-none text-gray-700">
              <span className="font-medium text-gray-700">매너온도</span>
              {temp === null ? (
                <span className="font-normal text-gray-400">-</span>
              ) : (
                <span className="text-purple font-semibold">
                  {temp}
                  <span className="text-purple align-top text-[10px] font-normal">
                    ℃
                  </span>
                </span>
              )}
            </div>

            <div className="relative h-[10px] rounded-full bg-gray-900/90 shadow-[inset_0_0_4px_rgba(0,0,0,0.4)]">
              {temp !== null && (
                <>
                  <div
                    className="bg-purple absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
                    style={{ width: `${temp}%` }}
                  />
                  <div
                    className="bg-purple absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-white shadow-[0_4px_12px_rgba(131,34,191,0.5)]"
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
          useMockOnEmpty={useMockOnEmpty}
          mockItems={mockSoldItems ?? MOCK_SOLD}
          // 판매완료 섹션은 CTA 불필요
        />
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
          onClickStartAuction={onClickStartAuction}
          useMockOnEmpty={useMockOnEmpty}
          mockItems={mockSellingItems ?? MOCK_SELLING}
        />
      </section>
    </section>
  );
};

export default ProfileDetails;

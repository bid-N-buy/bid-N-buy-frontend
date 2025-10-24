import React from "react";

export type Item = {
  id: string | number;
  title: string;
  thumbnail?: string;
};

type Props = {
  avatarUrl?: string;
  nickname: string;
  email?: string;
  temperature: number; // 0~100
  soldCount: number;
  sellingCount: number;
  soldPreview?: Item[]; // 미리보기 최대 3개
  sellingPreview?: Item[]; // 미리보기 최대 3개
  onClickSold?: () => void; // "판매완료 보러가기" 버튼
  onClickSelling?: () => void; // "판매물품 보러가기" 버튼
  onItemClick?: (id: string | number) => void; // ✅ 행 클릭(상세 이동)
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function Initials({ name }: { name: string }) {
  const trimmed = (name || "").trim();
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[1][0] ?? "") : "";
  const initials = (first + second).toUpperCase();
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500 text-4xl font-bold text-white">
      {initials || "U"}
    </div>
  );
}

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
  const temp = clamp(Number.isFinite(temperature) ? temperature : 0, 0, 100);
  const knobLeft = `${temp}%`;

  // 목데이터(프리뷰)
  const MOCK_SOLD: Item[] = [
    { id: "ms1", title: "판매완료 샘플 1" },
    { id: "ms2", title: "판매완료 샘플 2" },
    { id: "ms3", title: "판매완료 샘플 3" },
  ];
  const MOCK_SELLING: Item[] = [
    { id: "mm1", title: "판매중 샘플 1" },
    { id: "mm2", title: "판매중 샘플 2" },
  ];

  const usingMockSold = (soldPreview?.length ?? 0) === 0;
  const usingMockSelling = (sellingPreview?.length ?? 0) === 0;

  const soldList = (usingMockSold ? MOCK_SOLD : soldPreview).slice(0, 3);
  const sellingList = (usingMockSelling ? MOCK_SELLING : sellingPreview).slice(
    0,
    3
  );

  const displaySoldCount =
    typeof soldCount === "number" && soldCount > 0
      ? soldCount
      : soldList.length;

  const displaySellingCount =
    typeof sellingCount === "number" && sellingCount > 0
      ? sellingCount
      : sellingList.length;

  return (
    <section className="mx-auto min-h-[calc(100vh-200px)] w-[646px] px-6 py-10 text-gray-900">
      {/* 타이틀 */}
      <h1 className="mb-10 text-center text-xl font-bold">프로필</h1>

      {/* 헤더 */}
      <div className="mb-10 flex items-center gap-6">
        <div
          className="h-36 w-36 overflow-hidden rounded-full bg-gray-300"
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
          <h2 className="truncate text-3xl font-semibold text-gray-800">
            {nickname}
          </h2>
          {email ? (
            <p className="mt-1 truncate text-sm text-gray-500">{email}</p>
          ) : null}
        </div>
      </div>

      {/* 온도 */}
      <div className="mb-10">
        <h6 className="mb-3 text-sm font-semibold text-gray-700">온도</h6>
        <div className="relative h-3 w-full rounded-full bg-gray-800/90">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-purple-500"
            style={{ width: `${temp}%` }}
          />
          <div
            className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-2 border-white bg-purple-500 shadow"
            style={{ left: knobLeft }}
            aria-label={`온도 ${temp}도`}
          />
          <div
            className="absolute top-6 -translate-x-1/2 rounded-md bg-gray-200 px-2 py-0.5 text-[11px] text-gray-700"
            style={{ left: knobLeft }}
          >
            {temp}℃
          </div>
        </div>
      </div>

      {/* 판매완료 섹션 (리스트 프리뷰) */}
      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between">
          <h3 className="text-base font-semibold">
            판매완료된 거래{" "}
            <span className="font-bold">{displaySoldCount}</span> 건
          </h3>
          <button
            type="button"
            onClick={onClickSold}
            disabled={displaySoldCount === 0}
            className="text-xs text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="판매완료 물품 보러가기"
          >
            판매완료물품 보러가기
          </button>
        </div>

        <ItemRowList
          items={soldList}
          emptyText="판매완료 물품이 없습니다."
          // ✅ 행 클릭 → 상세 이동 (컨테이너에서 /auctions/${id} 혹은 /mypage/sales/${id}로 라우팅)
          onItemClick={(id) => onItemClick?.(id)}
        />

        {usingMockSold && (
          <p className="mt-2 text-xs text-gray-400">
            ※ 데이터가 없어 샘플을 보여주고 있어요.
          </p>
        )}
      </section>

      {/* 판매중 섹션 (리스트 프리뷰) */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h3 className="text-base font-semibold">
            판매 물품 <span className="font-bold">{displaySellingCount}</span>{" "}
            개
          </h3>
          <button
            type="button"
            onClick={onClickSelling}
            disabled={displaySellingCount === 0}
            className="text-xs text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="판매 중인 물품 보러가기"
          >
            판매물품 보러가기
          </button>
        </div>

        <ItemRowList
          items={sellingList}
          emptyText="판매 중인 물품이 없습니다."
          // ✅ 행 클릭 → 상세 이동 (보통 /auctions/${id})
          onItemClick={(id) => onItemClick?.(id)}
        />

        {usingMockSelling && (
          <p className="mt-2 text-xs text-gray-400">
            ※ 데이터가 없어 샘플을 보여주고 있어요.
          </p>
        )}
      </section>
    </section>
  );
};

export default ProfileDetails;

/* =========================
 *   리스트 프리뷰 컴포넌트
 * ========================= */
const ItemRowList: React.FC<{
  items: Item[];
  emptyText: string;
  onItemClick?: (id: string | number) => void;
}> = ({ items, emptyText, onItemClick }) => {
  const list = (items ?? []).slice(0, 3);

  if (list.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
        {emptyText}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 rounded-xl bg-white">
      {list.map((it) => (
        <li
          key={it.id}
          className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-gray-50"
          role="button"
          tabIndex={0}
          onClick={() => onItemClick?.(it.id)}
          onKeyDown={(e) => e.key === "Enter" && onItemClick?.(it.id)}
        >
          {/* 썸네일 */}
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-200">
            {it.thumbnail ? (
              <img
                src={it.thumbnail}
                alt={it.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
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

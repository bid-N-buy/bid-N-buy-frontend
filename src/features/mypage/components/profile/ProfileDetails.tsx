// src/components/ProfileDetails.tsx
import React from "react";

type Item = {
  id: string | number;
  title: string;
  thumbnail?: string;
};

type Props = {
  avatarUrl?: string;
  nickname: string;
  temperature: number; // 0~100
  soldCount: number;
  sellingCount: number;
  soldPreview?: Item[]; // 미리보기 최대 3개
  sellingPreview?: Item[]; // 미리보기 최대 3개
  onClickSold?: () => void;
  onClickSelling?: () => void;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const ProfileDetails: React.FC<Props> = ({
  avatarUrl,
  nickname,
  temperature,
  soldCount,
  sellingCount,
  soldPreview = [],
  sellingPreview = [],
  onClickSold,
  onClickSelling,
}) => {
  const temp = clamp(temperature, 0, 100);
  const knobLeft = `${temp}%`;

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 text-gray-900">
      {/* 헤더: 아바타 + 닉네임 (가로 정렬) */}
      <div className="mb-12 flex items-center gap-8">
        <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-sky-500 bg-gray-600">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${nickname}의 프로필 이미지`}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <h2 className="text-3xl font-semibold text-gray-800">
          {nickname}nickName
        </h2>
      </div>

      {/* 온도 */}
      <div className="mb-12">
        <h6 className="mb-3 text-sm font-semibold text-gray-700">온도</h6>

        <div className="relative h-3 w-full rounded-full bg-gray-300">
          {/* 퍼플 채움 */}
          <div
            className="absolute top-0 left-0 h-3 rounded-full bg-purple-500"
            style={{ width: `${temp}%` }}
          />
          {/* 남은 부분 */}
          <div
            className="absolute top-0 right-0 h-3 rounded-full bg-gray-800/80"
            style={{ width: `${100 - temp}%` }}
          />
          {/* 노브 */}
          <div
            className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white bg-purple-500 shadow"
            style={{ left: knobLeft }}
            aria-label={`온도 ${temp}도`}
          />
          {/* 툴팁 */}
          <div
            className="absolute top-6 -translate-x-1/2 rounded-md bg-gray-200 px-2 py-0.5 text-xs text-gray-700"
            style={{ left: knobLeft }}
          >
            온도: {temp}℃
          </div>
        </div>
      </div>

      {/* 판매완료 섹션 */}
      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <h3 className="text-lg font-semibold">
            판매완료된 거래 <span className="font-bold">{soldCount}</span> 건
          </h3>
          <button
            type="button"
            onClick={onClickSold}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            판매물품 보러가기
          </button>
        </div>
        <ItemRow items={soldPreview} emptyText="판매완료 물품이 없습니다." />
      </section>

      {/* 판매중 섹션 */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h3 className="text-lg font-semibold">
            판매 물품 <span className="font-bold">{sellingCount}</span> 개
          </h3>
          <button
            type="button"
            onClick={onClickSelling}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            판매물품 보러가기
          </button>
        </div>
        <ItemRow
          items={sellingPreview}
          emptyText="판매 중인 물품이 없습니다."
        />
      </section>
    </section>
  );
};

export default ProfileDetails;

/** 미리보기 3개 그리드 */
const ItemRow: React.FC<{ items: Item[]; emptyText: string }> = ({
  items,
  emptyText,
}) => {
  const list = items.slice(0, 3);
  if (!list.length)
    return (
      <div className="flex h-24 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
        {emptyText}
      </div>
    );

  return (
    <ul className="grid grid-cols-3 gap-4">
      {list.map((it) => (
        <li
          key={it.id}
          className="rounded-xl border bg-white p-3 shadow-sm transition-shadow hover:shadow"
        >
          <div className="mb-2 aspect-square w-full overflow-hidden rounded-lg bg-gray-200">
            {it.thumbnail ? (
              <img
                src={it.thumbnail}
                alt={it.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <p className="line-clamp-2 text-sm text-gray-800">{it.title}</p>
        </li>
      ))}
    </ul>
  );
};

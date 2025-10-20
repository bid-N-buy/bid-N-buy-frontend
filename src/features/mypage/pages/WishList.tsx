// src/features/mypage/pages/WishList.tsx
import React, { useMemo, useState } from "react";
import { useWishlist } from "../hooks/useWishlist";
import WishRow from "../components/items/WishRow";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
// 상태+종료시간을 함께 판단하는 아이템 전용 헬퍼
import { isOngoing as isOngoingItem } from "../utils/tradeStatus";
import { MOCK_WISH } from "../mocks/tradeMocks";

const WishList: React.FC = () => {
  const [filter, setFilter] = useState<TriFilterValue>("all");
  const { data, loading, error } = useWishlist({
    page: 0,
    size: 20,
    useMock: true,
  });

  // 실데이터가 없으면 목업으로 대체
  const base = useMemo(() => (data?.length ? data : MOCK_WISH), [data]);

  // 진행/종료 카운트 (상태 + 종료시간 모두 반영)
  const counts = useMemo(() => {
    const all = base.length;
    const ongoing = base.filter((x) =>
      isOngoingItem({
        status: x.status,
        // wish 아이템에서 종료시각 키가 endAt 또는 auctionEnd일 수 있으니 둘 다 대응
        auctionEnd: (x as any).endAt ?? (x as any).auctionEnd,
      })
    ).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [base]);

  // 필터 적용
  const filtered = useMemo(() => {
    if (filter === "all") return base;

    const isOn = (x: any) =>
      isOngoingItem({
        status: x.status,
        auctionEnd: x.endAt ?? x.auctionEnd,
      });

    if (filter === "ongoing") return base.filter(isOn);
    return base.filter((x) => !isOn(x));
  }, [base, filter]);

  const handleToggleLike = (id: string) => {
    // TODO: 서버에 찜 해제 요청 후 목록 갱신
    // await api.delete(`/mypage/wishlist/${id}`);
    console.log("toggle like", id);
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-2xl font-bold">찜 목록</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-4"
      />

      {error && base.length === 0 ? (
        <p className="text-red-600">찜 목록을 불러오지 못했어요.</p>
      ) : loading && (data?.length ?? 0) === 0 ? (
        <p>불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p className="text-neutral-500">찜한 항목이 없습니다.</p>
      ) : (
        <ul>
          {filtered.map((it) => (
            <WishRow key={it.id} item={it} onToggleLike={handleToggleLike} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default WishList;

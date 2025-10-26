import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../features/auction/components/ProductCard";
import {
  fetchAuctions,
  type FetchAuctionsParams,
} from "../../features/auction/api/auctions";
import type {
  AuctionItem,
  AuctionsRes,
} from "../../features/auction/types/auctions";

type Props = {
  title?: string;
  size?: number; // 노출 개수
  params?: Omit<FetchAuctionsParams, "size" | "page">;
  moreLink?: string; // 이동 경로
};

const AuctionSection = ({
  title = "최신 경매 상품",
  size = 10,
  params,
  moreLink = "/auctions",
}: Props) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const query: FetchAuctionsParams = {
          sortBy: "latest",
          includeEnded: false,
          page: 0,
          size,
          ...(params ?? {}),
        };
        const data: AuctionsRes = await fetchAuctions(query);
        const list =
          (data as any).data ??
          (data as any).items ??
          (data as any).content ??
          [];
        setItems(list as AuctionItem[]);
      } catch (e: any) {
        setError(e?.message ?? "경매 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [size, params]);

  const onCardClick = (id: number) => navigate(`/auctions/${id}`);

  return (
    <section className="pb-[60px]">
      <div className="container">
        <div className="mb-8 flex items-center justify-between">
          <h4 className="text-g100 font-bold">{title}</h4>
          {moreLink && (
            <button
              onClick={() => navigate(moreLink)}
              className="text-g300 hover:text-purple text-h7 transition-colors"
            >
              전체보기
            </button>
          )}
        </div>

        {/* 로딩 */}
        {loading && (
          <div
            className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 md:gap-8 lg:grid-cols-5"
            aria-label="로딩 중"
          >
            {Array.from({ length: size }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-g500/60 aspect-square w-full rounded-3xl" />
                <div className="bg-g500/60 mt-3 h-4 w-3/4 rounded-3xl" />
                <div className="bg-g500/60 mt-2 h-5 w-1/2 rounded-3xl" />
              </div>
            ))}
          </div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="bg-g500 text-g300 flex min-h-[500px] w-full items-center justify-center rounded-3xl">
            {error}
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && !error && items.length === 0 && (
          <div className="bg-g500 text-g300 flex min-h-[500px] w-full items-center justify-center rounded-3xl">
            현재 진행 중이거나 진행 예정인 경매가 없습니다.
          </div>
        )}

        {/* 리스트 */}
        {!loading && !error && items.length > 0 && (
          <div
            className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 md:gap-8 lg:grid-cols-5"
            aria-label="경매 목록"
          >
            {items.map((it) => (
              <ProductCard
                key={it.auctionId}
                item={it}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AuctionSection;

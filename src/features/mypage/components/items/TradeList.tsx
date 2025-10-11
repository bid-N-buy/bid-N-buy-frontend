// import React from "react";
// import TradeRow from "./ItemCard";
// import type { TradeItem, TradeKind } from "../../types/trade";

// type Props = {
//   title: string; // "구매 내역" | "판매 내역"
//   kind: TradeKind; // 내부 로직 분기용(필요하면)
//   items: TradeItem[];
//   limit?: number; // 프리뷰 제한 (예: 3)
//   showMoreHref?: string; // 프리뷰에서 "더보기" 링크
//   loading?: boolean;
//   emptyText?: string;
//   onItemClick?: (id: string) => void;
//   renderRight?: (item: TradeItem) => React.ReactNode; // 우측 슬롯 커스터마이즈
// };

// export default function TradeList({
//   title,
//   kind,
//   items,
//   limit,
//   showMoreHref,
//   loading,
//   emptyText = "내역이 없습니다.",
//   onItemClick,
//   renderRight = (i) => i.status,
// }: Props) {
//   const sliced = typeof limit === "number" ? items.slice(0, limit) : items;

//   return (
//     <section className="w-full">
//       <header className="mb-4 flex items-center justify-between">
//         <h2 className="text-[22px] font-extrabold text-neutral-900">{title}</h2>
//         {limit && showMoreHref && (
//           <a
//             href={showMoreHref}
//             className="text-sm text-neutral-500 hover:text-neutral-700"
//           >
//             더보기 &gt;
//           </a>
//         )}
//       </header>

//       {loading ? (
//         <ul className="animate-pulse">
//           {Array.from({ length: limit ?? 3 }).map((_, i) => (
//             <li key={i} className="h-[110px] border-b border-neutral-200" />
//           ))}
//         </ul>
//       ) : sliced.length === 0 ? (
//         <div className="py-10 text-center text-neutral-500">{emptyText}</div>
//       ) : (
//         <ul>
//           {sliced.map((it) => (
//             <TradeRow
//               key={it.id}
//               item={it}
//               rightSlot={renderRight(it)}
//               onClick={onItemClick}
//             />
//           ))}
//         </ul>
//       )}
//     </section>
//   );
// }

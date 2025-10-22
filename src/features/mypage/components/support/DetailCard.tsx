// src/features/support/components/DetailCard.tsx
import React from "react";

type Props = {
  category: "문의" | "신고";
  title: string;
  content: string;
  status?: string;
  typeLabel?: string; // 문의만 표시 (GENERAL 등)
  createdAt?: string; // ISO
  extra?: React.ReactNode; // 신고의 requestTitle/Content 등
  onBack?: () => void;
};

function fmtDate(iso?: string) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    // 디자인에 맞춰 YY.MM.DD 포맷 (예: 25.10.22)
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase();
  const isWaiting = s.includes("WAIT");
  const isDone =
    s.includes("DONE") || s.includes("CLOSED") || s.includes("ANSWER");
  const cls = isWaiting ? "text-red" : isDone ? "text-green" : "text-g300";
  return <span className={`text-h6 font-semibold ${cls}`}>{s || "-"}</span>;
}

const DetailCard: React.FC<Props> = ({
  category,
  title,
  content,
  status,
  typeLabel,
  createdAt,
  extra,
  onBack,
}) => {
  return (
    <div className="mx-auto w-full max-w-[840px]">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-g300 hover:text-black"
        >
          ← 목록
        </button>
        <div className="text-g300 text-sm">{category}</div>
      </div>

      {/* 타이틀 줄 */}
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-h4 font-bold">{title}</h3>
        <div className="flex items-center gap-4">
          {typeLabel && (
            <span className="text-g300 text-sm">분류: {typeLabel}</span>
          )}
          <span className="text-g300 text-sm">작성일 {fmtDate(createdAt)}</span>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* 본문 */}
      <div className="mt-5 rounded-md border bg-white p-5 leading-7">
        <p className="whitespace-pre-line">{content}</p>
      </div>

      {/* 추가 섹션 (신고 전용 메타 등) */}
      {extra && (
        <div className="mt-5 rounded-md border bg-white p-5">{extra}</div>
      )}
    </div>
  );
};

export default DetailCard;

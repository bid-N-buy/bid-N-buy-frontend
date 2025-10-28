// src/features/support/components/DetailCard.tsx
import React from "react";

type Props = {
  category: "문의" | "신고";

  // 기본 문의 정보
  title: string;
  content: string;
  status?: string;
  typeLabel?: string; // 예: "GENERAL"
  createdAt?: string; // ISO
  onBack?: () => void;

  // 관리자 답변
  requestTitle?: string | null;
  requestContent?: string | null;

  // 추가로 넣고 싶은 UI (신고 전용 등)
  extra?: React.ReactNode;
};

function fmtDate(iso?: string) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  } catch {
    return iso;
  }
}

export const StatusBadge = ({ status }: { status?: string }) => {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full border border-neutral-300 px-2 py-[2px] text-[11px] font-medium text-neutral-500">
        -
      </span>
    );
  }

  const s = status.toUpperCase();

  const isWaiting =
    s.includes("WAIT") || s.includes("PENDING") || s.includes("IN PROGRESS");

  const isDone =
    s.includes("DONE") ||
    s.includes("CLOSED") ||
    s.includes("ANSWER") ||
    s.includes("COMPLETE") ||
    s.includes("RESOLVED");

  const clsWrap =
    "inline-flex items-center rounded-full border px-2 py-[2px] text-[11px] font-medium";
  let clsColor = "border-neutral-300 text-neutral-500 bg-neutral-50";

  if (isWaiting) {
    clsColor = "border-yellow-300 text-yellow-700 bg-yellow-50";
  } else if (isDone) {
    clsColor = "border-green-300 text-green-700 bg-green-50";
  }

  return <span className={`${clsWrap} ${clsColor}`}>{s}</span>;
};

const DetailCard: React.FC<Props> = ({
  category,
  title,
  content,
  status,
  typeLabel,
  createdAt,
  requestTitle,
  requestContent,
  extra,
  onBack,
}) => {
  const hasAnswer = !!(requestTitle || requestContent);

  return (
    <div className="mx-auto min-h-[800px] w-full max-w-[840px] font-sans text-[14px] leading-[1.5] text-neutral-900">
      {/* 상단 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-neutral-400 hover:text-neutral-900"
        >
          ← 목록
        </button>
        <div className="text-sm text-neutral-400">{category}</div>
      </div>

      {/* 제목 + 메타 */}
      <header className="border-b pb-4">
        <h3 className="text-[18px] font-bold text-neutral-900 sm:text-[20px] sm:leading-[1.4]">
          {title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-neutral-500 sm:text-[13px]">
          {typeLabel && (
            <span className="flex items-center gap-1">
              <span className="text-neutral-400">분류</span>
              <span className="font-medium text-neutral-700">{typeLabel}</span>
            </span>
          )}

          <span className="flex items-center gap-1">
            <span className="text-neutral-400">작성일</span>
            <span className="font-medium text-neutral-700">
              {fmtDate(createdAt)}
            </span>
          </span>

          <StatusBadge status={status} />
        </div>
      </header>

      {/* 내 문의(본문) */}
      <section className="mt-6 rounded-md border border-neutral-200 bg-white p-5">
        <div className="mb-2 text-[13px] font-semibold text-neutral-500">
          문의 내용
        </div>
        <p className="text-[14px] leading-7 whitespace-pre-line text-neutral-800">
          {content}
        </p>
      </section>

      {/* 관리자 답변 */}
      {hasAnswer && (
        <section className="mt-6 flex flex-col gap-3 rounded-md border border-purple-200 bg-purple-50 p-5 sm:flex-row sm:gap-4">
          {/* 왼쪽 사이드 라벨(데스크탑에서 시각적 구분) */}
          <div className="flex shrink-0 flex-col sm:w-[120px]">
            <span className="inline-block rounded-md bg-purple-600 px-2 py-[2px] text-center text-[11px] font-medium text-white">
              고객센터 답변
            </span>
            <span className="mt-2 hidden text-[12px] text-purple-600 sm:block">
              문의에 대한 답변이 등록되었어요
            </span>
          </div>

          {/* 실제 답변 내용 */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h4 className="text-[14px] font-semibold text-neutral-900 sm:text-[15px]">
                {requestTitle || "답변 내용"}
              </h4>

              <span className="inline-block shrink-0 self-start rounded-full border border-green-300 bg-green-50 px-2 py-[2px] text-[11px] font-medium text-green-700">
                답변 완료
              </span>
            </div>

            <div className="text-[14px] leading-6 whitespace-pre-line text-neutral-700">
              {requestContent || "내용이 없습니다."}
            </div>
          </div>
        </section>
      )}

      {/* 추가 블록 (신고 메타 등) */}
      {extra && (
        <section className="mt-6 rounded-md border border-neutral-200 bg-white p-5">
          {extra}
        </section>
      )}
    </div>
  );
};

export default DetailCard;

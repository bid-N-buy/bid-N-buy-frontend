import React from "react";

export type TriFilterValue = "all" | "ongoing" | "ended";

type Props = {
  value: TriFilterValue;
  onChange: (v: TriFilterValue) => void;
  /** 각 탭 카운트 (옵션) */
  counts?: { all?: number; ongoing?: number; ended?: number };
  className?: string;
};

export default function StatusTriFilter({
  value,
  onChange,
  counts,
  className = "",
}: Props) {
  const base =
    "flex-1 cursor-pointer rounded-lg py-3 text-center text-[15px] font-semibold transition";
  const active = `bg-[#8322BF] text-white`;
  const idle =
    "bg-white text-neutral-800 hover:bg-neutral-50 border border-neutral-200";

  const Tab = (v: TriFilterValue, label: string, count?: number) => (
    <button
      type="button"
      className={`${base} ${value === v ? active : idle}`}
      onClick={() => onChange(v)}
    >
      <div className="text-[20px] leading-none">
        {typeof count === "number" ? count : ""}
      </div>
      <div className="mt-1 text-[13px] opacity-80">{label}</div>
    </button>
  );

  return (
    <div className={`p-2 ${className}`}>
      <div className="grid grid-cols-3 gap-2">
        {Tab("all", "전체", counts?.all)}
        {Tab("ongoing", "진행 중", counts?.ongoing)}
        {Tab("ended", "종료", counts?.ended)}
      </div>
      <div className="mt-3 h-px w-full bg-neutral-200" />
    </div>
  );
}

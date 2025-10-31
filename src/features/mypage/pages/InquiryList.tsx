import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore, type AuthState } from "../../auth/store/authStore";

const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

/* ===========================
 *        API 타입
 * =========================== */
type InquiryApiItem = {
  inquiriesId: number;
  title: string;
  content: string;
  status: string; // WAITING, ANSWERED ...
  type?: string; // GENERAL, REPORT ...
  createdAt: string; // ISO
};

type ReportApiItem = {
  reportId?: number;
  id?: number;
  title?: string;
  content?: string;
  status?: string;
  type?: string; // REPORT, GENERAL ...
  createdAt?: string; // ISO
};

/* ===========================
 *        뷰 모델
 * =========================== */
type Row = {
  id?: number; // 네비게이션용 숫자 id (있을 때만)
  keyStr: string; // React key (고유 문자열)
  src: "inq" | "rep"; // 소스: 문의/신고
  typeLabel: "문의" | "신고";
  title: string;
  answered: boolean;
  createdAt: string; // 표시용 YY.MM.DD
  createdAtIso: string; // 정렬용 ISO
};

/* ===========================
 *        유틸
 * =========================== */
function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}
function mapTypeToLabel(
  apiType: string | undefined,
  fallback: "문의" | "신고"
): "문의" | "신고" {
  const t = (apiType ?? "").toUpperCase();
  if (t === "GENERAL") return "문의";
  if (t === "REPORT") return "신고";
  return fallback;
}
function isAnswered(status?: string) {
  const s = (status ?? "").toUpperCase();
  if (!s) return false;
  return s !== "WAITING";
}

/** ❗상세 경로: 소스별로 분기 */
const PATH = {
  inq: (id: number) => `/mypage/support/inquiries/${id}`,
  rep: (id: number) => `/mypage/support/reports/${id}`,
};
const getDetailPath = (row: Row) =>
  row.id ? PATH[row.src](row.id) : undefined;

/** 안정적 fallback key (랜덤 금지) */
function makeFallbackKey(prefix: string, title?: string, createdAt?: string) {
  return `${prefix}-${(title ?? "").trim()}|${(createdAt ?? "").trim()}`;
}

/* ===========================
 *        컴포넌트
 * =========================== */
const InquiryList: React.FC = () => {
  const accessToken = useAuthStore((s: AuthState) => s.accessToken);
  const navigate = useNavigate();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const headers = useMemo(
    () =>
      accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          }
        : undefined,
    [accessToken]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const [inqRes, repRes] = await Promise.allSettled([
          axios.get<{ data: { inquiries: InquiryApiItem[] } }>(
            `${BASE}/inquiries`,
            { headers }
          ),
          axios.get<{ data: { reports: ReportApiItem[] } }>(`${BASE}/reports`, {
            headers,
          }),
        ]);

        const inqRows: Row[] =
          inqRes.status === "fulfilled"
            ? (inqRes.value.data?.data?.inquiries ?? []).map((it) => ({
                id: it.inquiriesId,
                keyStr: `inq-${it.inquiriesId}`,
                src: "inq",
                typeLabel: mapTypeToLabel(it.type, "문의"),
                title: it.title,
                answered: isAnswered(it.status),
                createdAt: fmtDate(it.createdAt),
                createdAtIso: it.createdAt ?? "",
              }))
            : [];

        const repRows: Row[] =
          repRes.status === "fulfilled"
            ? (repRes.value.data?.data?.reports ?? []).map((it) => {
                const numId =
                  (it.reportId as number | undefined) ??
                  (it.id as number | undefined) ??
                  undefined;
                const keyStr =
                  typeof numId === "number"
                    ? `rep-${numId}`
                    : makeFallbackKey("rep", it.title, it.createdAt);
                const iso = it.createdAt ?? "";
                return {
                  id: numId,
                  keyStr,
                  src: "rep",
                  typeLabel: mapTypeToLabel(it.type, "신고"),
                  title: it.title ?? "(제목 없음)",
                  answered: isAnswered(it.status),
                  createdAt: fmtDate(iso),
                  createdAtIso: iso,
                };
              })
            : [];

        // 합치고 keyStr로 중복 제거
        const merged = [...inqRows, ...repRows];
        const dedup = Array.from(
          new Map(merged.map((r) => [r.keyStr, r])).values()
        );

        // ISO 기준 최신순 정렬
        dedup.sort((a, b) => {
          const ta = a.createdAtIso ? Date.parse(a.createdAtIso) : 0;
          const tb = b.createdAtIso ? Date.parse(b.createdAtIso) : 0;
          return tb - ta;
        });

        if (mounted) setRows(dedup);

        if (
          inqRes.status === "rejected" &&
          repRes.status === "rejected" &&
          mounted
        ) {
          setErr("목록을 불러오지 못했습니다.");
        }
      } catch (e: any) {
        if (mounted) {
          setErr(
            e?.response?.data?.message ||
              e?.message ||
              "목록을 불러오지 못했습니다."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [headers]);

  return (
    <div className="mx-auto w-full max-w-[840px] px-4">
      {/* 헤더 */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">1:1 문의 / 신고</h2>

        <Link
          to="/mypage/support/inquiries/new"
          className="rounded-md bg-[#8322BF] px-3 py-2 text-sm font-medium text-white hover:brightness-105 active:translate-y-[1px]"
        >
          문의/신고
        </Link>
      </div>

      {/* 상태/에러 */}
      {err && (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {err}
        </div>
      )}
      <div className="mb-3 text-sm text-neutral-500">
        {loading ? "불러오는 중…" : `총 ${rows.length}건`}
      </div>

      {/* 모바일 카드 */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.length === 0 && !loading ? (
          <li className="rounded-lg border border-neutral-200 bg-white py-10 text-center text-neutral-500">
            등록된 문의/신고가 없습니다.
          </li>
        ) : (
          rows.map((it) => {
            const to = getDetailPath(it);
            return (
              <li key={it.keyStr}>
                <button
                  type="button"
                  onClick={() => to && navigate(to)}
                  disabled={!to}
                  className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:bg-neutral-50 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
                      {it.typeLabel}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        it.answered
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {it.answered ? "답변완료" : "대기"}
                    </span>
                    <span className="ml-auto text-xs text-neutral-500">
                      {it.createdAt}
                    </span>
                  </div>
                  <div className="line-clamp-2 text-sm font-medium text-neutral-900">
                    {it.title}
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {/* 데스크탑 테이블 */}
      <div className="hidden md:block">
        <table className="w-full table-fixed border-separate border-spacing-0">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "56%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>

          <thead>
            <tr>
              {["분류", "제목", "답변 여부", "작성일"].map((th) => (
                <th
                  key={th}
                  className="border-b border-neutral-200 py-3 text-center text-sm font-semibold text-neutral-700"
                >
                  {th}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-sm">
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-neutral-500">
                  등록된 문의/신고가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((it) => {
                const to = getDetailPath(it);
                return (
                  <tr
                    key={it.keyStr}
                    className={`border-b border-neutral-100 ${
                      to ? "cursor-pointer hover:bg-neutral-50" : "opacity-70"
                    }`}
                    onClick={() => to && navigate(to)}
                    role={to ? "button" : undefined}
                    tabIndex={to ? 0 : -1}
                    onKeyDown={(e) => to && e.key === "Enter" && navigate(to)}
                  >
                    <td className="py-4 text-center align-middle text-neutral-900">
                      {it.typeLabel}
                    </td>
                    <td className="px-2 py-4 align-middle">
                      <div className="mx-auto max-w-[560px]">
                        {to ? (
                          <Link
                            to={to}
                            className="block truncate text-center text-neutral-900 hover:underline"
                            title={it.title}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {it.title}
                          </Link>
                        ) : (
                          <span className="block truncate text-center text-neutral-400">
                            {it.title}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-center align-middle font-semibold">
                      <span
                        className={
                          it.answered ? "text-green-600" : "text-red-600"
                        }
                      >
                        {it.answered ? "Y" : "N"}
                      </span>
                    </td>
                    <td className="py-4 text-center align-middle text-neutral-500">
                      {it.createdAt}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="h-12 md:h-16" />
    </div>
  );
};

export default InquiryList;

// src/features/mypage/pages/InquiryList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore, type AuthState } from "../../auth/store/authStore";

/** 서버 기본 주소 */
const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

/* ===========================
 *        API 타입
 * =========================== */
type InquiryApiItem = {
  inquiriesId: number;
  title: string;
  content: string;
  status: string; // WAITING, ANSWERED ...
  type?: string; // GENERAL, (혹시 REPORT 등)
  createdAt: string; // ISO
};

type ReportApiItem = {
  reportId?: number;
  id?: number;
  title?: string;
  content?: string;
  status?: string; // WAITING, ANSWERED ...
  type?: string; // REPORT, GENERAL 등 (혹시 서버에서 내려줄 수도)
  createdAt?: string; // ISO
};

type Row = {
  id: number;
  typeLabel: "문의" | "신고";
  title: string;
  answered: boolean;
  createdAt: string; // YY.MM.DD 포맷
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

/** 서버의 type → UI 라벨 매핑 */
function mapTypeToLabel(
  apiType: string | undefined,
  fallback: "문의" | "신고"
): "문의" | "신고" {
  const t = (apiType ?? "").toUpperCase();
  if (t === "GENERAL") return "문의";
  if (t === "REPORT") return "신고";
  return fallback;
}

/** 상태 → 답변 여부 */
function isAnswered(status?: string) {
  const s = (status ?? "").toUpperCase();
  if (!s) return false;
  return s !== "WAITING";
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

  // 통합 상세 페이지 경로
  const getDetailPath = (row: Row) => `/mypage/support/${row.id}`;

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        // 두 요청 병렬. 하나 실패해도 다른 하나는 살림.
        const [inqRes, repRes] = await Promise.allSettled([
          axios.get<{ data: { inquiries: InquiryApiItem[] } }>(
            `${BASE}/inquiries`,
            { headers }
          ),
          axios.get<{ data: { reports: ReportApiItem[] } }>(`${BASE}/reports`, {
            headers,
          }),
        ]);

        // 문의 → "문의" 기본, 서버 type 있으면 매핑 우선
        const inqRows: Row[] =
          inqRes.status === "fulfilled"
            ? (inqRes.value.data?.data?.inquiries ?? []).map((it) => ({
                id: it.inquiriesId,
                typeLabel: mapTypeToLabel(it.type, "문의"),
                title: it.title,
                answered: isAnswered(it.status),
                createdAt: fmtDate(it.createdAt),
              }))
            : [];

        // 신고 → "신고" 기본, 서버 type 있으면 매핑 우선
        const repRows: Row[] =
          repRes.status === "fulfilled"
            ? (repRes.value.data?.data?.reports ?? []).map((it) => {
                const id =
                  (it.reportId as number) ??
                  (it.id as number) ??
                  Math.floor(Math.random() * 1e9); // 안전장치
                return {
                  id,
                  typeLabel: mapTypeToLabel(it.type, "신고"),
                  title: it.title ?? "(제목 없음)",
                  answered: isAnswered(it.status),
                  createdAt: fmtDate(it.createdAt),
                };
              })
            : [];

        // 최신순 정렬 (createdAt 없는 항목은 뒤로)
        const merged = [...inqRows, ...repRows].sort((a, b) => {
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          const toDate = (s: string) => {
            const [yy, mm, dd] = s.split(".").map((v) => parseInt(v, 10));
            return new Date(2000 + yy, (mm ?? 1) - 1, dd ?? 1).getTime();
          };
          return toDate(b.createdAt) - toDate(a.createdAt);
        });

        if (mounted) setRows(merged);

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
    <div className="mx-auto min-h-[700px] w-[788px] max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">1:1 문의 / 신고</h2>

        <Link
          to="/mypage/support/inquiries/new"
          className="bg-purple hover:bg-deep-purple rounded-md px-4 py-2 font-medium text-white transition-colors"
        >
          문의/신고
        </Link>
      </div>

      {err && (
        <div className="bg-red/10 text-red mb-3 rounded-md px-3 py-2 text-sm">
          {err}
        </div>
      )}

      <div className="text-g200 mb-2 text-sm">
        {loading ? "불러오는 중…" : `총 ${rows.length}건`}
      </div>

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
                className="text-g200 border-g400 border-b py-3 text-center text-sm font-semibold"
              >
                {th}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="text-g100 text-sm">
          {rows.length === 0 && !loading ? (
            <tr>
              <td colSpan={4} className="text-g200 py-10 text-center">
                등록된 문의/신고가 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((it) => {
              const to = getDetailPath(it);
              return (
                <tr
                  key={`${it.typeLabel}-${it.id}`}
                  className="group border-g400 hover:bg-g500/50 cursor-pointer border-b"
                  onClick={() => navigate(to)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate(to)}
                >
                  <td className="py-4 text-center align-middle">
                    {it.typeLabel}
                  </td>
                  <td className="px-2 py-4 align-middle">
                    <div className="mx-auto max-w-[560px]">
                      <Link
                        to={`/mypage/support/inquiries/${it.id}`}
                        className="block truncate text-center group-hover:underline"
                        title={it.title}
                        onClick={(e) => e.stopPropagation()} // tr onClick과 중복 방지
                      >
                        {it.title}
                      </Link>
                    </div>
                  </td>
                  <td className="py-4 text-center align-middle font-semibold">
                    <span className={it.answered ? "text-green" : "text-red"}>
                      {it.answered ? "Y" : "N"}
                    </span>
                  </td>
                  <td className="text-g200 py-4 text-center align-middle">
                    {it.createdAt}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InquiryList;

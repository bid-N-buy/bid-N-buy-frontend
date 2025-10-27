// src/features/support/components/InquiryReportForm.tsx
import React, { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore, type AuthState } from "../../../auth/store/authStore";
import Toast from "../../../../shared/components/Toast";

type Mode = "inquiry" | "report";

type InquiryResp = {
  data: {
    inquiriesId: number;
    title: string;
    content: string;
    status: string;
    type: string;
    createdAt: string;
  };
  message: string;
};

type ReportResp = { success: boolean; message: string; data?: unknown };

const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

const modeToPath = (m: Mode) =>
  m === "inquiry"
    ? "/mypage/support/inquiries/new"
    : "/mypage/support/reports/new";

const pathToMode = (p: string): Mode =>
  p.includes("/reports") ? "report" : "inquiry";

const InquiryReportForm: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const accessToken = useAuthStore((s: AuthState) => s.accessToken);

  const mode: Mode = useMemo(() => pathToMode(pathname), [pathname]);

  const [form, setForm] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);

  // toast state
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const toast = (ok: string | null, error: string | null, ms = 2200) => {
    setMsg(ok);
    setErr(error);
    window.setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, ms);
  };

  const switchTab = (next: Mode) => {
    if (next === mode) return;
    setForm({ title: "", content: "" });
    navigate(modeToPath(next), { replace: false });
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = (): string | null => {
    if (!accessToken) return "로그인이 필요합니다.";
    if (!form.title.trim()) return "제목을 입력해 주세요.";
    if (!form.content.trim()) return "내용을 입력해 주세요.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) return toast(null, v);

    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
      };

      if (mode === "inquiry") {
        const { data } = await axios.post<InquiryResp>(
          `${BASE}/inquiries`,
          payload,
          { headers }
        );
        toast(data?.message ?? "문의가 등록되었습니다.", null);
      } else {
        const { data } = await axios.post<ReportResp>(
          `${BASE}/reports`,
          payload,
          { headers }
        );
        toast(data?.message ?? "신고가 접수되었습니다.", null);
      }

      setForm({ title: "", content: "" });
    } catch (e: any) {
      const m =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "요청 처리 중 오류가 발생했습니다.";
      toast(null, m, 2800);
    } finally {
      setLoading(false);
    }
  };

  const isInquiry = mode === "inquiry";

  return (
    <>
      {/* 토스트 */}
      {msg && (
        <Toast
          message={msg}
          type="success"
          onClose={() => setMsg(null)}
          duration={2200}
        />
      )}
      {err && (
        <Toast
          message={err}
          type="error"
          onClose={() => setErr(null)}
          duration={2800}
        />
      )}

      <div className="mx-auto w-[788px] max-w-4xl p-4">
        {/* 헤더 / 탭 */}
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-bold text-neutral-900">
            1:1 문의 / 신고
          </h2>

          <div className="flex gap-2 border-b border-neutral-300">
            <button
              type="button"
              onClick={() => switchTab("inquiry")}
              className={[
                "px-4 py-2 text-sm font-medium transition-colors",
                isInquiry
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-neutral-400 hover:text-neutral-700",
              ].join(" ")}
            >
              문의 작성
            </button>
            <button
              type="button"
              onClick={() => switchTab("report")}
              className={[
                "px-4 py-2 text-sm font-medium transition-colors",
                !isInquiry
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-neutral-400 hover:text-neutral-700",
              ].join(" ")}
            >
              신고 접수
            </button>
          </div>
        </div>

        {/* 폼 카드 */}
        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
        >
          {/* 안내 영역 */}
          <div className="mb-5 rounded-md bg-neutral-50 p-4 text-[13px] leading-5 text-neutral-600">
            {isInquiry ? (
              <>
                <div className="font-semibold text-neutral-800">
                  문의 내용 안내
                </div>
                <div className="mt-1">
                  서비스 이용 중 궁금하신 점을 자세히 적어주시면 빠르게
                  도와드릴게요.
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-neutral-800">
                  신고 접수 안내
                </div>
                <div className="mt-1">
                  사기 의심 / 부적절한 이용 사례 등 신고 사유를 구체적으로
                  작성해 주세요.
                </div>
              </>
            )}
          </div>

          {/* 제목 */}
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium text-neutral-800">
              제목<span className="text-purple-600">*</span>
            </span>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
              disabled={loading}
            />
            <div className="mt-1 text-right text-[12px] text-neutral-400">
              {form.title.length}/100
            </div>
          </label>

          {/* 내용 */}
          <label className="mb-6 block">
            <span className="mb-1 block text-sm font-medium text-neutral-800">
              {isInquiry ? "문의 내용" : "신고 내용"}
              <span className="text-purple-600">*</span>
            </span>
            <textarea
              name="content"
              value={form.content}
              onChange={onChange}
              placeholder={
                isInquiry
                  ? "문의하실 내용을 입력하세요."
                  : "신고 사유 및 상세 내용을 입력하세요."
              }
              rows={8}
              className="w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-[14px] leading-6 text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
              disabled={loading}
            />
            <div className="mt-1 text-right text-[12px] text-neutral-400">
              최소 10자 이상 입력해 주세요.
            </div>
          </label>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setForm({ title: "", content: "" })}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
              disabled={loading}
            >
              초기화
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-300 focus:outline-none disabled:opacity-60"
            >
              {loading ? "전송 중..." : isInquiry ? "문의 등록" : "신고 접수"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default InquiryReportForm;

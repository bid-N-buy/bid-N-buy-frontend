// src/features/support/components/InquiryReportForm.tsx
import React, { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore, type AuthState } from "../../../auth/store/authStore";

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

type ReportResp = {
  success: boolean;
  message: string;
  data?: unknown;
};

const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

/** ✅ App 라우팅에 맞춘 절대 경로 */
const modeToPath = (m: Mode) =>
  m === "inquiry"
    ? "/mypage/support/inquiries/new"
    : "/mypage/support/reports/new";

const pathToMode = (p: string): Mode =>
  p.includes("/reports") ? "report" : "inquiry";

/** ✅ 폼 상태: 주문번호 제거, 공통으로 title/content 사용 */
type FormState = {
  title: string;
  content: string;
};

const initialState: FormState = {
  title: "",
  content: "",
};

const InquiryReportForm: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const accessToken = useAuthStore((s: AuthState) => s.accessToken);

  const mode: Mode = useMemo(() => pathToMode(pathname), [pathname]);

  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const switchTab = (next: Mode) => {
    if (next === mode) return;
    setForm(initialState);
    setMsg(null);
    setErr(null);
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
    setMsg(null);
    setErr(null);

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };

      if (mode === "inquiry") {
        const payload = {
          title: form.title.trim(),
          content: form.content.trim(),
        };
        const { data } = await axios.post<InquiryResp>(
          `${BASE}/inquiries`,
          payload,
          { headers }
        );
        setMsg(data?.message ?? "문의가 등록되었습니다.");
        // 필요 시 상세 페이지로 이동:
        // navigate(`/mypage/support/inquiries/${data.data?.inquiriesId}`);
      } else {
        // ✅ 신고도 제목과 내용만 전송
        const payload = {
          title: form.title.trim(),
          content: form.content.trim(),
        };
        const { data } = await axios.post<ReportResp>(
          `${BASE}/reports`,
          payload,
          { headers }
        );
        setMsg(data?.message ?? "신고가 접수되었습니다.");
        // 필요 시 목록으로 이동:
        // navigate("/mypage/support");
      }

      setForm(initialState);
    } catch (e: any) {
      const m =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "요청 처리 중 오류가 발생했습니다.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-[788px] max-w-4xl p-4">
      <div className="mb-6">
        <h2 className="mb-4 font-bold">1:1 문의 / 신고</h2>

        <div className="border-g400 flex gap-2 border-b">
          <button
            type="button"
            onClick={() => switchTab("inquiry")}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              mode === "inquiry"
                ? "border-purple text-purple border-b-2"
                : "text-g200 hover:text-g100",
            ].join(" ")}
          >
            문의 작성
          </button>
          <button
            type="button"
            onClick={() => switchTab("report")}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              mode === "report"
                ? "border-purple text-purple border-b-2"
                : "text-g200 hover:text-g100",
            ].join(" ")}
          >
            신고 접수
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-g200 mb-1 block text-sm">제목</span>
          <div className="field">
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="제목을 입력하세요"
              className="field-input"
              maxLength={100}
            />
          </div>
        </label>

        <label className="block">
          <span className="text-g200 mb-1 block text-sm">내용</span>
          <div className="field">
            <textarea
              name="content"
              value={form.content}
              onChange={onChange}
              placeholder={
                mode === "inquiry"
                  ? "문의하실 내용을 입력하세요."
                  : "신고 사유 및 상세 내용을 입력하세요."
              }
              rows={8}
              className="field-input resize-y"
            />
          </div>
        </label>

        {err && (
          <div className="bg-red/10 text-red rounded-md px-3 py-2 text-sm">
            {err}
          </div>
        )}
        {msg && (
          <div className="bg-green/10 text-green rounded-md px-3 py-2 text-sm">
            {msg}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setForm(initialState)}
            className="border-g400 text-g200 hover:bg-g500/50 rounded-md border px-4 py-2"
            disabled={loading}
          >
            초기화
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-purple hover:bg-deep-purple rounded-md px-4 py-2 font-medium text-white transition-colors disabled:opacity-60"
          >
            {loading
              ? "전송 중..."
              : mode === "inquiry"
                ? "문의 등록"
                : "신고 접수"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InquiryReportForm;

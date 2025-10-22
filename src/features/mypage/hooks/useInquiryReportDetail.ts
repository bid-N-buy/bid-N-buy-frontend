// src/features/support/hooks/useInquiryReportDetail.ts
import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";

type ApiErr = { message?: string; error?: string };

// 서버에서 내려오는 원본 형태(케이스별로 다를 수 있어 optional 처리)
type RawSupport =
  | {
      inquiriesId?: number; // 신규 통합 테이블 id
      reportId?: number; // 과거 신고 테이블 id(잔재 호환)
      id?: number; // 혹시 id로만 올 수도 있음
      title: string;
      content: string;
      status: "WAITING" | "DONE" | string;
      type?: "GENERAL" | "ACCOUNT" | "ETC" | "REPORT" | string; // 통합 type
      createdAt: string;
      requestTitle?: string | null;
      requestContent?: string | null;
    }
  | Record<string, any>;

// 정규화된 상세 타입(프론트가 사용할 단일 형태)
export type SupportDetail = {
  /** 항상 채워지는 단일 ID */
  id: number;
  /** 서버 원본 id들(디버그/호환용) */
  inquiriesId?: number;
  reportId?: number;

  title: string;
  content: string;
  status: "WAITING" | "DONE" | string;
  /** GENERAL/ACCOUNT/ETC/REPORT 등 */
  type: string;
  createdAt: string;

  /** 신고(혹은 확장 케이스)에서만 존재할 수 있는 추가 필드 */
  requestTitle?: string | null;
  requestContent?: string | null;

  /** 편의 플래그 */
  isReport: boolean;
};

// 원본 → 정규화
function normalizeSupport(raw?: RawSupport | null): SupportDetail | null {
  if (!raw) return null;

  // 가능한 id 후보 중 우선순위로 단일 id 생성
  const id =
    Number(raw.inquiriesId ?? raw.reportId ?? raw.id ?? NaN) || undefined;

  if (!id) return null;

  // 타입 추론: 서버가 type을 주면 사용, 없으면 request 필드 존재 시 REPORT로 추론
  const inferredType =
    (raw.type as string) ??
    (raw.requestTitle != null || raw.requestContent != null
      ? "REPORT"
      : "GENERAL");

  return {
    id,
    inquiriesId: raw.inquiriesId,
    reportId: raw.reportId,
    title: String(raw.title ?? ""),
    content: String(raw.content ?? ""),
    status: (raw.status as any) ?? "",
    type: inferredType,
    createdAt: String(raw.createdAt ?? ""),
    requestTitle: (raw as any).requestTitle ?? null,
    requestContent: (raw as any).requestContent ?? null,
    isReport: inferredType.toUpperCase() === "REPORT",
  };
}

/**
 * 통합 상세 훅
 * - 이제 문의/신고 모두 /inquiries/:id 로 조회된다는 전제
 * - 서버 응답은 { data: {...} } 형태라고 가정
 */
export function useSupportDetail(id?: string | number) {
  const [data, setData] = useState<SupportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancel = false;

    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);

        const res = await api.get<{ data: RawSupport }>(`/inquiries/${id}`);
        const normalized = normalizeSupport(res?.data?.data);

        if (!cancel) setData(normalized);
        if (!cancel && !normalized)
          setErrMsg("데이터 형식이 올바르지 않습니다.");
      } catch (e: any) {
        const axiosMsg: string =
          e?.response?.data?.message ?? e?.response?.data?.error ?? "조회 실패";
        if (!cancel) setErrMsg(axiosMsg);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [id]);

  return { data, loading, errMsg };
}

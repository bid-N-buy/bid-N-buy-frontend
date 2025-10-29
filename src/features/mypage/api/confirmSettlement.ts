// src/features/mypage/api/confirmSettlement.ts
import api from "../../../shared/api/axiosInstance";

/**
 * 구매 확정(정산 완료) 요청
 *
 * POST /settlements/{orderId}/confirm
 *   - PathParam: orderId
 *   - Header: Authorization: Bearer <JWT> (axiosInstance가 자동으로 붙임)
 *
 * 서버 응답 예시들:
 *   { "정산 완료 처리되었습니다.": null }
 *   { message: "정산 완료 처리되었습니다." }
 *   "정산 완료 처리되었습니다."
 *   204 No Content
 *
 * 항상 string을 resolve하도록 맞춘다.
 * 실패하면 throw Error(...) 로 올려보낸다.
 */
export async function confirmSettlement(
  orderId: number | string
): Promise<string> {
  try {
    const res = await api.post(
      `/settlements/${orderId}/confirm`,
      {}, // 일부 서버는 빈 body를 싫어함 → 안전하게 {}
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (import.meta.env.DEV) {
      console.debug("[confirmSettlement] raw response:", res.status, res.data);
    }

    const data = res?.data;

    // 0) 완전 빈 응답 / 204
    if (data === undefined || data === null || data === "") {
      return "구매 확정이 완료되었습니다.";
    }

    // 1) 응답이 그냥 문자열
    if (typeof data === "string") {
      return data;
    }

    // 2) { message: "..." } 형태
    if (data && typeof data.message === "string") {
      return data.message;
    }

    // 3) { "정산 완료 처리되었습니다.": ??? } 같은 형태
    if (data && typeof data === "object") {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        const firstKey = keys[0];
        if (typeof firstKey === "string" && firstKey.trim() !== "") {
          return firstKey;
        }
        const firstVal = (data as any)[firstKey];
        if (typeof firstVal === "string" && firstVal.trim() !== "") {
          return firstVal;
        }
      }
    }

    // fallback
    return "구매 확정이 완료되었습니다.";
  } catch (err: any) {
    // 서버에서 내려준 메시지 추출 (가능하면 그대로 띄워주기)
    const serverMsg =
      err?.response?.data?.message ||
      (typeof err?.response?.data === "string" ? err.response.data : undefined);

    throw new Error(serverMsg || "구매 확정 요청 중 오류가 발생했습니다.");
  }
}

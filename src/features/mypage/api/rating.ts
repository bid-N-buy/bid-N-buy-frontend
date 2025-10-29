// src/features/mypage/api/rating.ts
import api from "../../../shared/api/axiosInstance";

/**
 * 구매자가 판매자에게 별점을 매기는 API
 * POST /orders/{orderId}/rating
 * body: { rating: number }
 * response: string ("별점이 등록되었습니다.")
 */
export async function submitRating(
  orderId: number | string,
  rating: number
): Promise<string> {
  try {
    const res = await api.post(
      `/orders/${orderId}/rating`,
      { rating },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (import.meta.env.DEV) {
      console.debug("[submitRating] raw response:", res.status, res.data);
    }

    const data = res?.data;

    // 1️⃣ 응답이 그냥 문자열일 때
    if (typeof data === "string") return data;

    // 2️⃣ { message: "..." } 형태일 때
    if (data?.message && typeof data.message === "string") {
      return data.message;
    }

    // 3️⃣ { "별점이 등록되었습니다.": null } 같은 변형 구조 대응
    if (data && typeof data === "object") {
      const firstVal = Object.values(data)[0];
      if (typeof firstVal === "string" && firstVal.trim() !== "") {
        return firstVal;
      }
      const firstKey = Object.keys(data)[0];
      if (typeof firstKey === "string" && firstKey.trim() !== "") {
        return firstKey;
      }
    }

    // 4️⃣ fallback (빈 응답)
    return "별점이 등록되었습니다.";
  } catch (err: any) {
    const serverMsg =
      err?.response?.data?.message ||
      (typeof err?.response?.data === "string" ? err.response.data : undefined);

    throw new Error(serverMsg || "별점 등록 중 오류가 발생했습니다.");
  }
}

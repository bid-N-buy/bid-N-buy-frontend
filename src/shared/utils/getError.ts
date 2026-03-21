import axios from "axios";
import { useToastStore } from "../store/useToastStore";

// 에러 문구 추출
export const getError = (
  error: unknown,
  fallback = "문제가 발생했습니다. 다시 시도해 주세요." // 기본 에러 문구
) => {
  // axios 에러일 경우
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message
    );
  }
  // 런타임 에러일 경우
  if (error instanceof Error) return error.message;
  // 에러가 객체일 경우
  if (error && typeof error === "object" && "message" in error) {
    return (error as Record<string, any>).message;
  }
  // 에러가 스트링일 경우
  if (typeof error === "string") return error;

  return fallback;
};

// 에러 문구 토스트로 전달
export const handleError = (error: unknown, fallback?: string) => {
  const { showToast } = useToastStore.getState();
  showToast(getError(error, fallback), "error");
};

// 유저가 자의로 취소한 경우 확인
export const isCanceledError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.name === "CanceledError" ||
      error.name === "AbortError" ||
      (error as any)?.code === "ERR_CANCELED"
    );
  }
  return false;
};

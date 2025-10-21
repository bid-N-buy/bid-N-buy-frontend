import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../../shared/api/axiosInstance";
import useToast from "../../../shared/hooks/useToast";

export default function PaymentBridge() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const code = searchParams.get("code"); // ❌ 실패 시 넘어옴
    const message = searchParams.get("message"); // ❌ 실패 메시지

    if (code) {
      showToast(message || "결제 실패", "error");
      console.log("잘못된 요청 : " + message);
      window.history.back(); // 이전 페이지로 이동
      return;
    }

    if (!paymentKey || !orderId || !amount) {
      showToast("잘못된 요청입니다.", "error");
      alert("잘못된 요청입니다.");
      window.history.back(); // 이전 페이지로 이동
      return;
    }

    // confirm 호출
    api
      .post("/payments/confirm", {
        paymentKey,
        orderId,
        amount: Number(amount),
      })
      .then(() => {
        console.log("결제 성공");
        showToast("결제 성공!", "success");
        window.history.back(); // 이전 페이지로 이동
      })
      .catch(() => {
        console.log("결제 fail");
        showToast("승인 실패", "error");
        window.history.back(); // 이전 페이지로 이동
      });
  }, [searchParams, showToast]);

  return <div>결제 처리 중...</div>;
}

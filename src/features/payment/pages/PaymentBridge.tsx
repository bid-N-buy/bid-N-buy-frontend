import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../shared/api/axiosInstance";

export default function PaymentBridge() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const code = searchParams.get("code");      // ❌ 실패 시 넘어옴
    const message = searchParams.get("message"); // ❌ 실패 메시지

    if (code) {
      // PG 단계에서 실패한 경우 → confirm 호출할 것도 없음
      navigate(`/chat/${orderId}`, {
        state: { paymentStatus: "FAIL", reason: message || "결제 실패" },
      });
      return;
    }

    if (!paymentKey || !orderId || !amount) {
      navigate(`/chat/${orderId}`, {
        state: { paymentStatus: "FAIL", reason: "잘못된 요청" },
      });
      return;
    }

    // ✅ confirm 호출
    api.post("/payments/confirm", { paymentKey, orderId, amount })
      .then(() => {
        navigate(`/chat/${orderId}`, { state: { paymentStatus: "SUCCESS" } });
      })
      .catch(() => {
        navigate(`/chat/${orderId}`, { state: { paymentStatus: "FAIL", reason: "승인 실패" } });
      });
  }, []);

  return <div>결제 처리 중...</div>;
}

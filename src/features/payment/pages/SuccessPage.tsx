import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import '../Toss.css';


export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [responseData, setResponseData] = useState<any>(null);

  useEffect(() => {
    async function confirm() {
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");
      const paymentKey = searchParams.get("paymentKey");

      if (!orderId || !amount || !paymentKey) {
        navigate("/payment/fail?code=INVALID_PARAMS&message=잘못된 요청입니다.");
        return;
      }

      // ✅ 중복 호출 방지 (한 번 실행된 orderId 저장)
      if (sessionStorage.getItem(`confirmed_${orderId}`)) {
        console.log("이미 confirm 요청이 처리됨:", orderId);
        return;
      }
      sessionStorage.setItem(`confirmed_${orderId}`, "done");

      try {
        // ✅ 백엔드 confirm 호출
        const response = await fetch("http://localhost:8080/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            amount: Number(amount),
            paymentKey,
          }),
        });

        const json = await response.json();

        if (!response.ok) {
          throw { code: json.code || "CONFIRM_FAILED", message: json.message || "결제 승인 실패" };
        }

        setResponseData(json);
      } catch (error: any) {
        navigate(`/payment/fail?code=${error.code}&message=${error.message}`);
      }
    }

    confirm();
  }, [searchParams, navigate]);

  return (
    <div className="toss_box_section" style={{ width: "600px" }}>
      <img
        width="100px"
        src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
        alt="결제 완료"
      />
      <h2>결제를 완료했어요</h2>

      <div className="toss_p_grid toss_typography_p" style={{ marginTop: "30px" }}>
        <div className="toss_p_grid_col toss_text_left"><b>결제금액</b></div>
        <div className="toss_p_grid_col toss_text_right">
          {`${Number(searchParams.get("amount") || 0).toLocaleString()}원`}
        </div>
      </div>

      <div className="toss_p_grid toss_typography_p" style={{ marginTop: "10px" }}>
        <div className="toss_p_grid_col toss_text_left"><b>주문번호</b></div>
        <div className="toss_p_grid_col toss_text_right">{searchParams.get("orderId")}</div>
      </div>

      <div className="toss_p_grid toss_typography_p" style={{ marginTop: "10px" }}>
        <div className="toss_p_grid_col toss_text_left"><b>paymentKey</b></div>
        <div className="toss_p_grid_col toss_text_right" style={{ whiteSpace: "initial" }}>
          {searchParams.get("paymentKey")}
        </div>
      </div>

      <div className="toss_box_section" style={{ marginTop: "20px", textAlign: "left" }}>
        <b>Response Data:</b>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {responseData && JSON.stringify(responseData, null, 2)}
        </pre>
      </div>
    </div>
  );
}

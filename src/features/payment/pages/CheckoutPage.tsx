import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useEffect, useState } from "react";
import '../Toss.css';

const clientKey = "test_ck_DpexMgkW36PwLbonEpqwrGbR5ozO";
const amount = { currency: "KRW", value: 1000 };

export default function CheckoutPage() {
  const [ready, setReady] = useState(false);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: generateRandomString() });
      setPayment(payment);
      setReady(true);
    }
    init();
  }, []);

  async function handlePayment() {
    try {
      // 1. 안전한 merchantOrderId 생성
      const merchantOrderId = "ORDER_" + Date.now();

      // 2. 백엔드에 주문 생성 요청 (→ DB 저장)
      const orderResponse = await fetch("http://localhost:8080/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantOrderId,
          amount: amount.value,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error("Order 생성 실패");
      }

      // 3. Toss 결제창 실행
      await payment.requestPayment({
        method: "CARD",
        amount,
        orderId: merchantOrderId, // Toss API에 전달
        orderName: "테스트 상품",
        successUrl: window.location.origin + "/payment/success",
        failUrl: window.location.origin + "/payment/fail",
        customerEmail: "customer123@gmail.com",
        customerName: "홍길동",
      });
    } catch (err) {
      console.error("결제 요청 실패:", err);
    }
  }

  return (
    <div className="toss_box_section">
      <h2>테스트 결제</h2>
      <button className="toss_button" disabled={!ready} onClick={handlePayment}>
        결제하기
      </button>
    </div>
  );
}

function generateRandomString() {
  return window.btoa(Math.random().toString()).slice(0, 20);
}

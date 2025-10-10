import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// TODO: clientKey / server secretKey 변경 필요
const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const customerKey = generateRandomString();

export function WidgetCheckoutPage() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState({ currency: "KRW", value: 1000 });
  const [ready, setReady] = useState(false);
  const [widgets, setWidgets] = useState(null);

  useEffect(() => {
    async function fetchPaymentWidgets() {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        const widgets = tossPayments.widgets({ customerKey });
        setWidgets(widgets);
      } catch (error) {
        console.error("Error fetching payment widget:", error);
      }
    }
    fetchPaymentWidgets();
  }, [clientKey, customerKey]);

  useEffect(() => {
    async function renderPaymentWidgets() {
      if (!widgets) return;

      await widgets.setAmount(amount);

      await Promise.all([
        widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
        widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
      ]);

      setReady(true);
    }

    renderPaymentWidgets();
  }, [widgets]);

  return (
    <div className="toss_wrapper">
      <div className="toss_box_section">
        <div id="payment-method" />
        <div id="agreement" />

        <button
          className="toss_button"
          style={{ marginTop: "30px" }}
          disabled={!ready}
          onClick={async () => {
            try {
              await widgets.requestPayment({
                orderId: generateRandomString(),
                orderName: "토스 티셔츠 외 2건",
                successUrl: window.location.origin + "/payment/success",
                failUrl: window.location.origin + "/payment/fail",
                customerEmail: "customer123@gmail.com",
                customerName: "김토스",
              });
            } catch (error) {
              console.error(error);
            }
          }}
        >
          결제하기
        </button>
      </div>
    </div>
  );
}

function generateRandomString() {
  return window.btoa(Math.random().toString()).slice(0, 20);
}

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function WidgetSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [responseData, setResponseData] = useState(null);

  useEffect(() => {
    async function confirm() {
      const requestData = {
        orderId: searchParams.get("orderId"),
        amount: searchParams.get("amount"),
        paymentKey: searchParams.get("paymentKey"),
      };

      const response = await fetch("/api/confirm/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const json = await response.json();

      if (!response.ok) {
        throw { message: json.message, code: json.code };
      }

      return json;
    }

    confirm()
      .then((data) => setResponseData(data))
      .catch((error) => {
        navigate(`/fail?code=${error.code}&message=${error.message}`);
      });
  }, [searchParams, navigate]);

  return (
    <>
      <div className="toss_box_section" style={{ width: "600px" }}>
        <img
          width="100px"
          src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
          alt="결제 완료"
        />
        <h2>결제를 완료했어요</h2>

        <div className="toss_p_grid toss_typography_p" style={{ marginTop: "50px" }}>
          <div className="toss_p_grid_col toss_text_left">
            <b>결제금액</b>
          </div>
          <div className="toss_p_grid_col toss_text_right" id="amount">
            {`${Number(searchParams.get("amount")).toLocaleString()}원`}
          </div>
        </div>

        <div className="toss_p_grid toss_typography_p" style={{ marginTop: "10px" }}>
          <div className="toss_p_grid_col toss_text_left">
            <b>주문번호</b>
          </div>
          <div className="toss_p_grid_col toss_text_right" id="orderId">
            {searchParams.get("orderId")}
          </div>
        </div>

        <div className="toss_p_grid toss_typography_p" style={{ marginTop: "10px" }}>
          <div className="toss_p_grid_col toss_text_left">
            <b>paymentKey</b>
          </div>
          <div
            className="toss_p_grid_col toss_text_right"
            id="paymentKey"
            style={{ whiteSpace: "initial", width: "250px" }}
          >
            {searchParams.get("paymentKey")}
          </div>
        </div>
      </div>

      <div className="toss_box_section" style={{ width: "600px", textAlign: "left" }}>
        <b>Response Data :</b>
        <div id="response" style={{ whiteSpace: "initial" }}>
          {responseData && <pre>{JSON.stringify(responseData, null, 4)}</pre>}
        </div>
      </div>
    </>
  );
}

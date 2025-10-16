import { useSearchParams } from "react-router-dom";

export default function FailPage() {
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");
  const message = searchParams.get("message");

  return (
    <div className="toss_box_section" style={{ width: "600px" }}>
      <img
        width="100px"
        src="https://static.toss.im/lotties/error-spot-no-loop-space-apng.png"
        alt="에러 이미지"
      />
      <h2>결제를 실패했어요</h2>

      <div className="toss_p_grid toss_typography_p" style={{ marginTop: "30px" }}>
        <div className="toss_p_grid_col toss_text_left"><b>에러메시지</b></div>
        <div className="toss_p_grid_col toss_text_right" id="message">
          {message || "알 수 없는 오류가 발생했습니다."}
        </div>
      </div>

      <div className="toss_p_grid toss_typography_p" style={{ marginTop: "10px" }}>
        <div className="toss_p_grid_col toss_text_left"><b>에러코드</b></div>
        <div className="toss_p_grid_col toss_text_right" id="code">
          {code || "-"}
        </div>
      </div>

      <div className="toss_box_section" style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          className="toss_button"
          onClick={() => (window.location.href = "/payment/checkout")}
        >
          다시 결제하기
        </button>
      </div>
    </div>
  );
}

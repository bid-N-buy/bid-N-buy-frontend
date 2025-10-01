import { useSearchParams } from "react-router-dom";
import '../Toss.css'

export function FailPage() {
  const [searchParams] = useSearchParams();

  return (
    <div id="info" className="toss_box_section">
      <img
        width="100px"
        src="https://static.toss.im/lotties/error-spot-no-loop-space-apng.png"
        alt="에러 이미지"
      />
      <h2>결제를 실패했어요</h2>

      <div className="toss_p_grid toss_typography_p" style={{ marginTop: "50px" }}>
        <div className="toss_p_grid_col toss_text_left">
          <b>에러메시지</b>
        </div>
        <div className="toss_p_grid_col toss_text_right" id="message">
          {searchParams.get("message")}
        </div>
      </div>

      <div className="toss_p_grid toss_typography_p" style={{ marginTop: "10px" }}>
        <div className="toss_p_grid_col toss_text_left">
          <b>에러코드</b>
        </div>
        <div className="toss_p_grid_col toss_text_right" id="code">
          {searchParams.get("code")}
        </div>
      </div>
    </div>
  );
}

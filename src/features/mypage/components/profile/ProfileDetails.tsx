import React from "react";

const ProfileDetails = () => {
  return (
    <>
      <h3>프로필</h3>
      <div>
        <img src="" alt="" />
        <h4>NickName</h4>
      </div>

      <div>
        <h6>온도</h6>
        <div>온도 바</div>
      </div>

      <div>
        <div>
          <h5>
            판매 완료된 거래 <span>2</span>건
          </h5>
          <a href="">판매 물품 보러가기</a>
        </div>
        <div>판매완료 물품 3개 출력</div>
      </div>

      <div>
        <div>
          <h5>
            판매 물품 <span>2</span>건
          </h5>
          <a href="">판매 물품 보러가기</a>
        </div>
        <div>판매 물품 3개 출력</div>
      </div>
    </>
  );
};

export default ProfileDetails;

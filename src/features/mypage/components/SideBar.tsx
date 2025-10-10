import React from "react";

const SideBar = () => {
  return (
    <>
      <div>
        <h1>마이 페이지</h1>

        <div>
          <h3>쇼핑 정보</h3>
          <div>
            <h5>구매 내역</h5>
            <h5>판매 내역</h5>
            <h5>찜 목록</h5>
          </div>
        </div>

        <div>
          <h3>내 정보</h3>
          <div>
            <h5>프로필 관리</h5>
          </div>
        </div>

        <div>
          <h3>문의 목록</h3>
          <div>
            <h5>1:1 문의/신고</h5>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideBar;

import React from "react";

const AddressDetails = () => {
  return (
    <>
      <div>
        <h5>홍길동</h5>
        <h6>010-2222-3333</h6>
        <h6>
          <span>(00000)</span>
          <span>도로명 주소 혹은 지번 주소 + 주소 디테일</span>
        </h6>
      </div>

      <div>
        <button>수정</button>
        <button>삭제</button>
      </div>
    </>
  );
};

export default AddressDetails;

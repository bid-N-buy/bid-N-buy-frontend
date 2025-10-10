import React from "react";

const ProfileSetting = () => {
  return (
    <>
      <h2>프로필 관리</h2>
      <div>
        <img src="" alt="" />
        <div>
          <h3>NickName</h3>
          <button>이미지 변경</button>
        </div>
      </div>

      <div>
        <h4>프로필 정보</h4>
        <div>
          <div>
            <h5>닉네임</h5>
            <div>
              <input type="text">NickName</input>
              <button>변경</button>
            </div>
          </div>

          <div>
            <h5>비밀번호 변경</h5>
            <div>
              <div>
                <input type="password" />
                <input type="password" />
              </div>
              <button>변경</button>
            </div>
          </div>

          <div>
            <h5>주소</h5>
            <div>주소~~~</div>
          </div>
        </div>
      </div>
      <h6>탈퇴하기</h6>
    </>
  );
};

export default ProfileSetting;

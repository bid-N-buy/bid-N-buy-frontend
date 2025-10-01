import React from "react";

const SignUpForm = () => {
  return (
    <>
      <form className="m-auto w-[420px]">
        {/* 이메일 중복확인 밎 인증 */}
        <div className="mb-[20px]">
          <h5 className="text-h5 font-bold">이메일</h5>
          <div className="mb-[10px] flex w-[420px] justify-between">
            <p className="text-h7 text-red">중복된 이메일 입니다.</p>
            <button
              type="button"
              className="h-[30px] w-[100px] rounded-md border"
            >
              중복 확인
            </button>
          </div>
          <div>
            <input
              type="email"
              className="mb-[15px] h-[40px] w-[420px] rounded-md border"
            />
            <div className="flex gap-[10px]">
              <input
                type="text"
                className="h-[50px] w-[190px] rounded-md border"
              />
              <button
                type="button"
                className="border-purple text-purple h-[50px] w-[220px] rounded-md border"
              >
                인증하기
              </button>
            </div>
          </div>
        </div>
        {/* 비밀번호 */}
        <div>
          <div className="mb-[20px]">
            <h5 className="text-h5 mb-[10px] font-bold">비밀번호</h5>
            <p className="mb-[10px]">영문, 숫자 포함 8자 이상</p>
            <input
              type="password"
              className="mb-[5px] h-[40px] w-[420px] rounded-md border"
            />
            <p className="text-h7 text-red">
              영문, 숫자 포함 8자 이상 적어주세요
            </p>
          </div>
          <div className="mb-[20px]">
            <h5 className="text-h5 mb-[10px] font-bold">비밀번호 확인</h5>
            <input
              type="password"
              className="mb-[5px] h-[40px] w-[420px] rounded-md border"
            />
            <p className="text-h7 text-red">비밀번호를 확인해 주세요</p>
          </div>
        </div>
        {/* 닉네임 */}
        <div>
          <h5 className="text-h5 mb-[10px] font-bold">닉네임</h5>
          <input
            type="text"
            className="focus:border-purple mb-[50px] h-[40px] w-[420px] rounded-md border focus:border-2 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-purple hover:bg-deep-purple h-[50px] w-[420px] rounded-md text-white"
        >
          {" "}
          회원가입 하기
        </button>
      </form>
    </>
  );
};

export default SignUpForm;

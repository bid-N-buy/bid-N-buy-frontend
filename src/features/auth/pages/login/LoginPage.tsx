import React from "react";
import LoginForm from "../../components/login/LoginForm";

const LoginPage = () => {
  return (
    <>
      <div className="mx-auto mt-[120px] mb-[200px] min-h-[650px] w-[480px] text-center">
        <h3 className="text-h3 mb-[24px] text-center font-bold">로그인</h3>
        <div className="bg-g400 mb-[30px] h-[2px] w-[480px]"></div>
        <LoginForm />
      </div>
    </>
  );
};

export default LoginPage;

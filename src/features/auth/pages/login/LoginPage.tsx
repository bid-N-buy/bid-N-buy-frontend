import React from "react";
import LoginForm from "../../components/login/LoginForm";

const LoginPage = () => {
  return (
    <>
      <div className="mx-auto mt-[190px] w-[300px] text-center">
        <a href="/">
          <h1 className="font-logo mb-[36px]">
            Bid<span className="text-purple">&</span>Buy
          </h1>
        </a>
        <LoginForm />
      </div>
    </>
  );
};

export default LoginPage;

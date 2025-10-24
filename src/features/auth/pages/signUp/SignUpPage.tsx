import React from "react";
import SignUpForm from "../../components/signUp/SignUpForm";

const SignUpPage = () => {
  return (
    <>
      <div className="mx-auto my-[120px] min-h-[800px] w-[480px]">
        <h3 className="text-h3 mb-[24px] text-center font-bold">회원가입</h3>
        <div className="bg-g400 mb-[30px] h-[2px] w-[480px]"></div>
        <SignUpForm />
      </div>
    </>
  );
};

export default SignUpPage;

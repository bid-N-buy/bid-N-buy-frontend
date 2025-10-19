import React from "react";
import AdminSignUpForm from "../components/AdminSignUpForm";

const AdminSignUpPage = () => {
  return (
    <div className="mx-auto mt-[20px] w-[480px]">
      <h3 className="text-h3 mb-[24px] text-center font-bold">회원가입</h3>
      <div className="bg-g400 mb-[30px] h-[2px] w-[480px]"></div>
      <AdminSignUpForm />
    </div>
  );
};

export default AdminSignUpPage;

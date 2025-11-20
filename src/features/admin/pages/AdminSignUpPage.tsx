import React from "react";
import AdminSignUpForm from "../components/AdminSignUpForm";

const AdminSignUpPage = () => {
  return (
    <div className="mx-auto mt-[100px] w-[80%] md:w-[480px]">
      <h3 className="text-h3 my-[24px] text-center font-bold">회원가입</h3>
      <AdminSignUpForm />
    </div>
  );
};

export default AdminSignUpPage;

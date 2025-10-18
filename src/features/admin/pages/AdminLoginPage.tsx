import React from "react";
import AdminLoginForm from "../components/AdminLoginForm";

const AdminLoginPage = () => {
  return (
    <>
      <div className="mx-auto mt-[100px] w-[300px] text-center">
        <a href="/">
          <h1 className="font-logo mb-[36px]">
            Bid<span className="text-purple">&</span>Buy
          </h1>
        </a>
        <AdminLoginForm />
      </div>
    </>
  );
};

export default AdminLoginPage;

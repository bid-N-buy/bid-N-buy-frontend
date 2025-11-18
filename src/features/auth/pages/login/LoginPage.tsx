// src/features/auth/pages/LoginPage.tsx
import React from "react";
import LoginForm from "../../components/login/LoginForm";

const LoginPage: React.FC = () => {
  return (
    <main className="mx-auto w-full max-w-[480px] px-4 sm:px-6">
      <section className="mx-auto mt-16 sm:mt-20 md:mt-24 mb-24 sm:mb-32 min-h-[520px] sm:min-h-[600px] md:min-h-[650px]">
        <h3 className="mb-5 text-center text-2xl font-bold sm:mb-6 sm:text-3xl">
          로그인
        </h3>

        {/* 구분선: 반응형 폭 + 다크모드 대응 */}
        <div className="mb-7 h-px w-full bg-neutral-200 dark:bg-neutral-700 sm:mb-8" />

        {/* 폼은 내부에서 너비를 관리한다고 가정 (가로 패딩으로 안정화) */}
        <div className="mx-auto w-full">
          <LoginForm />
        </div>
      </section>
    </main>
  );
};

export default LoginPage;

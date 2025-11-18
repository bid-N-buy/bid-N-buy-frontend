// src/features/auth/pages/SignUpPage.tsx
import React from "react";
import SignUpForm from "../../components/signUp/SignUpForm";

const SignUpPage: React.FC = () => {
  return (
    <main className="mx-auto w-full max-w-[480px] px-4 sm:px-6">
      <section className="mx-auto my-16 min-h-[640px] sm:my-20 sm:min-h-[720px] md:my-24 md:min-h-[800px]">
        <h3 className="mb-5 text-center text-2xl font-bold sm:mb-6 sm:text-3xl">
          회원가입
        </h3>

        {/* 구분선: 반응형 폭 + 다크모드 대응 */}
        <div className="mb-7 h-px w-full bg-neutral-200 sm:mb-8 dark:bg-neutral-700" />

        <div className="mx-auto w-full">
          <SignUpForm />
        </div>
      </section>
    </main>
  );
};

export default SignUpPage;

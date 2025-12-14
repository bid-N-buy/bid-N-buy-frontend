import React from "react";

export default function ErrorPage({ error, resetErrorBoundary }: any) {
  if (import.meta.env.DEV) {
    console.error("ErrorBoundary Catch:", error);
  }

  const handleFullReload = () => {
    // 1. 리셋을 시도하여 상태를 초기화하고
    resetErrorBoundary();
    // 2. 그럼에도 복구되지 않을 가능성에 대비하여 브라우저 강제 새로고침
    window.location.reload();
  };

  return (
    <div className="h-full w-full">
      <div className="flex items-center justify-center text-center">
        <p className="font-logo text-h3 md:text-h2 lg:text-h1 block">
          Bid<span className="text-purple">&amp;</span>Buy
        </p>
        <p>서비스 이용에 불편을 드려 죄송합니다.</p>
        <button
          onClick={handleFullReload}
          className="bg-purple hover:bg-deep-purple mt-2 cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-white transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

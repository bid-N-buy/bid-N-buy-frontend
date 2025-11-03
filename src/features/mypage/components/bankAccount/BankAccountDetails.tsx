import React from "react";
import type { BankAccount } from "../../types/bankAccount";

type Props = {
  account: BankAccount | null;
  loading: boolean;
  error?: any;
  onEdit: () => void;
};

const BankAccountDetails: React.FC<Props> = ({
  account,
  loading,
  error,
  onEdit,
}) => {
  /* 버튼 토큰 (AccountSettings와 동일 규칙) */
  const btnBase =
    "inline-flex items-center justify-center rounded-md h-9 px-4 text-[13px] font-medium " +
    "transition-colors disabled:opacity-60 whitespace-nowrap leading-[1.1] min-w-[72px]";
  const btnPrimary = `${btnBase} bg-purple text-white hover:bg-deep-purple`;
  const btnGhost = `${btnBase} border border-neutral-300 text-neutral-800 hover:bg-neutral-50`;

  if (loading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-[14px] text-neutral-500">
        불러오는 중…
      </div>
    );
  }

  if (error && !account) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-[14px] text-rose-600">
        계좌 정보를 불러오지 못했습니다.
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
        <div className="text-[14px] text-neutral-500">
          등록된 계좌 정보가 없습니다.
        </div>
        <button
          type="button"
          className={btnPrimary}
          onClick={onEdit}
          aria-label="정산 계좌 등록"
        >
          계좌 등록
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-[15px] font-semibold text-neutral-900">
            {account.bankName}
          </div>
          <div className="mt-0.5 text-[14px] text-neutral-700">
            {account.accountNumber}
          </div>
          <div className="mt-0.5 text-[13px] text-neutral-500">
            예금주: {account.accountHolder}
          </div>
        </div>

        <button
          type="button"
          className={btnGhost}
          onClick={onEdit}
          aria-label="정산 계좌 변경"
        >
          변경
        </button>
      </div>
    </div>
  );
};

export default BankAccountDetails;

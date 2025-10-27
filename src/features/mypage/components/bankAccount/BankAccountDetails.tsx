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
          className="rounded-full bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90"
          onClick={onEdit}
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
          className="rounded-md border border-neutral-300 bg-white px-3 py-[6px] text-[13px] text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100"
          onClick={onEdit}
        >
          수정
        </button>
      </div>
    </div>
  );
};

export default BankAccountDetails;

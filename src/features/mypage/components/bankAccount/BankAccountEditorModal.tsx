import React, { useEffect, useState } from "react";
import type { BankAccount, BankAccountDraft } from "../../types/bankAccount";

type Props = {
  open: boolean;
  initial: BankAccount | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: BankAccountDraft) => Promise<void>;
};

const BankAccountEditorModal: React.FC<Props> = ({
  open,
  initial,
  saving,
  onClose,
  onSave,
}) => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  useEffect(() => {
    if (open) {
      setBankName(initial?.bankName ?? "");
      setAccountNumber(initial?.accountNumber ?? "");
      setAccountHolder(initial?.accountHolder ?? "");
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = async () => {
    await onSave({
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim(),
    });
  };

  const lineInput =
    "w-full rounded-none border-0 border-b border-neutral-300 bg-transparent px-0 py-[10px] text-[15px] placeholder:text-neutral-400 focus:border-neutral-800 focus:ring-0";
  const ghostBtn =
    "rounded-md border border-neutral-300 bg-white px-3 py-[6px] text-[13px] text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100";
  const purpleBtn =
    "rounded-md bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90 disabled:opacity-60";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[18px] font-semibold text-neutral-900">
          {initial ? "계좌 정보 수정" : "계좌 정보 등록"}
        </h3>

        <div className="mt-4">
          <label className="mb-1 block text-[12px] text-neutral-500">
            은행명
          </label>
          <input
            className={lineInput}
            placeholder="예: 카카오뱅크"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-[12px] text-neutral-500">
            계좌번호
          </label>
          <input
            className={lineInput}
            placeholder="숫자만 입력"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-[12px] text-neutral-500">
            예금주
          </label>
          <input
            className={lineInput}
            placeholder="홍길동"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={purpleBtn}
            disabled={saving}
            onClick={submit}
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankAccountEditorModal;

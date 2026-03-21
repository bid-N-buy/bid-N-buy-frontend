import React from "react";
import type { Address } from "../../types/address";

type Props = {
  address: Address | null;
  loading: boolean;
  error: unknown;
  onEdit: () => void;
};

const AddressDetails: React.FC<Props> = ({
  address,
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

  if (error && !address) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-[14px] text-rose-600">
        주소 정보를 불러오지 못했습니다.
      </div>
    );
  }

  if (!address) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
        <div className="text-[14px] text-neutral-500">
          등록된 주소가 없습니다.
        </div>
        <button
          type="button"
          className={btnPrimary}
          onClick={onEdit}
          aria-label="주소 등록"
        >
          주소 등록
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="text-[14px] text-neutral-800">
          <div className="text-[15px] font-semibold text-neutral-900">
            {address.name} ({address.phoneNumber})
          </div>

          <div className="mt-1 text-[14px] leading-[1.4] text-neutral-700">
            [{address.zonecode}] {address.address}
            {address.detailAddress ? ` ${address.detailAddress}` : ""}
          </div>
        </div>

        <button
          type="button"
          className={btnGhost}
          onClick={onEdit}
          aria-label="주소 변경"
        >
          변경
        </button>
      </div>
    </div>
  );
};

export default AddressDetails;

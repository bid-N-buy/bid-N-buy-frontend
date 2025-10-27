// AddressDetails.tsx
import React from "react";
import type { Address } from "../../types/address"; // <- 공통 타입에서 가져오기 (경로는 맞게)

type Props = {
  address: Address | null;
  loading: boolean;
  error: any;
  onEdit: () => void;
};

const AddressDetails: React.FC<Props> = ({
  address,
  loading,
  error,
  onEdit,
}) => {
  const editBtn =
    "rounded-md border border-neutral-300 bg-white px-3 py-[6px] text-[13px] text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100";

  const addBtn =
    "rounded-full bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90";

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

        <button type="button" className={addBtn} onClick={onEdit}>
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

        <button type="button" className={editBtn} onClick={onEdit}>
          수정
        </button>
      </div>
    </div>
  );
};

export default AddressDetails;

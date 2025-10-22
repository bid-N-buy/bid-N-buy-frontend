// AddressDetails.tsx
import React from "react";
import type { Address } from "../../types/address";

type Props = {
  addresses?: Address[]; // 옵션
  loading?: boolean;
  onEdit: (addr: Address) => void;
  onDelete: (id: number) => void;
};

const AddressDetails: React.FC<Props> = ({
  addresses = [],
  loading = false,
  onEdit,
  onDelete,
}) => {
  if (loading) return <p className="text-sm text-neutral-500">불러오는 중…</p>;
  if (addresses.length === 0)
    return <p className="text-sm text-neutral-500">등록된 주소가 없습니다.</p>;

  return (
    <ul className="space-y-3">
      {addresses.map((a) => (
        <li
          key={a.addressId}
          className="rounded-2xl border border-neutral-200 bg-white p-4"
        >
          <div className="mb-2 flex items-start justify-between">
            <div>
              <div className="text-[15px] font-semibold text-neutral-900">
                {a.name}
              </div>
              <div className="text-[13px] text-neutral-600">
                {a.phoneNumber}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90"
                onClick={() => onEdit(a)}
              >
                수정
              </button>
              <button
                type="button"
                className="rounded-md bg-neutral-200 px-3 py-[6px] text-[13px] text-neutral-700 hover:bg-neutral-300"
                onClick={() => onDelete(a.addressId)}
              >
                삭제
              </button>
            </div>
          </div>

          <p className="text-[12px] leading-relaxed text-neutral-600">
            ({a.zonecode}) {a.address} {a.detailAddress ?? ""}
          </p>
        </li>
      ))}
    </ul>
  );
};

export default AddressDetails;

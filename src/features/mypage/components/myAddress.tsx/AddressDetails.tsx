// AddressDetails.tsx
import React from "react";

type Props = {
  name?: string;
  phone?: string;
  postcode?: string;
  address1?: string; // 도로명/지번
  address2?: string; // 상세 주소
  onEdit?: () => void;
  onDelete?: () => void;
};

const AddressDetails: React.FC<Props> = ({
  name = "홍길동",
  phone = "010XXXXXXXX",
  postcode = "00000",
  address1 = "도로명 주소 혹은 지번 주소",
  address2 = "기타 상세한 주소 를 보여줍니다.",
  onEdit,
  onDelete,
}) => {
  return (
    <section
    className="
      rounded-[32px]
      bg-[#ECDEF5]
      p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]
      md:p-10
    "
  >
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      {/* 텍스트 블록 */}
      <div className="max-w-[1080px]">
        <h5 className="text-[28px] leading-none font-extrabold text-neutral-900 md:text-[36px]">
          {name}
        </h5>

        <p className="mt-4 text-[20px] font-semibold text-neutral-800 md:text-[24px]">
          {phone}
        </p>

        <p className="mt-3 text-[20px] font-medium tracking-[-0.01em] text-neutral-800 md:text-[28px]">
          <span className="mr-2">(우편번호 {postcode})</span>
          <span>{address1}</span>
          <span className="mx-2">＋</span>
          <span>{address2}</span>
        </p>
      </div>

      {/* 버튼 블록 */}
      <div className="flex gap-3 self-end md:self-auto">
        <button
          onClick={onEdit}
          className="
            rounded-2xl
            bg-[#8322BF]
            px-6 py-3
            font-bold text-white
            shadow-[0_6px_18px_rgba(131,34,191,0.35)]
            transition hover:brightness-110 active:translate-y-[1px]
            md:px-7 md:py-3.5
          "
        >
          수정
        </button>

        <button
          onClick={onDelete}
          className="
            rounded-2xl
            bg-neutral-300/60
            px-6 py-3
            font-bold text-neutral-800
            transition hover:bg-neutral-300 active:translate-y-[1px]
            md:px-7 md:py-3.5
          "
        >
          삭제
        </button>
      </div>
    </div>
  </section>
  );
};

export default AddressDetails;

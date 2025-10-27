// AddressEditorModal.tsx
import React, { useEffect, useState } from "react";
import PostcodeSearchButton from "./PostcodeSearchButton";
import type { Address, AddressDraft } from "../../types/address";

type Props = {
  open: boolean;
  initial: Address | null;
  saving: boolean; // <- 부모에서 내려오는 API 저장 중 상태
  onClose: () => void;
  onSave: (
    draft: AddressDraft | (AddressDraft & { addressId?: number })
  ) => Promise<void> | void;
};

const lineInput =
  "w-full rounded-none border-0 border-b border-neutral-300 bg-transparent px-0 py-[10px] text-[15px] placeholder:text-neutral-400 focus:border-neutral-800 focus:ring-0";

const AddressEditorModal: React.FC<Props> = ({
  open,
  initial,
  saving,
  onClose,
  onSave,
}) => {
  // 폼 상태
  const [name, setName] = useState(initial?.name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber ?? "");
  const [zonecode, setZonecode] = useState(initial?.zonecode ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [detailAddress, setDetailAddress] = useState(
    initial?.detailAddress ?? ""
  );

  // 로컬 "지금 제출 중" 상태 (중복 클릭 방지용)
  const [submitting, setSubmitting] = useState(false);

  // 모달이 새로 열릴 때마다 initial 값으로 리셋
  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setPhoneNumber(initial?.phoneNumber ?? "");
    setZonecode(initial?.zonecode ?? "");
    setAddress(initial?.address ?? "");
    setDetailAddress(initial?.detailAddress ?? "");
    setSubmitting(false); // 새로 열릴 땐 항상 false로 초기화
  }, [open, initial]);

  if (!open) return null;

  const handleSave = async () => {
    // 필수값 체크
    if (
      !name.trim() ||
      !phoneNumber.trim() ||
      !zonecode.trim() ||
      !address.trim()
    ) {
      alert("받는 사람, 전화번호, 우편번호, 주소는 필수입니다.");
      return;
    }

    // 중복 클릭 방지
    if (submitting || saving) return;

    setSubmitting(true);

    // 부모에 올릴 payload
    const payload = {
      ...(initial?.addressId ? { addressId: initial.addressId } : {}),
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      zonecode: zonecode.trim(),
      address: address.trim(),
      detailAddress: detailAddress.trim(),
    };

    try {
      await onSave(payload);
      onClose(); // 성공하면 모달 닫기
    } finally {
      setSubmitting(false);
    }
  };

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
          {initial?.addressId ? "주소 수정" : "새 주소 추가"}
        </h3>

        {/* 받는 사람 */}
        <label className="mt-4 mb-1 block text-[12px] text-neutral-500">
          받는 사람
        </label>
        <input
          className={lineInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
        />

        {/* 전화번호 */}
        <label className="mt-4 mb-1 block text-[12px] text-neutral-500">
          전화번호
        </label>
        <input
          className={lineInput}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="010-0000-0000"
        />

        {/* 우편번호 + 검색 */}
        <div className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[12px] text-neutral-500">
              우편번호
            </label>
            <input
              className={lineInput}
              value={zonecode}
              onChange={(e) => setZonecode(e.target.value)}
              placeholder="우편번호"
            />
          </div>

          <PostcodeSearchButton
            onSelected={(v) => {
              setZonecode(v.zonecode);
              setAddress(v.address);
              // 건물명 있으면 상세주소 초기값으로 추천
              if (v.buildingName && !detailAddress) {
                setDetailAddress(v.buildingName);
              }
            }}
            className="rounded-md bg-neutral-900 px-3 py-[8px] text-[13px] text-white hover:opacity-90"
          />
        </div>

        {/* 주소 (도로명) */}
        <label className="mt-4 mb-1 block text-[12px] text-neutral-500">
          주소 (도로명)
        </label>
        <input
          className={lineInput}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="도로명 주소"
          disabled
          readOnly
        />

        {/* 상세 주소 */}
        <label className="mt-4 mb-1 block text-[12px] text-neutral-500">
          상세 주소
        </label>
        <input
          className={lineInput}
          value={detailAddress}
          onChange={(e) => setDetailAddress(e.target.value)}
          placeholder="동/호수, 건물명 등"
        />

        {/* 액션 버튼들 */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-[6px] text-[13px]"
            onClick={onClose}
            disabled={submitting || saving}
          >
            취소
          </button>

          <button
            type="button"
            className="rounded-md bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90 disabled:opacity-60"
            onClick={handleSave}
            disabled={submitting || saving}
          >
            {submitting || saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressEditorModal;

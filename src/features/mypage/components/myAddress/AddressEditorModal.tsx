// AddressEditorModal.tsx (일부만 발췌)
import React, { useEffect, useState } from "react";
import PostcodeSearchButton from "./PostcodeSearchButton"; // 경로 맞춰주세요
import type { Address, AddressDraft } from "../../types/address";

type Props = {
  open: boolean;
  initial: Address | null;
  onClose: () => void;
  onSave: (
    draft: AddressDraft | (AddressDraft & { id?: number })
  ) => Promise<void> | void;
};

const lineInput =
  "w-full rounded-none border-0 border-b border-neutral-300 bg-transparent px-0 py-[10px] text-[15px] placeholder:text-neutral-400 focus:border-neutral-800 focus:ring-0";

const AddressEditorModal: React.FC<Props> = ({
  open,
  initial,
  onClose,
  onSave,
}) => {
  const [receiver, setReceiver] = useState(initial?.receiver ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [postcode, setPostcode] = useState(initial?.postcode ?? "");
  const [address1, setAddress1] = useState(initial?.address1 ?? "");
  const [address2, setAddress2] = useState(initial?.address2 ?? "");
  const [isDefault, setIsDefault] = useState<boolean>(
    initial?.isDefault ?? false
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReceiver(initial?.receiver ?? "");
    setPhone(initial?.phone ?? "");
    setPostcode(initial?.postcode ?? "");
    setAddress1(initial?.address1 ?? "");
    setAddress2(initial?.address2 ?? "");
    setIsDefault(initial?.isDefault ?? false);
  }, [open, initial]);

  if (!open) return null;

  const handleSave = async () => {
    if (
      !receiver.trim() ||
      !phone.trim() ||
      !postcode.trim() ||
      !address1.trim()
    ) {
      alert("받는 사람, 전화번호, 우편번호, 주소1은 필수입니다.");
      return;
    }
    setSubmitting(true);
    await onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      receiver: receiver.trim(),
      phone: phone.trim(),
      postcode: postcode.trim(),
      address1: address1.trim(),
      address2: address2.trim(),
      isDefault,
    } as any);
    setSubmitting(false);
    onClose();
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
          {initial?.id ? "주소 수정" : "새 주소 추가"}
        </h3>

        {/* 받는 사람 */}
        <label className="mt-4 mb-1 block text-[12px] text-neutral-500">
          받는 사람
        </label>
        <input
          className={lineInput}
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          placeholder="이름"
        />

        {/* 전화번호 */}
        <label className="mt-4 mb-1 block text-[12px] text-neutral-500">
          전화번호
        </label>
        <input
          className={lineInput}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="우편번호"
            />
          </div>

          <PostcodeSearchButton
            onSelected={(v) => {
              setPostcode(v.zonecode);
              setAddress1(v.address);
              // 건물명 있으면 address2 초기값에 참고(선택)
              if (v.buildingName && !address2) {
                setAddress2(v.buildingName);
              }
            }}
            className="rounded-md bg-neutral-900 px-3 py-[8px] text-[13px] text-white hover:opacity-90"
          />
        </div>

        {/* 주소1 (도로명) */}
        <label className="mt-4 mb-1 block text-[12px] text-neutral-500">
          주소1 (도로명)
        </label>
        <input
          className={lineInput}
          value={address1}
          onChange={(e) => setAddress1(e.target.value)}
          placeholder="도로명 주소"
        />

        {/* 주소2 (상세) */}
        <label className="mt-4 mb-1 block text-[12px] text-neutral-500">
          주소2 (상세)
        </label>
        <input
          className={lineInput}
          value={address2}
          onChange={(e) => setAddress2(e.target.value)}
          placeholder="동/호수, 건물명 등"
        />

        {/* 기본 주소 여부 */}
        <div className="mt-4 flex items-center gap-2">
          <input
            id="isDefault"
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          <label htmlFor="isDefault" className="text-sm text-neutral-700">
            기본 주소로 설정
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-[6px] text-[13px]"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="rounded-md bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90 disabled:opacity-60"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressEditorModal;

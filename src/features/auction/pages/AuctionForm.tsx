// todo 시간 입력 fix.. 등
import React, { useState } from "react";
import { Camera } from "lucide-react";
import { useAuctionFormStore } from "../store/auctionFormStore";
import { createAuction } from "../api/auctions";
import useToast from "../../../shared/hooks/useToast";
import { validateCreateAuction } from "../utils/validation";
import { capToTen, ensureSingleMain } from "../utils/images";
import type { ImageType } from "../types/auctions";
import Toast from "../../../shared/components/Toast";

// 숫자 파싱
const parseNum = (s: string) => {
  const n = Number(s.replaceAll(",", "").trim());
  return Number.isFinite(n) ? n : null;
};

// 숫자 입력 가드(타이핑 중 실수 방지) - 체크
const onlyNum = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const ok =
    /[0-9]/.test(e.key) ||
    ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key);
  if (!ok) e.preventDefault();
};

// 날짜/시간 문자열 결합 -> Date
const combineDateTime = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr) return null;
  // input[type=time]은 24시간 "HH:mm"
  return new Date(`${dateStr}T${timeStr}:00`);
};

const AuctionForm = () => {
  const { toast, showToast, hideToast } = useToast();

  const {
    title,
    description,
    categoryMain,
    categorySub,
    startPrice,
    minBidPrice,
    images,
    set,
    removeImage,
    setMainImage,
    toRequest,
    reset,
  } = useAuctionFormStore();

  // UI 편의용 로컬 상태(텍스트 -> date/time 토글)
  const [dateStart, setDateStart] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [timeEnd, setTimeEnd] = useState("");

  const [loading, setLoading] = useState(false);

  // 임시 카테고리 - todo
  const onChangeCategoryMain = (v: string) => {
    set("categoryMain", v);
    set("categorySub", "");
    set("categoryId", null);
  };
  const onChangeCategorySub = (v: string) => {
    set("categorySub", v);
    const fakeMap: Record<string, number> = { sub1: 101, sub2: 102 };
    set("categoryId", fakeMap[v] ?? null);
  };

  // 파일 선택 핸들러
  const onFilesSelected = (files: File[]) => {
    // 현재 이미지 갯수 기준으로 수용량 계산
    const room = Math.max(0, 10 - images.length);
    const taking = files.slice(0, room);

    if (files.length > room) {
      showToast(
        "이미지는 최대 10장까지 가능합니다. 초과분은 제외했습니다.",
        "error"
      );
    }

    // 새 이미지 생성 (미리보기용 blob URL) — todo 실제론 업로드 후 공개 URL 사용
    const newImages: { imageUrl: string; imageType: ImageType }[] = taking.map(
      (f, i) => {
        const url = URL.createObjectURL(f);
        const isMain = images.length === 0 && i === 0;
        const imageType: ImageType = isMain ? "MAIN" : "DETAIL";
        return { imageUrl: url, imageType };
      }
    );

    // 보정) MAIN 1장 + 10장 제한
    const combined = [...images, ...newImages];
    const fixed = ensureSingleMain(capToTen(combined));

    set("images", fixed);
  };

  // blob URL 메모리 누수 방지(삭제/리셋 시 revoke)
  const onRemoveImage = (idx: number) => {
    const target = images[idx];
    if (target?.imageUrl.startsWith("blob:"))
      URL.revokeObjectURL(target.imageUrl);
    removeImage(idx);
  };
  const revokeAll = () => {
    images.forEach((img) => {
      if (img.imageUrl.startsWith("blob:")) URL.revokeObjectURL(img.imageUrl);
    });
  };

  const onClickCancel = () => {
    revokeAll();
    reset();
  };

  const onClickSubmit = async () => {
    if (loading) return;

    // 날짜/시간 결합
    const sAt = combineDateTime(dateStart, timeStart);
    const eAt = combineDateTime(dateEnd, timeEnd);
    set("startAt", sAt);
    set("endAt", eAt);

    try {
      setLoading(true);

      // 보정 1회 더(중간 수정 대비)
      set("images", ensureSingleMain(capToTen(images)));

      // DTO 변환(스토어에서 필수 가드 ㅇㅇ 누락 시 throw)
      const payload = toRequest();

      // 도메인 유효성 검사
      const errs = validateCreateAuction(payload);
      if (errs.length) {
        showToast(errs[0], "error");
        return;
      }

      // api 호출
      const res = await createAuction(payload);
      showToast(res.message || "등록되었습니다.", "success");

      // blob URL 정리 후 리셋
      revokeAll();
      reset();

      // todo - navigate(`/auctions/${res.auctionId}`);
    } catch (err: any) {
      // toRequest 에러 여기로
      const msg =
        err?.message ?? err?.response?.data?.message ?? "등록에 실패했습니다.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="flex flex-col gap-[60px]">
        <h3 className="border-g400 text-g100 border-b pb-4">경매 등록</h3>

        {/* 이미지 */}
        <div className="flex items-start">
          <div className="w-40 flex-shrink-0">
            <label htmlFor="images" className="text-g100 text-base font-medium">
              상품 이미지
            </label>
            <span className="text-g300 text-h7"> ({images.length}/10)</span>
          </div>
          <div className="flex-1">
            <label
              htmlFor="images"
              className="bg-g500 hover:bg-g400 flex h-[200px] w-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-md transition-colors"
            >
              <Camera className="text-g200 h-8 w-8" />
              <span className="text-g200 text-h7">이미지 등록</span>
            </label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={images.length >= 10} // 10장 도달 시 비활성화
              onChange={(e) =>
                onFilesSelected(Array.from(e.target.files ?? []))
              }
            />

            {/* 썸네일 - todo 정렬 */}
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="h-24 w-24 rounded-md object-cover"
                  />
                  <div className="text-h8 mt-1 text-center">
                    {img.imageType === "MAIN" ? "대표" : "상세"}
                  </div>
                  <div className="text-h8 mt-1 flex gap-2">
                    <button
                      className="underline"
                      type="button"
                      onClick={() => setMainImage(i)}
                    >
                      대표
                    </button>
                    <button
                      className="underline"
                      type="button"
                      onClick={() => onRemoveImage(i)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 상품명 */}
        <div className="flex items-center">
          <label
            htmlFor="productName"
            className="text-g100 w-40 flex-shrink-0 text-base font-medium"
          >
            상품명
          </label>
          <div className="flex-1">
            <div className="field">
              <input
                id="productName"
                type="text"
                placeholder="상품명을 입력해 주세요."
                value={title}
                onChange={(e) => set("title", e.target.value)}
                className="field-input placeholder-muted"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* 카테고리 */}
        <div className="flex items-center">
          <label className="text-g100 w-40 flex-shrink-0 text-base font-medium">
            카테고리
          </label>
          <div className="grid flex-1 grid-cols-2 gap-[10px]">
            <select
              value={categoryMain}
              onChange={(e) => onChangeCategoryMain(e.target.value)}
              className="border-g400 focus:border-purple cursor-pointer appearance-none rounded-md border bg-white px-3 py-2.5 text-base focus:outline-none"
            >
              <option value="">대분류</option>
              <option value="category1">카테고리 1</option>
              <option value="category2">카테고리 2</option>
            </select>
            <select
              value={categorySub}
              onChange={(e) => onChangeCategorySub(e.target.value)}
              className="border-g400 focus:border-purple cursor-pointer appearance-none rounded-md border bg-white px-3 py-2.5 text-base focus:outline-none"
            >
              <option value="">소분류</option>
              <option value="sub1">소분류 1</option>
              <option value="sub2">소분류 2</option>
            </select>
          </div>
        </div>

        {/* 상품 설명 */}
        <div className="flex items-start">
          <label
            htmlFor="description"
            className="text-g100 w-40 flex-shrink-0 pt-3 text-base font-medium"
          >
            상품 설명
          </label>
          <div className="relative flex-1">
            <div className="field">
              <textarea
                id="description"
                placeholder="구매 시기, 하자 유무 등 최대한 자세히 설명을 적어 주세요."
                value={description}
                onChange={(e) => set("description", e.target.value)}
                className="field-input placeholder-muted h-[200px] resize-none"
                maxLength={2000}
              />
            </div>
            <div className="text-g300 text-h8 absolute right-3 bottom-2">
              {description.length}/2000
            </div>
          </div>
        </div>

        {/* 시작가, 최소 입찰 단위 */}
        <div>
          <div className="grid grid-cols-2 gap-[30px]">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="startPrice"
                className="text-g100 text-base font-medium"
              >
                시작가
              </label>
              <div className="field">
                <input
                  id="startPrice"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="시작가"
                  className="field-input placeholder-muted"
                  autoComplete="off"
                  value={startPrice ?? ""}
                  onKeyDown={onlyNum} // 숫자 키만 허용
                  onChange={(e) => set("startPrice", parseNum(e.target.value))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="minBidPrice"
                className="text-g100 text-base font-medium"
              >
                최소 입찰 단위
              </label>
              <div className="field">
                <input
                  id="minBidPrice"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="최소 입찰 단위"
                  className="field-input placeholder-muted"
                  autoComplete="off"
                  value={minBidPrice ?? ""}
                  onKeyDown={onlyNum}
                  onChange={(e) => set("minBidPrice", parseNum(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 시작, 마감일시 */}
        <div>
          <div className="grid grid-cols-2 gap-[30px]">
            {/* 시작 */}
            <div>
              <label className="text-g100 mb-4 block text-base font-medium">
                시작일시
              </label>
              <div className="flex gap-[10px]">
                {/* 날짜 */}
                <div className="field flex-[3]">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="YYYY - MM - DD"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => !e.target.value && (e.target.type = "text")}
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                  />
                </div>

                {/* 시간 */}
                <div className="field flex-[2]">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="AM  00 : 00"
                    onFocus={(e) => (e.target.type = "time")}
                    onBlur={(e) => !e.target.value && (e.target.type = "text")}
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 마감 */}
            <div>
              <label className="text-g100 mb-4 block text-base font-medium">
                마감일시
              </label>
              <div className="flex gap-[10px]">
                {/* 날짜 */}
                <div className="field flex-[3]">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="YYYY - MM - DD"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => !e.target.value && (e.target.type = "text")}
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                  />
                </div>

                {/* 시간 */}
                <div className="field flex-[2]">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="AM  00 : 00"
                    onFocus={(e) => (e.target.type = "time")}
                    onBlur={(e) => !e.target.value && (e.target.type = "text")}
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="grid grid-cols-2 gap-[30px]">
          <button
            type="button"
            className="border-purple text-purple hover:bg-light-purple cursor-pointer rounded-md border py-4 font-medium transition-colors"
            onClick={onClickCancel}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            className="bg-purple hover:bg-deep-purple cursor-pointer rounded-md py-4 font-medium text-white transition-colors disabled:opacity-60"
            onClick={onClickSubmit}
            disabled={loading}
          >
            {loading ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={2500}
        />
      )}
    </div>
  );
};

export default AuctionForm;

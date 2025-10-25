import React, { useEffect, useState } from "react";
import { Calendar, Camera } from "lucide-react";
import { useAuctionFormStore } from "../store/auctionFormStore";
import { createAuction } from "../api/auctions";
import useToast from "../../../shared/hooks/useToast";
import { validateCreateAuction } from "../utils/validation";
import Toast from "../../../shared/components/Toast";
import { useNavigate } from "react-router-dom";
import { useCategoryStore } from "../store/categoryStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

const AuctionForm = () => {
  const navigate = useNavigate();
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
    moveImageToFront,
    toRequest,
    reset,
  } = useAuctionFormStore();

  const mains = useCategoryStore((s) => s.mains);
  const subsByParent = useCategoryStore((s) => s.subsByParent);
  const loadingTop = useCategoryStore((s) => s.loadingTop);
  const loadedTop = useCategoryStore((s) => s.loadedTop);
  const loadTop = useCategoryStore((s) => s.loadTop);
  const loadSubs = useCategoryStore((s) => s.loadSubs);

  // *****파일 원본 들고 있을 로컬 상태 추가
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loadedTop) return;

    let shown = false;
    loadTop().catch((err) => {
      console.error("[Category] useEffect catch (loadTop):", err);
      if (!shown) {
        shown = true;
        showToast("카테고리를 불러오지 못했습니다.", "error");
      }
    });
  }, [loadedTop]);

  useEffect(() => {
    return () => {
      revokeAll();
      setSelectedFiles([]);
    };
  }, []);

  const onChangeCategoryMain = async (val: string) => {
    set("categoryMain", val);
    set("categorySub", "");
    set("categoryId", null);

    const parentId = Number(val);
    if (Number.isFinite(parentId)) {
      try {
        await loadSubs(parentId);
      } catch {
        showToast("소분류를 불러오지 못했습니다.", "error");
      }
    }
  };

  const onChangeCategorySub = (val: string) => {
    set("categorySub", val);
    set("categoryId", val ? Number(val) : null);
  };

  // *****파일 선택 핸들러 - 수정
  const onFilesSelected = (files: File[]) => {
    const room = Math.max(0, 10 - images.length);
    const taking = files.slice(0, room);

    if (files.length > room) {
      showToast("이미지는 최대 10장까지 가능합니다.", "error");
    }

    // 프리뷰용
    const newPreviews = taking.map((f) => ({
      imageUrl: URL.createObjectURL(f),
    }));
    set("images", [...images, ...newPreviews]);

    // 원본 파일도 보관
    setSelectedFiles((prev) => [...prev, ...taking]);
  };

  // *****추가) 인덱스 i 이미지를 첫 번째로 옮길 때, 파일 배열도 같이 이동
  const moveFileToFront = (i: number) => {
    setSelectedFiles((prev) => {
      if (i < 0 || i >= prev.length) return prev;
      const next = [...prev];
      const [hit] = next.splice(i, 1);
      next.unshift(hit);
      return next;
    });
    moveImageToFront(i); // 스토어의 프리뷰 순서도 변경
  };

  // blob URL 메모리 누수 방지(삭제/리셋 시 revoke)
  const onRemoveImage = (idx: number) => {
    const target = images[idx];
    if (target?.imageUrl.startsWith("blob:"))
      URL.revokeObjectURL(target.imageUrl);
    removeImage(idx);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const revokeAll = () => {
    images.forEach((img) => {
      if (img.imageUrl.startsWith("blob:")) URL.revokeObjectURL(img.imageUrl);
    });
  };

  const onClickCancel = () => {
    revokeAll();
    reset();
    setSelectedFiles([]);
  };

  const onClickSubmit = async () => {
    if (loading) return;

    set("startAt", startDateTime);
    set("endAt", endDateTime);

    try {
      setLoading(true);

      const payload = toRequest();

      // 도메인 유효성
      const errs = validateCreateAuction(payload, selectedFiles.length);
      if (errs.length) {
        showToast(errs[0], "error");
        return;
      }

      // 바로 폼데이터로 전송
      const form = {
        categoryId: payload.categoryId!,
        title: payload.title!,
        description: payload.description!,
        startPrice: payload.startPrice!,
        minBidPrice: payload.minBidPrice!,
        startTime: payload.startTime!,
        endTime: payload.endTime!,
      };

      await createAuction(form, selectedFiles);

      showToast("등록되었습니다.", "success");

      revokeAll();
      reset();
      setSelectedFiles([]);

      navigate("/auctions", { replace: true }); // todo 추후 경로 수정
    } catch (err: any) {
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

            {/* 썸네일 */}
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="h-24 w-24 rounded-md object-cover"
                  />
                  <div className="text-h8 mt-1 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveFileToFront(i)}
                      title="이동"
                    >
                      이동
                    </button>
                    <button type="button" onClick={() => onRemoveImage(i)}>
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
              disabled={loadingTop && !loadedTop}
            >
              <option value="">
                {loadingTop ? "불러오는 중..." : "대분류"}
              </option>
              {mains.map((m) => (
                <option key={m.categoryId} value={m.categoryId.toString()}>
                  {m.categoryName}
                </option>
              ))}
            </select>
            <select
              value={categorySub}
              onChange={(e) => onChangeCategorySub(e.target.value)}
              className="border-g400 focus:border-purple cursor-pointer appearance-none rounded-md border bg-white px-3 py-2.5 text-base focus:outline-none"
              disabled={!categoryMain}
            >
              <option value="">
                {!categoryMain
                  ? "소분류"
                  : (subsByParent[Number(categoryMain)]?.length ?? 0) > 0
                    ? "소분류"
                    : "소분류 없음"}
              </option>

              {(categoryMain
                ? (subsByParent[Number(categoryMain)] ?? [])
                : []
              ).map((s) => (
                <option key={s.categoryId} value={s.categoryId.toString()}>
                  {s.categoryName}
                </option>
              ))}
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
              <div className="field group hover:border-purple relative w-full cursor-pointer transition-colors">
                <Calendar className="text-g300 group-hover:text-purple pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transition-colors" />
                <DatePicker
                  selected={startDateTime}
                  onChange={(date) => setStartDateTime(date)}
                  showTimeSelect
                  timeIntervals={30}
                  dateFormat="yyyy-MM-dd HH:mm"
                  placeholderText="시작일시를 선택해 주세요"
                  minDate={new Date()}
                  className="w-full cursor-pointer bg-transparent pl-10 text-base focus:outline-none"
                />
              </div>
            </div>

            {/* 마감 */}
            <div>
              <label className="text-g100 mb-4 block text-base font-medium">
                마감일시
              </label>
              <div className="field group hover:border-purple relative w-full cursor-pointer transition-colors">
                <Calendar className="text-g300 group-hover:text-purple pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transition-colors" />
                <DatePicker
                  selected={endDateTime}
                  onChange={(date) => setEndDateTime(date)}
                  showTimeSelect
                  timeIntervals={30}
                  dateFormat="yyyy-MM-dd HH:mm"
                  placeholderText="마감일시를 선택해 주세요"
                  minDate={startDateTime || new Date()}
                  className="w-full cursor-pointer bg-transparent pl-10 text-base focus:outline-none"
                />
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

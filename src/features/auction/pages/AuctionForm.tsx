import React, { useEffect, useState } from "react";
import { Calendar, Camera } from "lucide-react";
import { useAuctionFormStore } from "../store/auctionFormStore";
import { createAuction } from "../api/auctions";
import useToast from "../../../shared/hooks/useToast";
import { validateCreateAuction } from "../utils/validation";
import { useNavigate } from "react-router-dom";
import { useCategoryStore } from "../store/categoryStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// 숫자 파싱
const parseNum = (s: string) => {
  const n = Number(s.replaceAll(",", "").trim());
  return Number.isFinite(n) ? n : null;
};

// 숫자 입력 가드(타이핑 중 실수 방지)
const onlyNum = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const ok =
    /[0-9]/.test(e.key) ||
    ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key);
  if (!ok) e.preventDefault();
};

const MAX_IMAGE_COUNT = 10;
const MAX_SIZE_PER_FILE = 2 * 1024 * 1024; // 2MB
const MAX_TOTAL_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

const AuctionForm = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

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

  // 파일 원본 들고 있을 로컬 상태 추가
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loadedTop) return;

    let shown = false;
    loadTop().catch((err) => {
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

  // 파일 선택 핸들러
  const onFilesSelected = (files: File[]) => {
    if (!files.length) return;

    const room = Math.max(0, MAX_IMAGE_COUNT - images.length);
    if (room <= 0) {
      showToast("이미지는 최대 10장까지 가능합니다.", "error");
      return;
    }

    const limited: File[] = [];
    let oversizedFound = false;
    const currentTotalSize = selectedFiles.reduce(
      (acc, file) => acc + file.size,
      0
    );
    let accumulatedSize = currentTotalSize;

    for (const file of files) {
      if (limited.length >= room) break;

      if (file.size > MAX_SIZE_PER_FILE) {
        oversizedFound = true;
        continue;
      }

      if (accumulatedSize + file.size > MAX_TOTAL_IMAGE_SIZE) {
        showToast("이미지 전체 용량은 20MB를 넘을 수 없습니다.", "error");
        break;
      }

      limited.push(file);
      accumulatedSize += file.size;
    }

    if (files.length > room) {
      showToast("이미지는 최대 10장까지 가능합니다.", "error");
    }

    if (oversizedFound) {
      showToast("이미지 파일당 2MB 이하로 업로드해 주세요.", "error");
    }

    if (!limited.length) return;

    const newPreviews = limited.map((f) => ({
      imageUrl: URL.createObjectURL(f),
    }));
    set("images", [...images, ...newPreviews]);

    setSelectedFiles((prev) => [...prev, ...limited]);
  };

  // 인덱스 i 이미지 첫 번째로 옮길 때 파일 배열도 같이 이동
  const moveFileToFront = (i: number) => {
    setSelectedFiles((prev) => {
      if (i < 0 || i >= prev.length) return prev;
      const next = [...prev];
      const [hit] = next.splice(i, 1);
      next.unshift(hit);
      return next;
    });
    moveImageToFront(i); // 스토어 프리뷰 순서도 변경
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

      const res = await createAuction(form, selectedFiles);
      const id = res?.auctionId;

      if (typeof id !== "number") {
        showToast("등록되었습니다.", "success");
        revokeAll();
        reset();
        setSelectedFiles([]);
        navigate("/auctions", { replace: true });
        return;
      }

      showToast("등록되었습니다.", "success");

      revokeAll();
      reset();
      setSelectedFiles([]);

      navigate(`/auctions/${id}`, { replace: true });
    } catch (err: any) {
      const msg =
        err?.message ?? err?.response?.data?.message ?? "등록에 실패했습니다.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container pt-[30px] pb-[60px]">
      <div className="flex flex-col gap-8 md:gap-[60px]">
        <h3 className="border-g400 text-g100 border-b pb-4">경매 등록</h3>

        {/* 이미지 */}
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-start md:gap-0">
          <div className="w-full md:w-40 md:flex-shrink-0">
            <label htmlFor="images" className="text-g100 text-base font-medium">
              상품 이미지
            </label>
            <span className="text-g300 text-h7"> ({images.length}/10)</span>
          </div>
          <div className="w-full flex-1">
            <label
              htmlFor="images"
              className="bg-g500 hover:bg-g400 flex h-[180px] w-full max-w-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md transition-colors md:h-[200px] md:w-[200px] md:gap-3"
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
              onChange={(e) => {
                onFilesSelected(Array.from(e.target.files ?? []));
                // 같은 파일 다시 선택할 수 있도록 value 초기화
                e.target.value = "";
              }}
            />
            <p className="text-g300 text-h7 mt-2">
              * 파일당 2MB, 전체 20MB 이하 이미지만 업로드할 수 있습니다.
            </p>

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
                    <button
                      className="text-red"
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
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
          <label
            htmlFor="productName"
            className="text-g100 w-full text-base font-medium md:w-40 md:flex-shrink-0"
          >
            상품명
          </label>
          <div className="flex-1">
            <div className="field">
              <input
                id="productName"
                type="text"
                placeholder="상품명을 입력해 주세요 (최대 50자)"
                value={title}
                onChange={(e) => set("title", e.target.value)}
                className="field-input placeholder-muted"
                autoComplete="off"
                maxLength={50}
              />
            </div>
          </div>
        </div>

        {/* 카테고리 */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
          <label className="text-g100 w-full text-base font-medium md:w-40 md:flex-shrink-0">
            카테고리
          </label>
          <div className="grid flex-1 grid-cols-1 gap-[10px] md:grid-cols-2">
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
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-0">
          <label
            htmlFor="description"
            className="text-g100 w-full pt-3 text-base font-medium md:w-40 md:flex-shrink-0"
          >
            상품 설명
          </label>
          <div className="relative flex-1">
            <div className="field">
              <textarea
                id="description"
                placeholder="상품 상태, 하자 유무, 구매 시기 등 설명을 적어 주세요 (최대 2000자)"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-[30px]">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-[30px]">
            {/* 시작 */}
            <div>
              <label className="text-g100 mb-2 block text-base font-medium md:mb-4">
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
              <label className="text-g100 mb-2 block text-base font-medium md:mb-4">
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-[30px]">
          <button
            type="button"
            className="border-purple text-purple hover:bg-light-purple cursor-pointer rounded-md border py-3 font-medium transition-colors md:py-4"
            onClick={onClickCancel}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            className="bg-purple hover:bg-deep-purple cursor-pointer rounded-md py-3 font-medium text-white transition-colors disabled:opacity-60 md:py-4"
            onClick={onClickSubmit}
            disabled={loading}
          >
            {loading ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionForm;

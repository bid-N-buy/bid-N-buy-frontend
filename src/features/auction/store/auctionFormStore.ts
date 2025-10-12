import { create } from "zustand";
import type { CreateAuctionReq, ImageType } from "../types/auctions";
import { toLocalKst } from "../../../shared/utils/datetime";

type Img = { imageUrl: string; imageType: ImageType };

type FormState = {
  title: string;
  description: string;
  categoryMain: string; // 화면용
  categorySub: string;
  categoryId: number | null; // 서버용 최종 ID (선택 완료 시 채움)

  startPrice: number | null;
  minBidPrice: number | null;
  startAt: Date | null;
  endAt: Date | null;

  images: Img[];
};

type Actions = {
  set<K extends keyof FormState>(k: K, v: FormState[K]): void;
  addImage(img: Img): void;
  removeImage(i: number): void;
  setMainImage(i: number): void; // i번째를 MAIN, 나머지 DETAIL
  toRequest(): CreateAuctionReq; // dto 변환
  reset(): void;
};

const initial: FormState = {
  title: "",
  description: "",
  categoryMain: "",
  categorySub: "",
  categoryId: null,
  startPrice: null,
  minBidPrice: null,
  startAt: null,
  endAt: null,
  images: [],
};

export const useAuctionFormStore = create<FormState & Actions>((set, get) => ({
  ...initial,

  set: <K extends keyof FormState>(k: K, v: FormState[K]) =>
    set((s) => ({ ...s, [k]: v })),

  addImage: (img) => set((s) => ({ images: [...s.images, img] })),
  removeImage: (idx) =>
    set((s) => ({ images: s.images.filter((_, i) => i !== idx) })),
  setMainImage: (idx) =>
    set((s) => ({
      images: s.images.map((it, i) => ({
        ...it,
        imageType: i === idx ? "MAIN" : "DETAIL",
      })),
    })),

  toRequest: () => {
    const s = get();
    if (!s.images || s.images.length < 1)
      throw new Error("이미지를 등록해 주세요.");
    if (!s.title || !s.title.trim()) throw new Error("상품명을 입력해 주세요.");
    if (s.categoryId == null) throw new Error("카테고리를 선택해 주세요.");
    if (!s.description || !s.description.trim())
      throw new Error("상품 설명을 입력해 주세요.");
    if (s.startPrice == null || s.startPrice <= 0)
      throw new Error("시작가를 입력해 주세요.");
    if (s.minBidPrice == null || s.minBidPrice <= 0)
      throw new Error("최소 입찰 단위를 입력해 주세요.");
    if (!s.startAt || !s.endAt)
      throw new Error("시작/마감 일시를 입력해 주세요.");

    return {
      categoryId: s.categoryId,
      title: s.title.trim(),
      description: s.description.trim(),
      startPrice: s.startPrice,
      minBidPrice: s.minBidPrice,
      startTime: toLocalKst(s.startAt),
      endTime: toLocalKst(s.endAt),
      images: s.images,
    };
  },

  reset: () => set(initial),
}));

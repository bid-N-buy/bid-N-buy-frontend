import { create } from "zustand";
import type { CreateAuctionForm } from "../types/auctions";
import { toLocalKst } from "../../../shared/utils/datetime";

// 이미지 순서 관리 (프리뷰용)
type UiImg = { imageUrl: string };

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

  images: UiImg[]; // 미리보기 blob url 목록 (전송용x)
};

type Actions = {
  set<K extends keyof FormState>(k: K, v: FormState[K]): void;
  addImage(img: UiImg): void;
  removeImage(i: number): void;
  moveImageToFront(i: number): void; // 임의 이미지 맨 앞으로 (대표로)
  toRequest(): CreateAuctionForm; // dto 변환
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

  moveImageToFront: (idx) =>
    set((s) => {
      const next = [...s.images];
      const [picked] = next.splice(idx, 1);
      if (picked) next.unshift(picked);
      return { images: next };
    }),

  toRequest: (): CreateAuctionForm => {
    const s = get();

    // ui상 검증 (실제 전송은 컴포넌트에서)
    if (!s.images || s.images.length < 1) {
      throw new Error("이미지를 등록해 주세요.");
    }
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

    // 검증했으니까 not null 보장
    const categoryId = s.categoryId as number;
    const startPrice = s.startPrice as number;
    const minBidPrice = s.minBidPrice as number;
    const startAt = s.startAt as Date;
    const endAt = s.endAt as Date;

    // 서버 업로드 방식 - images는 dto에 포함x
    return {
      categoryId,
      title: s.title.trim(),
      description: s.description.trim(),
      startPrice,
      minBidPrice,
      startTime: toLocalKst(startAt),
      endTime: toLocalKst(endAt),
    };
  },

  reset: () => set(() => ({ ...initial })),
}));

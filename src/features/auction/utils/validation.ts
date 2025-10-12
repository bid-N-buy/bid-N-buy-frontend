import type { CreateAuctionReq } from "../types/auctions";

const isPositiveInt = (n: number) => Number.isInteger(n) && n > 0;

export function validateCreateAuction(p: CreateAuctionReq) {
  const errs: string[] = [];

  if (!p.title?.trim()) errs.push("상품명을 입력해 주세요.");
  if (!p.description?.trim()) errs.push("상품 설명을 입력해 주세요.");
  if (!Number.isFinite(p.categoryId) || p.categoryId <= 0)
    errs.push("카테고리를 선택해 주세요.");

  if (!isPositiveInt(p.startPrice))
    errs.push("시작가는 1 이상의 정수여야 합니다.");
  if (!isPositiveInt(p.minBidPrice))
    errs.push("최소 입찰 단위는 1 이상의 정수여야 합니다.");

  const st = new Date(p.startTime).getTime();
  const et = new Date(p.endTime).getTime();
  if (!(st < et)) errs.push("마감일시는 시작일시보다 뒤여야 합니다.");

  const len = p.images?.length ?? 0;
  if (len < 1) errs.push("이미지를 최소 1장 등록해 주세요.");
  if (len > 10) errs.push("이미지는 최대 10장까지 등록할 수 있습니다.");

  const mainCnt = p.images.filter((i) => i.imageType === "MAIN").length;
  if (mainCnt !== 1) errs.push("대표(MAIN) 이미지는 정확히 1장이어야 합니다.");

  // 로컬...
  if (p.images.some((i) => !/^(https?:\/\/|blob:|data:)/.test(i.imageUrl))) {
    errs.push("이미지 URL 형식이 올바르지 않습니다.");
  }

  return errs;
}

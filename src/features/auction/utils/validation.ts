import type { CreateAuctionForm } from "../types/auctions";

const isPositiveInt = (n: number) => Number.isInteger(n) && n > 0;

export function validateCreateAuction(
  p: CreateAuctionForm,
  imageCount: number,
  maxImages = 10
) {
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
  if (!Number.isFinite(st) || !Number.isFinite(et)) {
    errs.push("시작/마감일시 형식이 올바르지 않습니다.");
  } else if (!(st < et)) {
    errs.push("마감일시는 시작일시보다 뒤여야 합니다.");
  }
  // todo 생성일시 < 시작일시 검증 추가

  if (imageCount < 1) errs.push("최소 1장 이미지를 등록해 주세요.");
  if (imageCount > maxImages)
    errs.push(`이미지는 최대 ${maxImages}장까지 등록할 수 있습니다.`);

  return errs;
}

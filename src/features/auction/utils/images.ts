import type { ImageType } from "../types/auctions";

export type Img = { imageUrl: string; imageType: ImageType };

export function ensureSingleMain(images: Img[]): Img[] {
  if (!images.length) return images;
  const firstMainIdx = images.findIndex((i) => i.imageType === "MAIN");
  const mainIdx = firstMainIdx >= 0 ? firstMainIdx : 0; // 없으면 0번째를 MAIN으로
  return images.map((it, i) => ({
    ...it,
    imageType: i === mainIdx ? "MAIN" : "DETAIL",
  }));
}

export function capToTen(images: Img[]): Img[] {
  return images.slice(0, 10);
}

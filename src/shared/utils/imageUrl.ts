const FILE_BASE = import.meta.env.VITE_FILE_BASE ?? "";

export const buildImageUrl = (url?: string | null): string | null => {
  if (!url) return null;

  // 절대 URL, data:, blob: 은 그대로 사용
  if (
    /^(https?:)?\/\//i.test(url) ||
    /^data:/i.test(url) ||
    /^blob:/i.test(url)
  ) {
    return url;
  }

  if (!FILE_BASE) return url;

  return FILE_BASE.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
};

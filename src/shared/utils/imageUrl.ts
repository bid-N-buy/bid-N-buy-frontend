const S3_HOST = "bid-1024-aws-prac.s3.ap-northeast-2.amazonaws.com";

const IMAGE_BASE = (
  import.meta.env.VITE_IMAGE_BASE_URL ??
  import.meta.env.VITE_FILE_BASE ??
  ""
).replace(/\/$/, "");

export const buildImageUrl = (url?: string | null): string | null => {
  if (!url) return null;

  // data:, blob: 은 그대로 사용
  if (/^data:/i.test(url) || /^blob:/i.test(url)) {
    return url;
  }

  // s3 -> cloudfront url 변환
  if (IMAGE_BASE && url.includes(S3_HOST)) {
    const pathStart = url.indexOf(S3_HOST) + S3_HOST.length;
    return IMAGE_BASE + url.slice(pathStart);
  }

  // 절대 url은 그대로
  if (/^(https?:)?\/\//i.test(url)) {
    return url;
  }

  // 상대 경로 IMAGE_BASE 앞에 붙이기
  if (!IMAGE_BASE) return url;

  return IMAGE_BASE + "/" + url.replace(/^\//, "");
};

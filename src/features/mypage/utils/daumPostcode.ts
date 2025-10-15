export function loadDaumPostcode(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있으면 패스
    if ((window as any).daum?.postcode) {
      resolve();
      return;
    }

    // 중복 로딩 방지
    const EXISTING = document.querySelector<HTMLScriptElement>(
      'script[data-daum-postcode="true"]'
    );
    if (EXISTING) {
      EXISTING.addEventListener("load", () => resolve());
      EXISTING.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-daum-postcode", "true");
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

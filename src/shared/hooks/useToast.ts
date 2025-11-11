// import { useState } from "react";

// interface ToastState {
//   isVisible: boolean;
//   message: string;
//   type: "success" | "error";
// }

// const useToast = () => {
//   const [toast, setToast] = useState<ToastState>({
//     isVisible: false,
//     message: "",
//     type: "success",
//   });

//   const showToast = (
//     message: string,
//     type: "success" | "error" = "success"
//   ) => {
//     setToast({
//       isVisible: true,
//       message,
//       type,
//     });
//   };

//   const hideToast = () => {
//     setToast((prev) => ({ ...prev, isVisible: false }));
//   };

//   return { toast, showToast, hideToast };
// };

// export default useToast;

// useToast.ts (기존 파일)

import { useToastStore } from "../store/useToastStore";
import { useShallow } from "zustand/react/shallow"; // 성능 최적화를 위해 사용

const useToast = () => {
  // 💡 [핵심] Store의 필요한 상태만 추출하되, shallow 비교로 불필요한 재렌더링 방지
  const toastState = useToastStore(
    useShallow((state) => ({
      isVisible: state.isVisible,
      message: state.message,
      type: state.type,
    }))
  );

  // 💡 [핵심] Store의 액션 함수들을 가져옵니다.
  const showToast = useToastStore((state) => state.showToast);
  const hideToast = useToastStore((state) => state.hideToast);

  // 💡 기존의 반환 형식과 똑같이 객체를 구성하여 반환합니다.
  return {
    toast: toastState, // 이름이 'toast'인 객체로 맵핑
    showToast,
    hideToast,
  };
};

export default useToast;

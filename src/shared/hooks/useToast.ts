import { useToastStore } from "../store/useToastStore";
import { useShallow } from "zustand/react/shallow";

const useToast = () => {
  // store의 필요한 상태만 추출하되 shallow 비교로 불필요한 재렌더링 방지
  const toastState = useToastStore(
    useShallow((state) => ({
      isVisible: state.isVisible,
      message: state.message,
      type: state.type,
    }))
  );

  // store의 액션 함수들 가져옴
  const showToast = useToastStore((state) => state.showToast);
  const hideToast = useToastStore((state) => state.hideToast);

  // 기존 반환 형식 같이 객체 구성해 반환
  return {
    toast: toastState,
    showToast,
    hideToast,
  };
};

export default useToast;

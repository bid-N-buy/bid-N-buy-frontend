// hooks/useInitialChatLoad.ts 파일 생성

import { useEffect, useState } from "react";
import { useAuthInit } from "../../features/auth/hooks/UseAuthInit"; // 고객님의 인증 훅 경로
import { useAuthStore } from "../../features/auth/store/authStore";
import { useChatModalStore } from "../../shared/store/ChatModalStore"; // 고객님의 스토어 경로
import api from "../../shared/api/axiosInstance";

export const useInitialUnreadCount = () => {
  // 💡 1. 로컬 상태: 초기 로드 완료 플래그
  // const [initialLoadDone, setInitialLoadDone] = useState(false);

  // 2. 전역 상태/훅: 인증 및 채팅 스토어
  const { ready } = useAuthInit();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setChatList = useChatModalStore((s) => s.setChatList);

  // 3. 로그인 여부
  const isAuthed = ready && Boolean(accessToken);

  useEffect(() => {
    // 💡 [실행 조건] 인증 완료 && 토큰 유효 && 아직 로드되지 않음
    if (!isAuthed) {
      return;
    }
    console.log("실행중?");
    const fetchInitialUnreadCounts = async () => {
      try {
        const response = await api.get("/chatrooms/list", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log("리스트 갖고오기");

        setChatList(response.data);
        console.log("리스트 설정 완료");
      } catch (error) {
        // 401 오류는 isAuthed가 false일 때 걸러지지만, 다른 오류 발생 시
        // 재시도 루프를 막기 위해 플래그를 설정하는 것도 고려할 수 있습니다.
        console.error("초기 unreadCount 로드 실패:", error);
        // setInitialLoadDone(true); // 재시도를 막으려면 주석 해제
      }
    };

    fetchInitialUnreadCounts();

    // 5. 의존성 배열: isAuthed와 플래그만 확인
    //    setChatList는 Zustand 함수로 안정적이므로 제외 (최대한 의존성 줄이기)
  }, [isAuthed, accessToken, setChatList]);

  // 훅 자체는 아무것도 반환할 필요가 없습니다. (전역 상태에 결과를 저장했으므로)
};

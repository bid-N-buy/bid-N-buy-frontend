export interface ChatModalProps {
  // 모달을 닫기 위해 부모로부터 받는 함수
  // 이 함수는 아무런 인자도 받지 않고 (()) 아무것도 반환하지 않습니다 (void).
  onClose: () => void;
}

export interface Chat {
  user_id: bigint;
  nickname: string;
  image_url: string;
  chatroom_id: bigint;
  message: string;
}

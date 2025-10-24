import { requestFcmToken } from "../../../shared/hooks/useFcmToken";

function NotificationTestPage() {
  const handleClick = async () => {
    const token = await requestFcmToken();
    alert(`토큰: ${token}`);
  };

  return (
    <div>
      <h1>알림 테스트</h1>
      <button onClick={handleClick}>알림 권한 요청 & 토큰 발급</button>
    </div>
  );
}

export default NotificationTestPage;

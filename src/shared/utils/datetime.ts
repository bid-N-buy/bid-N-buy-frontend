// 화면용 (2025. 10. 13. 12:00)
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}. ${month}. ${day}. ${hours}:${minutes}`;
}; // 사용 시 formatDate("2025-10-13T12:00:00"); 이렇게

// 채팅용 시간 나타내는 함수: 당일은 시간, 지나간 날짜는 시일으로 표시
export const formatTime = (dateString: string) => {
  const thisDate = new Date(dateString);
  // const now = new Date();

  // 날짜만 비교하기 위해 시, 분, 초, 밀리초를 0으로 설정
  // const thisDay = new Date(
  //   thisDate.getFullYear(),
  //   thisDate.getMonth(),
  //   thisDate.getDate()
  // );
  // const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 서버에서 UTC 기준으로 보낼 때 한국 기준으로 바꾸기
  const kstTime = thisDate.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstTime);
  const thisDayKst = new Date(
    kstDate.getFullYear(),
    kstDate.getMonth(),
    kstDate.getDate()
  );
  // 오늘 날짜인지 확인
  // const isToday = thisDay.getTime() === today.getTime();
  const isToday = kstDate.getTime() === thisDayKst.getTime();

  if (isToday) {
    // 오늘 날짜인 경우: 오전/오후 - 시간:분 형식
    // return thisDate.toLocaleTimeString("ko-KR", {
    return kstDate.toLocaleTimeString("ko-KR", {
      // UTC 기준일 때
      // UTC 기준일 때
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // 오전/오후 표시
    });
  } else {
    // 오늘이 아닌 경우: 월-일 형식
    const month = (thisDate.getMonth() + 1).toString().padStart(2, "0");
    const day = thisDate.getDate().toString().padStart(2, "0");
    return `${month}.${day}`;
  }
};

// 전송용 (YYYY-MM-DDTHH:mm:ss)
export const toLocalKst = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}; // toLocalKst(new Date());

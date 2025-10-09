// 시간 표시 함수
export const formatTime = (dateString: string): string => {
  // ISO 문자열을 Date 객체로 변환
  const thisDate = new Date(dateString);
  const now = new Date();

  // 날짜만 비교하기 위해 시, 분, 초, 밀리초를 0으로 설정
  const thisDay = new Date(
    thisDate.getFullYear(),
    thisDate.getMonth(),
    thisDate.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 오늘 날짜인지 확인
  const isToday = thisDay.getTime() === today.getTime();

  if (isToday) {
    // 오늘 날짜인 경우: 오전/오후 - 시간:분 형식
    return thisDate.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // 오전/오후 표시
    });
  } else {
    // 오늘이 아닌 경우: 월-일 형식
    const month = (thisDate.getMonth() + 1).toString().padStart(2, "0");
    const day = thisDate.getDate().toString().padStart(2, "0");
    return `${month}-${day}`;
  }
};

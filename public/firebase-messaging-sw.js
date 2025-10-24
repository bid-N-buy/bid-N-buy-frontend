// 2. 서비스 워커(백그라운드 알림)

/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBHNda0bxCoclqplF8PuM2Ck6-ayD_8PYg",
  projectId: "bid-n-buy-9669a",
  messagingSenderId: "118154895167",
  appId: "1:118154895167:web:0c68602f7fcd7be4563d8a",
});

const messaging = firebase.messaging();

// 백그라운드에서 메시지 수신할 때
messaging.onBackgroundMessage((payload) => {
  console.log("📩 백그라운드 메시지 수신:", payload);

  const notificationTitle = payload.notification?.title || "알림";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "src/assets/img/Bid&Buy.png", // 필요시 변경
    data: payload.data || {}, // 클릭 시 데이터 전달 가능
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 핸들링 (선택)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/") // 원하는 경로로 이동
  );
});


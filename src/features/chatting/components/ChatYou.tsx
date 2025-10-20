import React from "react";
import Avatar from "../../../shared/components/Avatar";
import type { ChatYouProps } from "../types/ChatType";
import { useAuthStore } from "../../auth/store/authStore";
//토스페이먼츠
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

// TODO: 추후 배포단계에서 .env로 옮길 예정
const clientKey = "test_ck_DpexMgkW36PwLbonEpqwrGbR5ozO";

const ChatYou = ({
  msgInfo,
  counterpartInfo,
  sellerId,
  currentPrice,
  auctionInfo,
}: ChatYouProps) => {
  const { message, messageType, read, createdAt } = msgInfo;
  const { counterpartNickname, counterpartProfileImageUrl } = counterpartInfo;
  const { auctionImageUrl, auctionTitle , chatroomId} = auctionInfo;
  const { userId, profile } = useAuthStore.getState();

  // 결제 실행 함수
  async function handlePayment() {
    sessionStorage.setItem("prevPage", window.location.pathname);
    try {
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({
        customerKey: generateRandomString(),
      });

      // 백엔드에 주문 생성 (buyerId는 현재 로그인 유저)
      const orderResponse = await fetch("http://localhost:8080/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          buyerId: userId,
          type: "ESCROW",
        }),
      });

      if (!orderResponse.ok) throw new Error("Order 생성 실패");
      const orderData = await orderResponse.json();
      const orderId = orderData.orderId;

      // 금액 저장
      const merchantOrderId = "ORDER_" + Date.now();
      await fetch("http://localhost:8080/payments/saveAmount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          merchantOrderId,
          amount: currentPrice,
        }),
      });

      // 결제창 실행
       const result = await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: currentPrice },
        orderId: merchantOrderId,
        orderName: auctionTitle,
        successUrl: window.location.origin + "/payment/bridge",
        failUrl: window.location.origin + "/payment/bridge",
        customerEmail: profile?.email,
        customerName: profile?.nickname 
      });
    } catch (err) {
      console.error("결제 요청 실패:", err);
    }
  }

  return messageType === "CHAT" && sellerId === userId ? (
    <div className="mx-2 my-4 flex gap-2">
      <Avatar imageUrl={counterpartProfileImageUrl} />
      <div>
        <p className="mb-2 font-bold">{counterpartNickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <div>
            <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
            <p className="text-g300 text-xs">
              {new Date(createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : messageType === "REQUEST" ? (
    <div className="mx-2 my-4 flex gap-2">
      <Avatar imageUrl={counterpartProfileImageUrl} />
      <div>
        <p className="mb-2 font-bold">{counterpartNickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">
            <div className="flex gap-2">
              <img
                src={auctionImageUrl ? auctionImageUrl : ""}
                alt={`${auctionTitle}의 메인 이미지`}
                className="size-15"
              />
              <div className="text-left">
                <p className="font-bold">{auctionTitle}</p>
                <p className="text-g300">{currentPrice.toString()} 원</p>
              </div>
            </div>
            <hr className="bg-g300 my-2 h-[1px] border-0" />
            <div>
              {message}
              <div>
                <button
                  type="button"
                  onClick={handlePayment}
                  className="bg-purple mt-2 w-full cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium text-white"
                >
                  결제하기
                </button>
              </div>
            </div>
          </p>
          <div>
            <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
            <p className="text-g300 text-xs">
              {new Date(createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="mx-2 my-4 flex gap-2">
      <Avatar imageUrl={counterpartProfileImageUrl} />
      <div>
        <p className="mb-2 font-bold">{counterpartNickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <div>
            <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
            <p className="text-g300 text-xs">
              {new Date(createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function generateRandomString() {
  return window.btoa(Math.random().toString()).slice(0, 20);
}

export default ChatYou;

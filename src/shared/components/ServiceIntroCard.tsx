import React from "react";
import { Zap, Shield, Ampersand } from "lucide-react";

const ServiceIntroCard = () => {
  return (
    <div className="bg-purple/7 flex min-h-[500px] flex-col rounded-3xl p-8">
      {/* 헤더 */}
      <div className="mb-8 grid grid-cols-[64px_1fr] items-center gap-3">
        <div className="flex justify-center">
          <div className="bg-purple/12 flex h-14 w-14 items-center justify-center rounded-full">
            <Ampersand className="text-purple h-7 w-7" />
          </div>
        </div>
        <h4 className="text-h4 font-bold">서비스 소개</h4>
      </div>

      <div className="mb-6 grid grid-cols-[64px_1fr] gap-3">
        <div className="flex items-start justify-center pt-[4px]">
          <Ampersand className="h-6 w-6" />
        </div>
        <div>
          <p className="mb-2 font-bold">Bid&Buy 란?</p>
          <p className="text-g200 text-h7 leading-relaxed">
            기존 중고거래의 고정가 방식과 전문 경매의 높은 진입장벽 사이,
            <br />
            누구나 부담 없이 참여할 수 있는 "일상 속 경매 경험"을 제공합니다.
            <br />
            Bid&Buy 는 중고거래에 경매 방식을 결합한 차별화된 플랫폼입니다.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[64px_1fr] gap-3">
        <div className="flex items-start justify-center pt-[4px]">
          <Zap className="h-6 w-6" />
        </div>
        <div>
          <p className="mb-2 font-bold">실시간 소통·알림</p>
          <p className="text-g200 text-h7 leading-relaxed">
            실시간 채팅으로 빠르고 편리하게 판매자와 소통할 수 있습니다.
            <br />
            경매 결과도 실시간 알림으로 바로바로 받아볼 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[64px_1fr] gap-3">
        <div className="flex items-start justify-center pt-[4px]">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <p className="mb-2 font-bold">안전한 거래 환경</p>
          <p className="text-g200 text-h7 leading-relaxed">
            안전결제(에스크로) 시스템으로 믿을 수 있는 거래 환경을 제공합니다.
            <br />
            걱정 없이 안심하고, 편리하게 이용하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceIntroCard;

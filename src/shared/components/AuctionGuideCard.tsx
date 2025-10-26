import React from "react";
import { FileText, Package, Gavel, AlertCircle } from "lucide-react";

const AuctionGuideCard = () => {
  return (
    <div className="bg-g500/70 flex min-h-[500px] flex-col rounded-3xl p-8">
      {/* 헤더 */}
      <div className="mb-8 grid grid-cols-[64px_1fr] items-center gap-3">
        <div className="flex justify-center">
          <div className="bg-light-purple flex h-14 w-14 items-center justify-center rounded-full">
            <FileText className="text-purple h-7 w-7" />
          </div>
        </div>
        <h4 className="text-h4 font-bold">경매 가이드</h4>
      </div>

      <div className="mb-6 grid grid-cols-[64px_1fr] gap-3">
        <div className="flex items-start justify-center pt-[4px]">
          <Package className="h-6 w-6" />
        </div>
        <div>
          <p className="mb-2 font-bold">상품 등록</p>
          <p className="text-g200 text-h7 leading-relaxed">
            상품 이미지, 상품명, 카테고리, 상품 설명을 입력하세요.
            <br />
            시작가, 최소 입찰 단위, 시작·마감일시를 직접 설정할 수 있습니다.
            <br />
            설정한 시작일시에 맞춰 경매가 자동으로 시작됩니다.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[64px_1fr] gap-3">
        <div className="flex items-start justify-center pt-[4px]">
          <Gavel className="h-6 w-6" />
        </div>
        <div>
          <p className="mb-2 font-bold">입찰 참여</p>
          <p className="text-g200 text-h7 leading-relaxed">
            입찰 가능 금액을 확인한 다음 원하는 금액으로 입찰하세요.
            <br />
            마감일시 기준 가장 높은 금액을 제시한 회원이 낙찰됩니다.
            <br />
            (입찰은 한 번 참여하면 취소할 수 없으며, 낙찰 후 미결제 시 페널티가
            부과될 수 있습니다.)
          </p>
        </div>
      </div>

      {/* 경고 */}
      <div className="bg-red/5 border-red/20 mt-auto mb-1 flex gap-3 rounded-2xl border p-4">
        <AlertCircle className="text-red h-5 w-5 flex-shrink-0" />
        <p className="text-red text-h8 leading-relaxed">
          허위 상품 등록, 비정상적 입찰 등 거래 행위와 부적절한 표현 기타 위법
          소지가 있는 행위는 서비스 이용 제재 대상이 될 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default AuctionGuideCard;

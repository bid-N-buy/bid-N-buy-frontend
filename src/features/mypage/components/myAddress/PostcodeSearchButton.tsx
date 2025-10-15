import React from "react";
import { loadDaumPostcode } from "../../utils/daumPostcode";

type Props = {
  className?: string;
  onSelected: (v: {
    zonecode: string; // 우편번호
    address: string; // 도로명 (기본주소)
    jibunAddress?: string;
    buildingName?: string;
  }) => void;
};

const PostcodeSearchButton: React.FC<Props> = ({ className, onSelected }) => {
  const openPostcode = async () => {
    try {
      await loadDaumPostcode();
      const { daum } = window as any;

      new daum.Postcode({
        oncomplete: (data: any) => {
          // data.address: 도로명주소, data.zonecode: 5자리 우편번호
          onSelected({
            zonecode: data.zonecode,
            address: data.address,
            jibunAddress: data.jibunAddress,
            buildingName: data.buildingName,
          });
        },
        // 팝업 대신 레이어로 쓰고 싶으면 onresize 사용 가능
      }).open(); // .open()은 기본 팝업; .embed(container)로 레이어도 가능
    } catch (e) {
      alert("주소 검색 스크립트를 불러오지 못했습니다.");
    }
  };

  return (
    <button
      type="button"
      onClick={openPostcode}
      className={className ?? "rounded-md border px-2 py-1 text-sm"}
    >
      주소 검색
    </button>
  );
};

export default PostcodeSearchButton;

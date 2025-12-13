import { useEffect, useState } from "react";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatProductInfoProps } from "../types/ChatType";
import ChatAddressModal from "./ChatAddressModal";
import type { Address } from "../../mypage/types/address";
import api from "../../../shared/api/axiosInstance";

const ChatProductInfo = ({
  sellerId,
  auctionInfo,
  currentPrice,
  sellingStatus,
  handleSendPaymentRequest,
  handleSendAddress,
}: ChatProductInfoProps) => {
  const { auctionId, auctionImageUrl, auctionTitle, counterpartId } =
    auctionInfo;
  const userId = useAuthStore.getState().userId;
  const buyerId = userId === sellerId ? counterpartId : userId;

  // 주소 모달
  const [mainAddress, setMainAddress] = useState<Address | null>(null);
  const [addrLoading, setAddrLoading] = useState<boolean>(true);
  const [addrSaving, setAddrSaving] = useState<boolean>(false);
  const [addrError, setAddrError] = useState<any>(null);
  const [addrOpen, setAddrOpen] = useState<boolean>(false);

  // 메시지 (토스트)
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const toast = (ok: string | null, error: string | null) => {
    setMsg(ok);
    setErr(error);
    window.setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, 2200);
  };

  useEffect(() => {
    const fetchMainAddress = async () => {
      try {
        setAddrLoading(true);

        const res = await api.get("/address", {
          withCredentials: true,
          validateStatus: (s) => s >= 200 && s < 500,
        });

        const data = res.data;

        // 서버 응답 모양 다 커버: 배열 / 단일 / data 래핑
        const rawAddr = Array.isArray(data)
          ? data[0]
          : data?.name
            ? data
            : data?.data
              ? data.data
              : data?.address
                ? data.address
                : null;

        if (rawAddr) {
          setMainAddress({
            name: rawAddr.name ?? "",
            phoneNumber: rawAddr.phoneNumber ?? "",
            zonecode: rawAddr.zonecode ?? "",
            address: rawAddr.address ?? "",
            detailAddress: rawAddr.detailAddress ?? "",
            addressId: rawAddr.addressId,
          });
        } else {
          setMainAddress(null);
        }
      } catch (e) {
        console.error("대표 주소 로딩 실패:", e);
        setAddrError(e ?? e);
        setMainAddress(null);
      }
    };

    if (userId) {
      fetchMainAddress();
    }
  }, [userId]);

  const handleSaveAddress = async (draft: Address) => {
    try {
      setAddrSaving(true);

      const addressId = draft.addressId;
      const isUpdate = !!addressId;

      const body = {
        name: draft.name,
        phoneNumber: draft.phoneNumber,
        zonecode: draft.zonecode,
        address: draft.address,
        detailAddress: draft.detailAddress ?? "",
      };

      let response;
      if (isUpdate) {
        response = await api.put(`/address/${addressId}`, body, {
          withCredentials: true,
        });
      } else {
        response = await api.post("/address", body, {
          withCredentials: true,
        });
      }

      const newAddressId = response.data?.addressId;

      setMainAddress({
        name: body.name,
        phoneNumber: body.phoneNumber,
        zonecode: body.zonecode,
        address: body.address,
        detailAddress: body.detailAddress,
        addressId: isUpdate ? addressId : newAddressId,
      });

      const formattedAddress = `${body.name} / ${body.phoneNumber} / (${body.zonecode}) ${body.address} ${body.detailAddress}`;

      if (!isUpdate) {
        toast(response?.data?.message ?? "주소가 저장되었습니다.", null);
      }

      handleSendAddress(formattedAddress);
      setAddrOpen(false);
    } catch (e: any) {
      console.error("주소 정보를 저장하지 못했습니다.", e);
      const m =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        "주소 정보를 저장하지 못했습니다.";
      toast(null, m);
    } finally {
      setAddrSaving(false);
    }
  };

  return (
    <div
      key={auctionId}
      className="bg-light-purple flex h-[102px] justify-between gap-2 p-4"
    >
      <div className="bg-g300 size-15">
        <img
          className="size-full"
          src={auctionImageUrl ? auctionImageUrl : ""}
        />
      </div>
      <div
        className={`flex flex-col gap-1 text-sm ${
          !currentPrice
            ? `w-[85%] md:w-[80%]`
            : `min-w-[60%] md:w-[60%] lg:w-[72%]`
        }`}
      >
        <p className="text-xs">{sellingStatus}</p>
        <p className="font-bold">
          {auctionTitle!.substring(0, 18)}
          {auctionTitle!.length > 18 ? "..." : null}
        </p>
        <p className="text-g300">
          {currentPrice ? currentPrice!.toString() : "삭제된 품목입니다."}
        </p>
      </div>
      {!currentPrice ? null : (
        <div className="flex w-[23%] min-w-[15%] flex-col gap-2 md:w-[15%]">
          {userId === sellerId ? (
            <button
              type="button"
              onClick={() =>
                handleSendPaymentRequest(
                  auctionId!,
                  buyerId!,
                  sellerId!,
                  currentPrice!
                )
              }
              className="bg-purple w-full cursor-pointer rounded-md px-2 py-1.5 text-xs text-white"
            >
              결제 요청
            </button>
          ) : (
            <>
              <button
                type="button"
                className="bg-purple w-full rounded-md px-2 py-1.5 text-xs text-white"
                onClick={() => {
                  setAddrOpen(true);
                }}
              >
                주소 입력
              </button>
            </>
          )}
        </div>
      )}
      <ChatAddressModal
        open={addrOpen}
        initial={mainAddress}
        saving={addrSaving}
        onClose={() => {
          setAddrOpen(false);
        }}
        onSave={handleSaveAddress}
      />
    </div>
  );
};

export default ChatProductInfo;

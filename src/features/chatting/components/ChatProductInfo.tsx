import type { ChatProductInfoProps } from "../types/ChatType";
import { useAuthStore } from "../../auth/store/authStore";

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

  return (
    <div
      key={auctionId}
      className="bg-light-purple flex justify-between gap-2 p-4"
    >
      <div className="bg-g300 size-15">
        <img
          className="size-full"
          src={auctionImageUrl ? auctionImageUrl : ""}
        />
      </div>
      <div
        className={
          currentPrice
            ? "w-[80%]"
            : "flex min-w-[60%] flex-col gap-1 text-sm md:w-[60%] lg:w-[72%]"
        }
      >
        <p className="text-xs">{sellingStatus}</p>
        <p className="font-bold">
          {auctionTitle!.substring(0, 18)}
          {auctionTitle!.length > 18 ? "..." : null}
        </p>
        <p className="text-g300">{currentPrice && currentPrice!.toString()}</p>
      </div>
      {currentPrice && (
        <div className="flex w-[23%] min-w-[15%] flex-col gap-2 md:w-[15%]">
          {userId === sellerId && (
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
          )}
          {userId !== sellerId && (
            <>
              <button
                type="button"
                className="bg-purple w-full rounded-md px-2 py-1.5 text-xs text-white"
                onClick={() => {
                  handleSendAddress(auctionId!, buyerId!, sellerId!);
                }}
              >
                주소 입력
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatProductInfo;

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuctionDetailStore } from "../../auction/store/auctionDetailStore";
import { formatDate } from "../../../shared/utils/datetime";
import ProductImage from "../../auction/components/ProductImage";
import { useAdminAuthStore } from "../store/adminStore";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";
import { adminDeleteAuction } from "../api/admin";

const AdminAuctionPost = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const adminToken = useAdminAuthStore((s) => s.accessToken);
  const [deletingAuctionId, setDeletingAuctionId] = useState<number | null>(
    null
  );

  const {
    detail: auction,
    loading,
    error,
    load,
    reset,
  } = useAuctionDetailStore();
  const { toast, showToast, hideToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 삭제
  const handleDeleteAuc = useCallback(async () => {
    if (!adminToken || !auction) return;
    setConfirmOpen(true);
    setDeletingAuctionId(auction.auctionId);
  }, [adminToken, auction]);

  const confirmDelete = useCallback(async () => {
    const auctionId = deletingAuctionId;
    if (!auctionId) {
      return;
    }
    try {
      if (adminToken) await adminDeleteAuction(auctionId);
      navigate(-1);
      showToast("경매가 삭제되었습니다.", "success");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "삭제에 실패했습니다.";
      showToast(msg, "error");
    } finally {
      setConfirmOpen(false);
    }
  }, [adminToken, deletingAuctionId, navigate, showToast]);

  useEffect(() => {
    if (!id) return;
    reset();
    load(Number(id));
  }, [id, reset, load]);

  if (loading) return <div className="text-g300 p-6">로딩 중...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!auction) return <div className="p-6">데이터가 없습니다.</div>;

  return (
    <div className="text-[14px] leading-[1.5] text-neutral-900">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-neutral-400 hover:text-neutral-900"
      >
        ← 목록
      </button>

      {/* 제목 + 메타 */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-[18px] font-bold text-neutral-900 sm:text-[20px] sm:leading-[1.4]">
            {auction.title}
          </h3>
          <button
            type="button"
            className="bg-purple rounded-md p-2 font-bold text-white"
            onClick={() => handleDeleteAuc()}
          >
            상품 삭제
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-neutral-500 sm:text-[13px]">
          <span className="flex items-center gap-1">
            <span className="text-neutral-400">카테고리</span>
            <span className="font-medium text-neutral-700">
              {auction.categoryMain} &gt; {auction.categorySub}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-neutral-400">작성자</span>
            <span className="font-medium text-neutral-700">
              {auction.sellerNickname}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-neutral-400">작성일시</span>
            <span className="font-medium text-neutral-700">
              {formatDate(auction.createdAt)}
            </span>
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div className="mt-6 grid grid-cols-2 grid-cols-[1fr_2fr] gap-4 rounded-md border border-neutral-200 bg-white p-5">
        <ProductImage images={auction.images} />
        <p className="text-[14px] leading-7 whitespace-pre-line text-neutral-800">
          {auction.description}
        </p>
      </div>
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <div className="animate-fade-in w-72 rounded-md bg-white p-6 text-center shadow-sm">
            <p className="text-g100 mb-5 text-base font-medium">
              경매를 삭제하시겠습니까?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="border-purple text-purple hover:bg-light-purple cursor-pointer rounded-md border px-4 py-2 font-semibold transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="bg-purple hover:bg-deep-purple cursor-pointer rounded-md px-4 py-2 font-semibold text-white transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuctionPost;

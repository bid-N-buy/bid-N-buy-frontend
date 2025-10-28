import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import adminApi from "../api/adminAxiosInstance";
import type { UserDetailProps } from "../types/AdminType";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";
import { formatDate } from "../../../shared/utils/datetime";
// import { useAuctionDetailStore } from "../../auction/store/auctionDetailStore";
// import { formatDate } from "../../../shared/utils/datetime";

const AdminUserDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<UserDetailProps | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const getUser = async () => {
    try {
      const userInfo = (await adminApi.get(`/admin/users/${id}`)).data;
      setUser(userInfo);
    } catch (error) {
      setUser(null);
      console.error("데이터 불러오기 실패:", error);
      showToast("회원 데이터를 불러오는 데에 실패했습니다.", "error");
    }
  };
  console.log(user);

  useEffect(() => {
    if (!id) return;
    getUser();
  }, [id]);

  if (!user) {
    return null;
  }

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
      <div className="flex gap-4 border-b pb-4">
        {user.profileImageUrl && (
          <img src={user.profileImageUrl} className="size-20 rounded-full" />
        )}
        <div>
          <h3 className="text-[18px] font-bold text-neutral-900 sm:text-[20px] sm:leading-[1.4]">
            {user.nickname}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-neutral-500 sm:text-[13px]">
            <span className="flex items-center gap-1">
              <span className="text-neutral-400">userId</span>
              <span className="font-medium text-neutral-700">
                {user.userId}
              </span>
            </span>

            <span className="flex items-center gap-1">
              <span className="text-neutral-400">이메일</span>
              <span className="font-medium text-neutral-700">{user.email}</span>
            </span>

            <span className="flex items-center gap-1">
              <span className="text-neutral-400">가입일시</span>
              <span className="font-medium text-neutral-700">
                {formatDate(user.createdAt)}
              </span>
            </span>

            <span className="flex items-center gap-1">
              <span className="text-neutral-400">패널티</span>
              <span className="font-medium text-neutral-700">
                {user.penaltyPoints}
              </span>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-neutral-500 sm:text-[13px]">
            <span className="flex items-center gap-1">
              <span className="text-neutral-400">활동상태</span>
              <span className="font-medium text-neutral-700">
                {user.activityStatus}
              </span>
            </span>
            {user.updatedAt && (
              <span className="flex items-center gap-1">
                <span className="text-neutral-400">수정일시</span>
                <span className="font-medium text-neutral-700">
                  {formatDate(user.updatedAt)}
                </span>
              </span>
            )}
            {user.deletedAt && (
              <span className="flex items-center gap-1">
                <span className="text-neutral-400">탈퇴일시</span>
                <span className="font-medium text-neutral-700">
                  {formatDate(user.deletedAt)}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <h6 className="mt-4 font-bold">징계 내역</h6>
      <div className="mt-2 gap-4 rounded-md border border-neutral-200 bg-white p-5">
        {user.penaltyHistory && user.penaltyHistory.length > 0 ? (
          <ul>
            {user.penaltyHistory.map((penalty) => (
              <li key={penalty.penaltyId}>
                <p>
                  <strong>유형:</strong> {penalty.type} ({penalty.points}점)
                </p>
                <p>
                  <strong>부과일:</strong> {penalty.createdAt}
                  {penalty.active && <span> (현재 유효)</span>}
                </p>
              </li>
            ))}
            {user.suspended ? (
              <li>
                <p>
                  <strong>정지 기간 :</strong> {user.suspendedUntil}
                </p>
                <p>
                  <strong>총 정지 횟수 :</strong> {user.suspensionCount}
                </p>
              </li>
            ) : (
              ""
            )}
            <li>
              <p>
                <strong>총 정지 횟수 :</strong> {user.banCount}
              </p>
            </li>
          </ul>
        ) : (
          <p>징계 내역이 없습니다.</p>
        )}
      </div>
      <h6 className="mt-4 font-bold">거래 관련 정보</h6>
      <div className="mt-2 gap-4 rounded-md border border-neutral-200 bg-white p-5">
        {user.auctionCount > 0 ? (
          <ul>
            <li>
              <p>
                <strong>거래 횟수:</strong> {user.auctionCount}
              </p>
              <p>
                <strong>현재 거래 온도:</strong> {user.userTemperature}
              </p>
            </li>
          </ul>
        ) : (
          <p>거래 관련 정보가 없습니다.</p>
        )}
      </div>
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

export default AdminUserDetail;

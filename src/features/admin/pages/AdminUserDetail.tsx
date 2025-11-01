import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import adminApi from "../api/adminAxiosInstance";
import type { UserDetailProps } from "../types/AdminType";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";
import { formatDate } from "../../../shared/utils/datetime";
import Avatar from "../../../shared/components/Avatar";
import AdminPenaltyPostModal from "../components/AdminPenaltyPostModal";

const AdminUserDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<UserDetailProps | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const modalRoot: HTMLElement | null = document.getElementById("modal-root");

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

  useEffect(() => {
    if (!id) return;
    getUser();
  }, [id]);

  if (!user) {
    return null;
  }

  if (!modalRoot) {
    console.error("Portal root element '#modal-root' not found.");
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
        <Avatar imageUrl={user.profileImageUrl} size="20" />
        <div>
          <div className="flex items-center gap-4">
            <h3 className="text-[18px] font-bold text-neutral-900 sm:text-[20px] sm:leading-[1.4]">
              {user.nickname}
            </h3>

            <button
              type="button"
              className="bg-purple rounded-md p-2 font-bold text-white"
              onClick={() => setIsModalOpen(true)}
            >
              패널티 부과
            </button>
          </div>

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
                <span className="text-neutral-400">강퇴일시</span>
                <span className="font-medium text-neutral-700">
                  {formatDate(user.deletedAt)}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="md:flex md:gap-4">
        <div className="block md:w-1/2">
          <h6 className="mt-4 font-bold">징계 내역</h6>
          <div className="mt-2 gap-4 rounded-md border border-neutral-200 bg-white p-5">
            {user.penaltyHistory && user.penaltyHistory.length > 0 ? (
              <ul>
                {user.penaltyHistory.map((penalty) => (
                  <li
                    key={penalty.penaltyId}
                    className="border-b py-2 first:pt-0"
                  >
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
                  <li className="border-b py-2">
                    <p>
                      <strong>정지 기간 :</strong> {user.suspendedUntil}
                    </p>
                    <p>
                      <strong>정지 전적 :</strong>{" "}
                      {user.suspensionCount === 1 ? "있음" : "없음"}
                    </p>
                  </li>
                ) : (
                  ""
                )}
                <li className="py-2">
                  <p>
                    <strong>강퇴여부 :</strong>{" "}
                    {user.banCount === 1 ? "O" : "X"}
                  </p>
                </li>
              </ul>
            ) : (
              <p>징계 내역이 없습니다.</p>
            )}
          </div>
        </div>
        <div className="block md:w-1/2">
          <h6 className="mt-4 font-bold">거래 관련 정보</h6>
          <div className="mt-2 gap-4 rounded-md border border-neutral-200 bg-white p-5">
            <ul>
              {user.auctionCount > 0 ? (
                <li>
                  <p>
                    <strong>거래 횟수:</strong> {user.auctionCount}
                  </p>
                  <p>
                    <strong>현재 거래 온도:</strong> {user.userTemperature}
                  </p>
                </li>
              ) : (
                <p>거래 관련 정보가 없습니다.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
      {isModalOpen &&
        createPortal(
          <AdminPenaltyPostModal
            userId={user.userId}
            onClose={() => setIsModalOpen(false)}
          />,
          modalRoot
        )}
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

export default AdminUserDetail;

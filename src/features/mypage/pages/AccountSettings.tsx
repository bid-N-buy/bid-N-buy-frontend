// src/features/mypage/pages/AccountSettings.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore, type AuthState } from "../../auth/store/authStore";
import AddressDetails from "../components/myAddress/AddressDetails";
import AddressEditorModal from "../components/myAddress/AddressEditorModal";
import { useAddresses } from "../hooks/useAddresses";
import type { Address, AddressDraft } from "../types/address";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  newPassword2: string;
};

const MAX_IMG_MB = 5;
/** ⚙️ 팀 업로더 엔드포인트(파일 → URL 반환). 실제값으로 교체하세요. */
const UPLOAD_ENDPOINT = "/files/upload";

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();

  const profile = useAuthStore((s: AuthState) => s.profile);
  const setProfile = useAuthStore((s: AuthState) => s.setProfile);
  const clearAuth = useAuthStore((s: any) => s.clear);
  const userId = (useAuthStore.getState() as any)?.userId ?? null;

  // 닉네임
  const [nickname, setNickname] = useState(profile?.nickname ?? "NickName");
  const [isEditName, setIsEditName] = useState(false);
  const [nickLoading, setNickLoading] = useState(false);

  // 비밀번호
  const [pw, setPw] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    newPassword2: "",
  });
  const [pwLoading, setPwLoading] = useState(false);

  // 🔸 프로필 이미지
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 탈퇴
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [delLoading, setDelLoading] = useState(false);

  // 주소
  const [addrOpen, setAddrOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  // 메시지
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const emailMasked = useMemo(() => {
    const e = profile?.email ?? "";
    if (!e) return "";
    const [id, host] = e.split("@");
    if (!id || !host) return e;
    const safe =
      id.length <= 2 ? id[0] + "*" : id.slice(0, 2) + "*".repeat(id.length - 2);
    return `${safe}@${host}`;
  }, [profile?.email]);

  const toast = (ok: string | null, error: string | null) => {
    setMsg(ok);
    setErr(error);
    setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, 2200);
  };

  /* 주소 훅 */
  const {
    addresses,
    loading: addrLoading,
    error: addrError,
    add,
    update,
    remove,
  } = useAddresses();

  /** ✅ 프로필(닉네임/이메일/이미지) 하이드레이션: GET /mypage */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, status } = await api.get("/mypage", {
          validateStatus: (s) => s >= 200 && s < 500,
        });
        if (!alive) return;

        if (status === 401 || status === 403) {
          toast(null, "세션이 만료되었거나 권한이 없습니다.");
          return;
        }

        const nick = data?.nickname ?? "NickName";
        const email = data?.email ?? "";
        const avatar = data?.profileImageUrl ?? null;

        setNickname(nick); // 닉네임 입력 기본값 갱신
        setProfile?.({ nickname: nick, email }); // 전역 프로필 갱신
        setCurrentImageUrl(avatar);
        // temperature 필요 시 여기에 상태/스토어 추가 가능: data?.temperature
      } catch {
        toast(null, "프로필 정보를 불러오지 못했습니다.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [setProfile]);

  /* ✅ 닉네임 변경: PUT /auth/{userId}/nickname  { nickname } */
  const submitNickname = async () => {
    const v = nickname.trim();
    if (!v) return toast(null, "닉네임을 입력하세요.");
    if (v.length < 2 || v.length > 20)
      return toast(null, "닉네임은 2~20자로 입력하세요.");
    if (!userId) return toast(null, "userId를 확인할 수 없습니다.");

    try {
      setNickLoading(true);
      const { status, data } = await api.put(
        `/auth/${userId}/nickname`,
        { nickname: v },
        { validateStatus: (s) => s >= 200 && s < 500 }
      );
      if (status === 401 || status === 403) {
        toast(null, "세션이 만료되었거나 권한이 없습니다.");
        return;
      }
      // 전역 스토어 반영
      setProfile({ nickname: v, email: profile?.email });
      toast(data?.message ?? "닉네임이 변경되었습니다.", null);
      setIsEditName(false);
    } catch (e: any) {
      const m =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        "닉네임 변경에 실패했습니다.";
      toast(null, m);
    } finally {
      setNickLoading(false);
    }
  };

  /* 비밀번호 변경 */
  const submitPassword = async () => {
    const { currentPassword, newPassword, newPassword2 } = pw;
    if (!currentPassword || !newPassword || !newPassword2)
      return toast(null, "현재/새 비밀번호를 모두 입력하세요.");
    if (newPassword !== newPassword2)
      return toast(null, "새 비밀번호가 일치하지 않습니다.");
    if (newPassword.length < 8)
      return toast(null, "새 비밀번호는 8자 이상 권장합니다.");
    if (newPassword === currentPassword)
      return toast(null, "새 비밀번호가 현재 비밀번호와 동일합니다.");

    try {
      setPwLoading(true);
      const { data } = await api.post("/auth/user/password/change", {
        currentPassword,
        newPassword,
      });
      toast(data?.message ?? "비밀번호가 변경되었습니다.", null);
      setPw({ currentPassword: "", newPassword: "", newPassword2: "" });
    } catch (e: any) {
      const m =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        "비밀번호 변경에 실패했습니다.";
      toast(null, m);
    } finally {
      setPwLoading(false);
    }
  };

  /** 파일 선택 */
  const onPickImage = () => fileRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_IMG_MB * 1024 * 1024)
      return toast(null, `이미지 용량은 최대 ${MAX_IMG_MB}MB까지 가능합니다.`);
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  /** 파일 업로드 → URL(공개 접근 URL) 획득 */
  const uploadImageAndGetUrl = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post(UPLOAD_ENDPOINT, form, {
      headers: { "Content-Type": "multipart/form-data" },
      validateStatus: (s) => s >= 200 && s < 500,
    });
    const url: string | undefined =
      data?.url ?? data?.imageUrl ?? data?.profileImageUrl;
    if (!url) throw new Error("업로드 응답에 이미지 URL이 없습니다.");
    return url;
  };

  /** 업로드 후 PUT /auth/{userId}/profile 로 반영 */
  const submitImage = async () => {
    if (!imgFile) return toast(null, "변경할 이미지를 먼저 선택하세요.");
    if (!userId) return toast(null, "userId를 확인할 수 없습니다.");

    try {
      setImgLoading(true);
      // 1) 파일 업로드해서 최종 접근 URL 확보
      const uploadedUrl = await uploadImageAndGetUrl(imgFile);
      // 2) 서버 프로필에 URL 반영 (명세 키: profileImageUrl)
      await api.put(`/auth/${userId}/profile`, {
        profileImageUrl: uploadedUrl,
      });
      // 3) UI 갱신 & 전역 스토어(선택)
      setCurrentImageUrl(uploadedUrl);
      setProfile?.({
        nickname: profile?.nickname ?? "NickName",
        email: profile?.email ?? "",
      });
      toast("프로필 이미지가 변경되었습니다.", null);
    } catch (e: any) {
      const m =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        "이미지 업로드/변경에 실패했습니다.";
      toast(null, m);
    } finally {
      setImgLoading(false);
      if (imgPreview) URL.revokeObjectURL(imgPreview);
      setImgFile(null);
      setImgPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // const [delPw, setDelPw] = useState("");
  // const [delLoading, setDelLoading] = useState(false);

  const openDelete = () => {
    setDelPw("");
    setDeleteOpen(true);
  };

  const submitDelete = async () => {
    if (!userId) return toast(null, "userId를 확인할 수 없습니다.");
    if (!delPw) return toast(null, "비밀번호를 입력하세요.");

    try {
      setDelLoading(true);
      const { data } = await api.delete(`/auth/user/${userId}`, {
        data: { password: delPw },
        headers: { "Content-Type": "application/json" },
      });
      toast(data?.message ?? "사용자 삭제 완료", null);
      clearAuth?.();
      navigate("/login", { replace: true });
    } catch (e: any) {
      const m =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        (e?.response?.status === 401
          ? "세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요."
          : "탈퇴에 실패했습니다.");
      toast(null, m);
    } finally {
      setDelLoading(false);
      setDeleteOpen(false);
    }
  };

  /* design tokens */
  const lineInput =
    "w-full rounded-none border-0 border-b border-neutral-300 bg-transparent px-0 py-[10px] text-[15px] placeholder:text-neutral-400 focus:border-neutral-800 focus:ring-0";
  const ghostBtn =
    "rounded-md border border-neutral-300 bg-white px-3 py-[6px] text-[13px] text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100";
  const purpleBtn =
    "rounded-md bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90 disabled:opacity-60";
  const dangerBtn =
    "rounded-md bg-rose-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90 disabled:opacity-60";
  const chipBtn =
    "rounded-full bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90";

  return (
    <div className="mx-auto w-full max-w-[720px]">
      {/* 상단: 아바타 + 이름 + 이미지 변경 */}
      <div className="mb-8 flex items-center gap-4">
        <div className="relative h-[96px] w-[96px] overflow-hidden rounded-full bg-neutral-200">
          {/* 우선순위: 미리보기 > 서버 반영된 현재 URL */}
          {imgPreview ? (
            <img
              src={imgPreview}
              alt="미리보기"
              className="h-full w-full object-cover"
            />
          ) : currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="프로필"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-col">
          <div className="text-[20px] font-semibold text-neutral-900">
            {profile?.nickname ?? "NickName"}
          </div>
          <div className="mt-2">
            <button type="button" onClick={onPickImage} className={ghostBtn}>
              이미지 변경
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={onFileChange}
            />
            {imgFile && (
              <button
                type="button"
                onClick={submitImage}
                disabled={imgLoading}
                className="ml-2 rounded-md bg-neutral-900 px-3 py-[6px] text-[13px] text-white hover:opacity-90 disabled:opacity-60"
              >
                {imgLoading ? "업로드 중…" : "저장"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* divider */}
      <div className="mb-8 h-px w-full bg-neutral-200" />

      {/* 프로필 정보 */}
      <section className="mb-10">
        <h4 className="mb-4 text-[18px] font-bold text-neutral-900">
          프로필 정보
        </h4>

        {/* 닉네임 라인 */}
        <div className="mb-8">
          <div className="mb-1 text-[13px] font-semibold text-neutral-800">
            닉네임
          </div>
          {!isEditName ? (
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-neutral-900">
                {profile?.nickname ?? "NickName"}
              </span>
              <button
                type="button"
                onClick={() => setIsEditName(true)}
                className={ghostBtn}
              >
                변경
              </button>
            </div>
          ) : (
            <div className="items end flex gap-2">
              <input
                className={lineInput}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
              />
              <button
                type="button"
                onClick={() => {
                  setNickname(profile?.nickname ?? "NickName");
                  setIsEditName(false);
                }}
                className={ghostBtn}
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitNickname}
                disabled={nickLoading}
                className={ghostBtn}
              >
                {nickLoading ? "변경 중…" : "변경"}
              </button>
            </div>
          )}
        </div>

        {/* 이메일 (마스킹) */}
        {emailMasked && (
          <div className="mb-8">
            <div className="mb-1 text-[13px] font-semibold text-neutral-800">
              이메일
            </div>
            <div className="text-[15px] text-neutral-900">{emailMasked}</div>
          </div>
        )}

        {/* 비밀번호 변경 */}
        <div>
          <div className="mb-3 text-[14px] font-bold text-neutral-900">
            비밀번호 변경
          </div>

          <label className="mb-1 block text-[12px] text-neutral-500">
            현재 비밀번호
          </label>
          <input
            type="password"
            autoComplete="current-password"
            className={lineInput}
            value={pw.currentPassword}
            onChange={(e) =>
              setPw((s) => ({ ...s, currentPassword: e.target.value }))
            }
            placeholder="현재 비밀번호"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitPassword();
            }}
          />

          <div className="mt-4">
            <label className="mb-1 block text-[12px] text-neutral-500">
              새 비밀번호
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className={lineInput}
              value={pw.newPassword}
              onChange={(e) =>
                setPw((s) => ({ ...s, newPassword: e.target.value }))
              }
              placeholder="새 비밀번호 (8자 이상)"
              minLength={8}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitPassword();
              }}
            />
          </div>

          <div className="mt-4 flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[12px] text-neutral-500">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className={lineInput}
                value={pw.newPassword2}
                onChange={(e) =>
                  setPw((s) => ({ ...s, newPassword2: e.target.value }))
                }
                placeholder="새 비밀번호 확인"
                minLength={8}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitPassword();
                }}
              />
            </div>
            <button
              type="button"
              onClick={submitPassword}
              disabled={pwLoading}
              className={purpleBtn}
              aria-busy={pwLoading}
            >
              {pwLoading ? "변경 중…" : "변경"}
            </button>
          </div>
        </div>
      </section>

      {/* 주소 */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-[16px] font-bold text-neutral-900">주소</h5>
          <button
            type="button"
            className="rounded-full bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90"
            onClick={() => {
              setEditing(null);
              setAddrOpen(true);
            }}
          >
            새 주소 추가
          </button>
        </div>

        {addrError && <p className="mb-2 text-sm text-rose-600">{addrError}</p>}

        <AddressDetails
          addresses={addresses ?? []}
          loading={addrLoading}
          onEdit={(addr) => {
            setEditing(addr);
            setAddrOpen(true);
          }}
          onDelete={remove}
        />
      </section>

      {/* 하단: 탈퇴 */}
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setDelPw("");
            setDeleteOpen(true);
          }}
          className="rounded-md px-2 py-1 text-[12px] text-neutral-400 hover:text-rose-600"
        >
          탈퇴하기
        </button>
      </div>

      {/* 메시지 */}
      {msg && (
        <p className="mt-2 rounded-md border border-green-200 bg-green-50 p-2 text-green-700">
          {msg}
        </p>
      )}
      {err && (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-red-700">
          {err}
        </p>
      )}

      {/* 탈퇴 모달 */}
      {deleteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setDeleteOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-semibold text-neutral-900">
              정말 탈퇴하시겠어요?
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              계정과 거래/기록이 삭제될 수 있어요. 확인을 위해 비밀번호를 입력해
              주세요.
            </p>

            <label className="mt-4 mb-1 block text-[12px] text-neutral-500">
              비밀번호
            </label>
            <input
              type="password"
              className={lineInput}
              placeholder="비밀번호"
              value={delPw}
              onChange={(e) => setDelPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitDelete()}
              autoFocus
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className={ghostBtn}
                onClick={() => setDeleteOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className={dangerBtn}
                onClick={submitDelete}
                disabled={delLoading}
                aria-busy={delLoading}
              >
                {delLoading ? "탈퇴 중…" : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 주소 편집 모달 */}
      <AddressEditorModal
        open={addrOpen}
        initial={editing}
        onClose={() => {
          setAddrOpen(false);
          setEditing(null);
        }}
        onSave={async (draft) => {
          const payload: AddressDraft = {
            receiver: draft.receiver.trim(),
            phone: draft.phone.trim(),
            postcode: draft.postcode.trim(),
            address1: draft.address1.trim(),
            address2: (draft.address2 ?? "").trim(),
            isDefault: !!draft.isDefault,
          };
          if (draft.id) {
            await update(draft.id, payload);
          } else {
            await add(payload);
          }
        }}
      />
    </div>
  );
};

export default AccountSettings;

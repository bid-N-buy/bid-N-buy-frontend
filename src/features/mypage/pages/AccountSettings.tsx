// src/features/mypage/pages/AccountSettings.tsx
import React, { useMemo, useRef, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore, type AuthState } from "../../auth/store/authStore";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  newPassword2: string;
};

const MAX_IMG_MB = 5;

const AccountSettings: React.FC = () => {
  const profile = useAuthStore((s: AuthState) => s.profile);
  const setProfile = useAuthStore((s: AuthState) => s.setProfile);
  const userId = (useAuthStore.getState() as any)?.userId ?? null;

  // 닉네임 인라인 편집
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

  // 프로필 이미지
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  /* actions */
  const submitNickname = async () => {
    const v = nickname.trim();
    if (!v) return toast(null, "닉네임을 입력하세요.");
    if (v.length < 2 || v.length > 20)
      return toast(null, "닉네임은 2~20자로 입력하세요.");
    try {
      setNickLoading(true);
      await api.patch("/users/me", { nickname: v });
      setProfile({ nickname: v, email: profile?.email });
      toast("닉네임이 변경되었습니다.", null);
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

  const submitPassword = async () => {
    const { currentPassword, newPassword, newPassword2 } = pw;
    if (!currentPassword || !newPassword || !newPassword2)
      return toast(null, "현재/새 비밀번호를 모두 입력하세요.");
    if (newPassword !== newPassword2)
      return toast(null, "새 비밀번호가 일치하지 않습니다.");
    if (newPassword.length < 8)
      return toast(null, "새 비밀번호는 8자 이상 권장합니다.");
    try {
      setPwLoading(true);
      await api.post("/auth/user/password/change", {
        currentPassword,
        newPassword,
      });
      setPw({ currentPassword: "", newPassword: "", newPassword2: "" });
      toast("비밀번호가 변경되었습니다.", null);
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

  const onPickImage = () => fileRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_IMG_MB * 1024 * 1024)
      return toast(null, `이미지 용량은 최대 ${MAX_IMG_MB}MB까지 가능합니다.`);
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };
  const submitImage = async () => {
    if (!imgFile) return toast(null, "변경할 이미지를 먼저 선택하세요.");
    try {
      setImgLoading(true);
      const form = new FormData();
      form.append("image", imgFile);
      if (!userId)
        return toast(null, "userId가 없어 업로드 불가(/auth/profile 권장)");
      await api.put(`/auth/${userId}/profile`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast("프로필 이미지가 변경되었습니다.", null);
    } catch (e: any) {
      const m =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        "이미지 업로드에 실패했습니다.";
      toast(null, m);
    } finally {
      setImgLoading(false);
      if (imgPreview) URL.revokeObjectURL(imgPreview);
      setImgFile(null);
      setImgPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /* design tokens */
  const lineInput =
    "w-full rounded-none border-0 border-b border-neutral-300 bg-transparent px-0 py-[10px] text-[15px] placeholder:text-neutral-400 focus:border-neutral-800 focus:ring-0";
  const ghostBtn =
    "rounded-md border border-neutral-300 bg-white px-3 py-[6px] text-[13px] text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100";
  const purpleBtn =
    "rounded-md bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90 disabled:opacity-60";
  const chipBtn =
    "rounded-full bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90";

  return (
    <div className="mx-auto w-full max-w-[720px]">
      {/* 상단: 아바타 + 이름 + 이미지 변경 */}
      <div className="mb-8 flex items-center gap-4">
        <div className="relative h-[96px] w-[96px] overflow-hidden rounded-full bg-neutral-200" />
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
              <span className="text-[15px] text-neutral-900">NickName</span>
              <button
                type="button"
                onClick={() => setIsEditName(true)}
                className={ghostBtn}
              >
                변경
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <input
                className={lineInput}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
              />
              <button
                type="button"
                onClick={() => setIsEditName(false)}
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

        {/* 비밀번호 변경 */}
        <div className="">
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
          />
          <div className="mt-4 flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[12px] text-neutral-500">
                비밀번호 확인
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className={lineInput}
                value={pw.newPassword}
                onChange={(e) =>
                  setPw((s) => ({ ...s, newPassword: e.target.value }))
                }
                placeholder="비밀번호 확인"
              />
            </div>
            <button
              type="button"
              onClick={submitPassword}
              disabled={pwLoading}
              className={ghostBtn}
            >
              {pwLoading ? "변경 중…" : "변경"}
            </button>
          </div>
        </div>
      </section>

      {/* 주소 */}
      <section className="mb-10">
        <h5 className="mb-3 text-[16px] font-bold text-neutral-900">주소</h5>

        {/* 하이라이트 카드 */}
        <div className="bg-opacity-55 rounded-2xl border border-neutral-200 bg-[#EEC9DA] p-4">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <div className="text-[15px] font-semibold text-neutral-900">
                홍길동
              </div>
              <div className="text-[13px] text-neutral-600">010XXXXXXXX</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className={chipBtn}>
                수정
              </button>
              <button
                type="button"
                className="rounded-md bg-neutral-200 px-3 py-[6px] text-[13px] text-neutral-700 hover:bg-neutral-300"
              >
                삭제
              </button>
            </div>
          </div>

          <p className="text-[12px] leading-relaxed text-neutral-500">
            (우편번호) 도로명 주소 혹은 지번 주소 &gt; 기타 상세한 주소 를
            보여드립니다.
          </p>
        </div>
      </section>

      {/* 하단: 탈퇴하기(오른쪽 정렬, 연한 톤) */}
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-[12px] text-neutral-400 hover:text-neutral-600"
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
    </div>
  );
};

export default AccountSettings;

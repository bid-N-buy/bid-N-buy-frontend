import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore, type AuthState } from "../../auth/store/authStore";
import AddressDetails from "../components/myAddress/AddressDetails";
import AddressEditorModal from "../components/myAddress/AddressEditorModal";
import { useAddresses } from "../hooks/useAddresses";
import type { Address, AddressDraft } from "../types/address";
import Toast from "../../../shared/components/Toast";

/* =======================
 *        Config
 * ======================= */
type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  newPassword2: string;
};

const MAX_IMG_MB = 5;

const DEFAULT_AVATAR =
  "https://bid-1024-aws-prac.s3.ap-northeast-2.amazonaws.com/user-profiles/default-profile.png";

function makeAbsolute(u?: string | null): string | null {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  try {
    const base = new URL(DEFAULT_AVATAR);
    const path = u.startsWith("/") ? u : `/${u}`;
    return `${base.origin}${path}`;
  } catch {
    return u;
  }
}

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();

  const profile = useAuthStore((s: AuthState) => s.profile);
  const setProfile = useAuthStore((s: AuthState) => s.setProfile);
  const clearAuth = useAuthStore((s: any) => s.clear);
  const setUserId = useAuthStore((s: any) => s.setUserId);
  const userIdFromStore = useAuthStore((s: any) => s.userId);

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

  // 프로필 이미지
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    DEFAULT_AVATAR
  );
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 탈퇴
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [delLoading, setDelLoading] = useState(false);

  // 주소(실서버 훅)
  const {
    addresses,
    loading: addrLoading,
    error: addrError,
    add,
    update,
    remove,
  } = useAddresses();

  // 주소(목업 전환)
  const [addrOpen, setAddrOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [addrMock, setAddrMock] = useState<boolean>(false);
  const [addressesMock, setAddressesMock] = useState<Address[]>([
    {
      addressId: 1,
      name: "홍길동",
      phoneNumber: "010-1234-5678",
      zonecode: "04524",
      address: "서울 중구 세종대로 110",
      detailAddress: "1층",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // 메시지 (토스트)
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
    window.setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, 2200);
  };

  /** userId 복구: /auth/me → /users/me → /mypage 중 첫 성공 */
  const resolveUserId = useCallback(async (): Promise<number | null> => {
    let uid = useAuthStore.getState().userId;
    if (uid) return uid;

    const tryGet = async (path: string) => {
      try {
        const { data } = await api.get(path, {
          validateStatus: (s) => s >= 200 && s < 500,
        });
        const cand =
          data?.id ?? data?.userId ?? data?.user_id ?? data?.data?.id ?? null;
        if (typeof cand === "number") return cand as number;
        if (typeof cand === "string" && /^\d+$/.test(cand))
          return parseInt(cand, 10);
        return null;
      } catch {
        return null;
      }
    };

    uid =
      (await tryGet("/auth/me")) ??
      (await tryGet("/users/me")) ??
      (await tryGet("/mypage"));

    if (uid) setUserId(uid);
    return uid ?? null;
  }, [setUserId]);

  /** 첫 로드: 프로필/이미지 + userId 복구 */
  const onceRef = useRef(false);
  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;

    (async () => {
      try {
        const { data } = await api.get("/mypage");
        const nick = data?.nickname ?? "NickName";
        const email = data?.email ?? "";
        setNickname(nick);
        if (!profile || profile.nickname !== nick || profile.email !== email) {
          setProfile?.({ nickname: nick, email });
        }
      } catch (e: any) {
        toast(
          null,
          e?.response?.data?.message ?? "프로필 정보를 불러오지 못했습니다."
        );
      }

      // userId 확보 후 프로필 이미지 조회
      const uid = (await resolveUserId()) ?? userIdFromStore;
      if (!uid) {
        setCurrentImageUrl(DEFAULT_AVATAR);
        return;
      }

      try {
        const { data } = await api.get(`/auth/${uid}/profile`);
        const raw = data?.profileImageUrl ?? null;
        const abs = makeAbsolute(raw) ?? DEFAULT_AVATAR;
        // ✅ 초기 로딩에도 캐시버스터
        const bust = `${abs}${abs.includes("?") ? "&" : "?"}v=${Date.now()}`;
        setCurrentImageUrl(bust);
      } catch {
        setCurrentImageUrl(DEFAULT_AVATAR);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 주소 훅 에러 → 401이면 목업 전환 */
  useEffect(() => {
    const unauthorized =
      (addrError as any)?.status === 401 ||
      (addrError as any)?.code === 401 ||
      (addrError as any)?.message?.includes?.("Unauthorized");
    if (unauthorized) setAddrMock(true);
  }, [addrError]);

  /* ========== 닉네임 변경 ========== */
  const submitNickname = async () => {
    const v = nickname.trim();
    if (!v) return toast(null, "닉네임을 입력하세요.");
    if (v.length < 2 || v.length > 20)
      return toast(null, "닉네임은 2~20자로 입력하세요.");

    const uid = (await resolveUserId()) ?? userIdFromStore;
    if (!uid) return toast(null, "userId를 확인할 수 없습니다.");

    try {
      setNickLoading(true);
      const { data } = await api.put(`/auth/${uid}/nickname`, { nickname: v });
      if (!profile || profile.nickname !== v) {
        setProfile({ nickname: v, email: profile?.email });
      }
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

  /* ========== 비밀번호 변경 ========== */
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

  /* ========== 이미지 업로드 ========== */
  const onPickImage = () => fileRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_IMG_MB * 1024 * 1024)
      return toast(null, `이미지 용량은 최대 ${MAX_IMG_MB}MB까지 가능합니다.`);
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const submitImage = async () => {
    const uid = (await resolveUserId()) ?? userIdFromStore;
    if (!imgFile) return toast(null, "변경할 이미지를 먼저 선택하세요.");
    if (!uid) return toast(null, "userId를 확인할 수 없습니다.");

    // 업로드 동안 낙관적 프리뷰 적용
    const optimisticUrl = URL.createObjectURL(imgFile);
    setCurrentImageUrl(optimisticUrl);

    try {
      setImgLoading(true);
      const form = new FormData();
      // ✅ 백엔드 @RequestPart("images")에 맞춤
      form.append("images", imgFile);

      const { data } = await api.put(`/auth/${uid}/profile`, form, {
        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",
        withCredentials: true,
        transformRequest: [(body) => body], // Content-Type 자동
      });

      const raw = data?.profileImageUrl ?? data?.imageUrl ?? data?.url ?? null;
      let next = raw;
      if (!next) {
        const r = await api.get(`/auth/${uid}/profile`);
        next = r?.data?.profileImageUrl ?? null;
      }
      const abs = makeAbsolute(next) ?? DEFAULT_AVATAR;
      const bust = `${abs}${abs.includes("?") ? "&" : "?"}v=${Date.now()}`;
      setCurrentImageUrl(bust);

      // 임시 객체 URL 해제
      URL.revokeObjectURL(optimisticUrl);

      setProfile?.({
        nickname: profile?.nickname ?? "NickName",
        email: profile?.email ?? "",
      });

      toast("프로필 이미지가 변경되었습니다.", null);
    } catch (e: any) {
      // 실패 시 임시 프리뷰 해제 및 기본 이미지로 롤백(선택)
      URL.revokeObjectURL(optimisticUrl);
      setCurrentImageUrl(DEFAULT_AVATAR);

      if (import.meta.env.DEV) {
        console.debug("[upload:error]", {
          status: e?.response?.status,
          data: e?.response?.data,
        });
      }
      const m =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
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

  /* ========== 탈퇴 ========== */
  const submitDelete = async () => {
    const uid = (await resolveUserId()) ?? userIdFromStore;
    if (!uid) return toast(null, "userId를 확인할 수 없습니다.");
    if (!delPw) return toast(null, "비밀번호를 입력하세요.");

    try {
      setDelLoading(true);
      const { data } = await api.delete(`/auth/user/${uid}`, {
        data: { password: delPw },
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      toast(data?.message ?? "사용자 삭제 완료", null);
      clearAuth?.();
      navigate("/login", { replace: true });
    } catch (e: any) {
      const m =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        "탈퇴에 실패했습니다.";
      toast(null, m);
    } finally {
      setDelLoading(false);
      setDeleteOpen(false);
    }
  };

  /* ===== 주소: 목업 add/update/remove (서버 스펙 일치) ===== */
  const addMock = useCallback(async (draft: AddressDraft) => {
    setAddressesMock((prev) => {
      const nextId = (prev.at(-1)?.addressId ?? 0) + 1;
      const now = new Date().toISOString();
      return [
        ...prev,
        {
          addressId: nextId,
          name: draft.name,
          phoneNumber: draft.phoneNumber,
          zonecode: draft.zonecode,
          address: draft.address,
          detailAddress: draft.detailAddress ?? "",
          createdAt: now,
          updatedAt: now,
        },
      ];
    });
  }, []);

  const updateMock = useCallback(
    async (id: number, patch: Partial<AddressDraft>) => {
      setAddressesMock((prev) =>
        prev.map((a) =>
          a.addressId === id
            ? {
                ...a,
                ...patch,
                detailAddress:
                  patch.detailAddress !== undefined
                    ? patch.detailAddress
                    : a.detailAddress,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
    },
    []
  );

  const removeMock = useCallback(async (id: number) => {
    setAddressesMock((prev) => prev.filter((a) => a.addressId !== id));
  }, []);

  /* design tokens */
  const lineInput =
    "w-full rounded-none border-0 border-b border-neutral-300 bg-transparent px-0 py-[10px] text-[15px] placeholder:text-neutral-400 focus:border-neutral-800 focus:ring-0";
  const ghostBtn =
    "rounded-md border border-neutral-300 bg-white px-3 py-[6px] text-[13px] text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100";
  const purpleBtn =
    "rounded-md bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90 disabled:opacity-60";
  const dangerBtn =
    "rounded-md bg-rose-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90 disabled:opacity-60";

  return (
    <div className="mx-auto w-full max-w-[720px]">
      {/* 상단 토스트 */}
      {msg && (
        <Toast
          message={msg}
          type="success"
          onClose={() => setMsg(null)}
          duration={2200}
        />
      )}
      {err && (
        <Toast
          message={err}
          type="error"
          onClose={() => setErr(null)}
          duration={2800}
        />
      )}

      {/* 상단: 아바타 + 이름 + 이미지 변경 */}
      <div className="mb-8 flex items-center gap-4">
        <div className="relative h-[96px] w-[96px] overflow-hidden rounded-full bg-neutral-200">
          <img
            src={imgPreview || currentImageUrl || DEFAULT_AVATAR}
            alt="프로필"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
            }}
          />
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

        {/* 닉네임 */}
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

        {/* 이메일 */}
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

          <div className="items=end mt-4 flex gap-2">
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

        {addrError && !addrMock && (
          <p className="mb-2 text-sm text-rose-600">{String(addrError)}</p>
        )}

        <AddressDetails
          addresses={addrMock ? addressesMock : (addresses ?? [])}
          loading={addrMock ? false : addrLoading}
          onEdit={(addr) => {
            setEditing(addr);
            setAddrOpen(true);
          }}
          onDelete={addrMock ? removeMock : remove}
        />
      </section>

      {/* 하단: 탈퇴 */}
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="rounded-md px-2 py-1 text-[12px] text-neutral-400 hover:text-rose-600"
        >
          탈퇴하기
        </button>
      </div>

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
            name: draft.name.trim(),
            phoneNumber: draft.phoneNumber.trim(),
            zonecode: draft.zonecode.trim(),
            address: draft.address.trim(),
            detailAddress: (draft.detailAddress ?? "").trim(),
          };

          if ((draft as any).addressId) {
            const id = (draft as any).addressId as number;
            await (addrMock ? updateMock(id, payload) : update(id, payload));
          } else {
            await (addrMock ? addMock(payload) : add(payload));
          }
        }}
      />
    </div>
  );
};

export default AccountSettings;

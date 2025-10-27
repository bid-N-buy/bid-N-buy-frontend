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
import Toast from "../../../shared/components/Toast";

import AddressDetails from "../components/myAddress/AddressDetails";
import AddressEditorModal, {
  type AddressDraft,
} from "../components/myAddress/AddressEditorModal";

import BankAccountDetails from "../components/bankAccount/BankAccountDetails";
import BankAccountEditorModal, {
  type BankAccountDraft,
} from "../components/bankAccount/BankAccountEditorModal";

/* =======================
 * 타입
 * ======================= */

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  newPassword2: string;
};

export type Address = {
  name: string;
  phoneNumber: string;
  zonecode: string;
  address: string;
  detailAddress: string;
};

export type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

/* =======================
 * 상수 / 유틸
 * ======================= */

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

/* =======================
 * 메인 AccountSettings
 * ======================= */

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();

  // auth store
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

  // 단일 주소 상태
  const [mainAddress, setMainAddress] = useState<Address | null>(null);
  const [addrLoading, setAddrLoading] = useState<boolean>(true);
  const [addrSaving, setAddrSaving] = useState<boolean>(false);
  const [addrError, setAddrError] = useState<any>(null);
  const [addrOpen, setAddrOpen] = useState<boolean>(false); // 주소 모달

  // 단일 계좌 상태
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankLoading, setBankLoading] = useState<boolean>(true);
  const [bankSaving, setBankSaving] = useState<boolean>(false);
  const [bankError, setBankError] = useState<any>(null);
  const [bankOpen, setBankOpen] = useState<boolean>(false); // 계좌 모달

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

  /** userId 복구 */
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

  /** 첫 로드: 프로필/이미지 + 주소 + 계좌 */
  const onceRef = useRef(false);
  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;

    (async () => {
      // 1. 기본 프로필
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

      // 2. userId 확보 후 프로필 이미지
      const uid = (await resolveUserId()) ?? userIdFromStore;
      if (uid) {
        try {
          const { data } = await api.get(`/auth/${uid}/profile`);
          const raw = data?.profileImageUrl ?? null;
          const abs = makeAbsolute(raw) ?? DEFAULT_AVATAR;
          const bust = `${abs}${abs.includes("?") ? "&" : "?"}v=${Date.now()}`;
          setCurrentImageUrl(bust);
        } catch {
          setCurrentImageUrl(DEFAULT_AVATAR);
        }
      } else {
        setCurrentImageUrl(DEFAULT_AVATAR);
      }

      // 3. 주소 불러오기
      try {
        setAddrLoading(true);

        const res = await api.get("/address", {
          withCredentials: true,
          validateStatus: (s) => s >= 200 && s < 500,
        });

        console.log("[address:res]", res.status, res.data);
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

        console.log("[address:parsed]", rawAddr);

        if (rawAddr) {
          setMainAddress({
            name: rawAddr.name ?? "",
            phoneNumber: rawAddr.phoneNumber ?? "",
            zonecode: rawAddr.zonecode ?? "",
            address: rawAddr.address ?? "",
            detailAddress: rawAddr.detailAddress ?? "",
          });
        } else {
          setMainAddress(null);
        }

        setAddrError(null);
      } catch (e: any) {
        console.log("[address:error]", e?.response?.status, e?.response?.data);
        setAddrError(e?.response ?? e);
      } finally {
        setAddrLoading(false);
      }

      // 4. 계좌 불러오기
      try {
        setBankLoading(true);
        const { data } = await api.get("/bank-account", {
          validateStatus: (s) => s >= 200 && s < 500,
        });

        const payload = data?.bankName ? data : data?.data ? data.data : null;

        if (payload) {
          setBankAccount({
            bankName: payload.bankName ?? "",
            accountNumber: payload.accountNumber ?? "",
            accountHolder: payload.accountHolder ?? "",
          });
        } else {
          setBankAccount(null);
        }

        setBankError(null);
      } catch (e: any) {
        setBankError(e?.response ?? e);
      } finally {
        setBankLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const { data } = await api.put(`/auth/${uid}/nickname`, {
        nickname: v,
      });

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

    const optimisticUrl = URL.createObjectURL(imgFile);
    setCurrentImageUrl(optimisticUrl);

    try {
      setImgLoading(true);

      const form = new FormData();
      form.append("images", imgFile);

      const { data } = await api.put(`/auth/${uid}/profile`, form, {
        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",
        withCredentials: true,
        transformRequest: [(body) => body], // 그대로 전송해서 multipart 유지
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

      URL.revokeObjectURL(optimisticUrl);

      setProfile?.({
        nickname: profile?.nickname ?? "NickName",
        email: profile?.email ?? "",
      });

      toast("프로필 이미지가 변경되었습니다.", null);
    } catch (e: any) {
      URL.revokeObjectURL(optimisticUrl);
      setCurrentImageUrl(DEFAULT_AVATAR);

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

  /* ========== 주소 저장 ========== */
  const handleSaveAddress = async (draft: AddressDraft) => {
    if (!draft.name.trim()) return toast(null, "수령인 이름을 입력하세요.");
    if (!draft.phoneNumber.trim()) return toast(null, "전화번호를 입력하세요.");
    if (!draft.zonecode.trim()) return toast(null, "우편번호를 입력하세요.");
    if (!draft.address.trim()) return toast(null, "주소를 입력하세요.");

    try {
      setAddrSaving(true);

      const body = {
        name: draft.name,
        phoneNumber: draft.phoneNumber,
        zonecode: draft.zonecode,
        address: draft.address,
        detailAddress: draft.detailAddress ?? "",
      };

      const { data } = await api.post("/address", body, {
        withCredentials: true,
      });

      setMainAddress({
        name: body.name,
        phoneNumber: body.phoneNumber,
        zonecode: body.zonecode,
        address: body.address,
        detailAddress: body.detailAddress,
      });

      toast(data?.message ?? "주소가 저장되었습니다.", null);
      setAddrOpen(false);
    } catch (e: any) {
      const m =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        "주소 정보를 저장하지 못했습니다.";
      toast(null, m);
    } finally {
      setAddrSaving(false);
    }
  };

  /* ========== 계좌 저장 ========== */
  const handleSaveBank = async (draft: BankAccountDraft) => {
    if (!draft.bankName.trim()) {
      toast(null, "은행명을 입력하세요.");
      return;
    }
    if (!draft.accountNumber.trim()) {
      toast(null, "계좌번호를 입력하세요.");
      return;
    }
    if (!draft.accountHolder.trim()) {
      toast(null, "예금주를 입력하세요.");
      return;
    }

    try {
      setBankSaving(true);

      const body = {
        bankName: draft.bankName,
        accountNumber: draft.accountNumber,
        accountHolder: draft.accountHolder,
      };

      const { data } = await api.post("/bank-account", body, {
        withCredentials: true,
      });

      setBankAccount({
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        accountHolder: body.accountHolder,
      });

      toast(data?.message ?? "계좌 정보가 저장되었습니다.", null);
      setBankOpen(false);
    } catch (e: any) {
      const m =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        "계좌 정보를 저장하지 못했습니다.";
      toast(null, m);
    } finally {
      setBankSaving(false);
    }
  };

  /* 디자인 토큰 */
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

      {/* 주소 (단일) */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-[16px] font-bold text-neutral-900">주소</h5>

          {/* <button
            type="button"
            className="rounded-full bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90"
            onClick={() => {
              setAddrOpen(true);
            }}
          >
            {mainAddress ? "수정" : "등록"}
          </button> */}
        </div>

        {addrError && !mainAddress && (
          <p className="mb-2 text-sm text-rose-600">{String(addrError)}</p>
        )}

        <AddressDetails
          address={mainAddress}
          loading={addrLoading}
          error={addrError}
          onEdit={() => {
            setAddrOpen(true);
          }}
        />
      </section>

      {/* 정산 계좌 (단일) */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-[16px] font-bold text-neutral-900">정산 계좌</h5>

          {/* <button
            type="button"
            className="rounded-full bg-purple-600 px-3 py-[6px] text-[13px] text-white hover:opacity-90"
            onClick={() => {
              setBankOpen(true);
            }}
          >
            {bankAccount ? "수정" : "등록"}
          </button> */}
        </div>

        {bankError && !bankAccount && (
          <p className="mb-2 text-sm text-rose-600">{String(bankError)}</p>
        )}

        <BankAccountDetails
          account={bankAccount}
          loading={bankLoading}
          error={bankError}
          onEdit={() => {
            setBankOpen(true);
          }}
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

      {/* 주소 모달 */}
      <AddressEditorModal
        open={addrOpen}
        initial={mainAddress}
        saving={addrSaving}
        onClose={() => {
          setAddrOpen(false);
        }}
        onSave={handleSaveAddress}
      />

      {/* 계좌 모달 */}
      <BankAccountEditorModal
        open={bankOpen}
        initial={bankAccount}
        saving={bankSaving}
        onClose={() => {
          setBankOpen(false);
        }}
        onSave={handleSaveBank}
      />
    </div>
  );
};

export default AccountSettings;

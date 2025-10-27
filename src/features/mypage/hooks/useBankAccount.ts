// src/features/mypage/hooks/useBankAccount.ts
import { useEffect, useState, useCallback } from "react";
import api from "../../../shared/api/axiosInstance";
import type { BankAccount, BankAccountDraft } from "../types/bankAccount";

export function useBankAccount() {
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  // GET /bank-account
  const fetchAccount = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/bank-account", {
        validateStatus: (s) => s >= 200 && s < 500,
      });

      // 백엔드 응답 형태가 { bankName, accountNumber, accountHolder }
      // 또는 { data: { ... } } 인지에 따라 커버
      const payload = data?.bankName ? data : data?.data ? data.data : null;

      if (payload) {
        setAccount({
          bankName: payload.bankName ?? "",
          accountNumber: payload.accountNumber ?? "",
          accountHolder: payload.accountHolder ?? "",
        });
        setError(null);
      } else {
        // 없는 경우 (등록 전)
        setAccount(null);
      }
    } catch (e: any) {
      setError(e?.response ?? e);
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /bank-account
  const saveAccount = useCallback(async (draft: BankAccountDraft) => {
    try {
      setSaving(true);
      const body = {
        bankName: draft.bankName,
        accountNumber: draft.accountNumber,
        accountHolder: draft.accountHolder,
      };
      const { data } = await api.post("/bank-account", body, {
        withCredentials: true,
      });

      // 성공하면 로컬 상태 갱신
      setAccount({
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        accountHolder: body.accountHolder,
      });

      return {
        ok: true,
        message: data?.message ?? "계좌 정보가 저장되었습니다.",
      };
    } catch (e: any) {
      return {
        ok: false,
        message:
          e?.response?.data?.message ??
          e?.response?.data?.error ??
          "계좌 정보를 저장하지 못했습니다.",
      };
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  return {
    account,
    loading,
    saving,
    error,
    refetch: fetchAccount,
    saveAccount,
  };
}

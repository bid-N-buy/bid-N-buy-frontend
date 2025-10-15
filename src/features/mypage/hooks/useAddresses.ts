import { useEffect, useMemo, useState, useCallback } from "react";
import type { Address, AddressDraft } from "../types/address";

const LS_KEY = "demo-addresses";
const sleep = (ms = 300) => new Promise((r) => setTimeout(r, ms));

/** 초기 더미 데이터 */
const seed: Address[] = [
  {
    id: 1001,
    receiver: "홍길동",
    phone: "010-1234-5678",
    postcode: "06236",
    address1: "서울 강남구 테헤란로 123",
    address2: "8층 801호",
    isDefault: true,
  },
  {
    id: 1002,
    receiver: "김영희",
    phone: "010-9999-0000",
    postcode: "04146",
    address1: "서울 마포구 백범로 35",
    address2: "301동 1202호",
    isDefault: false,
  },
];

function loadFromLS(): Address[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToLS(addrs: Address[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(addrs));
  } catch {
    // ignore
  }
}

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 최초 로드: 없으면 시드 넣기
  useEffect(() => {
    try {
      const existing = loadFromLS();
      if (existing.length === 0) {
        saveToLS(seed);
        setAddresses(seed);
      } else {
        setAddresses(existing);
      }
    } catch (e) {
      setError("주소를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (draft: AddressDraft) => {
    setLoading(true);
    await sleep();
    setAddresses((prev) => {
      const next: Address[] = [...prev];
      const newId = Date.now();
      // 기본 주소로 저장하면 나머지 기본 해제
      if (draft.isDefault) {
        next.forEach((a) => (a.isDefault = false));
      }
      const added: Address = { id: newId, ...draft };
      next.unshift(added);
      saveToLS(next);
      return next;
    });
    setLoading(false);
  }, []);

  const update = useCallback(async (id: number, draft: AddressDraft) => {
    setLoading(true);
    await sleep();
    setAddresses((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...draft, id } : a));
      // 기본 주소는 하나만
      if (draft.isDefault) {
        next.forEach((a) => {
          if (a.id !== id) a.isDefault = false;
        });
      }
      saveToLS(next);
      return next;
    });
    setLoading(false);
  }, []);

  const remove = useCallback(async (id: number) => {
    const ok = confirm("이 주소를 삭제할까요?");
    if (!ok) return;
    setLoading(true);
    await sleep();
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      // 기본 주소가 사라졌다면 남아있는 첫번째를 기본으로 설정(선택)
      if (next.length > 0 && !next.some((a) => a.isDefault)) {
        next[0].isDefault = true;
      }
      saveToLS(next);
      return next;
    });
    setLoading(false);
  }, []);

  return useMemo(
    () => ({ addresses, loading, error, add, update, remove }),
    [addresses, loading, error, add, update, remove]
  );
}

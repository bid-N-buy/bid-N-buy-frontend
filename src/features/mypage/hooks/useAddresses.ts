import { useCallback, useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { Address, AddressDraft } from "../types/address";

/**
 * 주소 훅
 * - 실제 API가 401/403/404/네트워크 오류면 자동으로 목업 모드 전환
 * - 목업 모드: 인메모리 스토어 (세션 동안 유지)
 */

/* ──────────────── 모듈 전역: 목업 스위치 & 인메모리 스토어 ──────────────── */
let MOCK_ENABLED = false; // 최초엔 실제 API 시도 → 실패 시 true
let mockIdSeq = 4;

let mockStore: Address[] = [
  {
    addressId: 1,
    name: "테스트",
    phoneNumber: "010-1234-5678",
    zonecode: "03987",
    address: "서울시 마포구 월드컵북로",
    detailAddress: "상암동 123-45 101호",
    createdAt: "2025-10-20T15:34:57.119108",
    updatedAt: "2025-10-20T15:59:01.324134",
  },
  {
    addressId: 4,
    name: "테스트",
    phoneNumber: "010-1234-5678",
    zonecode: "03987",
    address: "서울시 마포구 월드컵북로",
    detailAddress: "상암동 123-45 102호",
    createdAt: "2025-10-20T16:29:52.830973",
    updatedAt: "2025-10-20T16:29:52.830973",
  },
];

const sleep = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/* ──────────────── 실제 API 래퍼 (서버 스펙에 맞춤) ──────────────── */
const BASE = "/address";

async function apiFetchAll(): Promise<Address[]> {
  const { data } = await api.get<Address[]>(BASE); // GET /address
  return data; // 서버가 배열을 그대로 반환
}

async function apiAdd(draft: AddressDraft): Promise<Address> {
  const { data } = await api.post<Address>(BASE, draft); // POST /address
  return data;
}

async function apiUpdate(
  id: number,
  patch: Partial<AddressDraft>
): Promise<Address> {
  const { data } = await api.put<Address>(`${BASE}/${id}`, patch); // PUT /address/{id}
  return data;
}

async function apiRemove(id: number): Promise<void> {
  await api.delete(`${BASE}/${id}`); // DELETE /address/{id}
}

/* ──────────────── 목업 구현 (서버 스펙 타입 준수) ──────────────── */
async function mockFetchAll(): Promise<Address[]> {
  await sleep();
  return clone(mockStore);
}

async function mockAdd(draft: AddressDraft): Promise<Address> {
  await sleep();
  const now = new Date().toISOString();
  const next: Address = {
    addressId: ++mockIdSeq,
    ...draft,
    createdAt: now,
    updatedAt: now,
  };
  mockStore = [next, ...mockStore];
  return next;
}

async function mockUpdate(
  id: number,
  patch: Partial<AddressDraft>
): Promise<Address> {
  await sleep();
  let updated!: Address;
  mockStore = mockStore.map((a) => {
    if (a.addressId !== id) return a;
    updated = {
      ...a,
      ...patch,
      addressId: id,
      updatedAt: new Date().toISOString(),
    };
    return updated;
  });
  return updated;
}

async function mockRemove(id: number): Promise<void> {
  await sleep();
  mockStore = mockStore.filter((a) => a.addressId !== id);
}

/* ──────────────── 훅 본체 ──────────────── */
export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let items: Address[];
      if (!MOCK_ENABLED) {
        try {
          items = await apiFetchAll();
        } catch (e: any) {
          const status = e?.response?.status;
          if (status === 401 || status === 403 || status === 404 || !status) {
            MOCK_ENABLED = true;
            items = await mockFetchAll();
          } else {
            throw e;
          }
        }
      } else {
        items = await mockFetchAll();
      }

      setAddresses(items);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "주소 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(); // 최초 1회
  }, [fetchAll]);

  const add = useCallback(
    async (draft: AddressDraft) => {
      if (MOCK_ENABLED) {
        await mockAdd(draft);
      } else {
        try {
          await apiAdd(draft);
        } catch (e: any) {
          const status = e?.response?.status;
          if (status === 401 || status === 403 || status === 404 || !status) {
            MOCK_ENABLED = true;
            await mockAdd(draft);
          } else {
            throw e;
          }
        }
      }
      await fetchAll();
    },
    [fetchAll]
  );

  const update = useCallback(
    async (id: number, patch: Partial<AddressDraft>) => {
      if (MOCK_ENABLED) {
        await mockUpdate(id, patch);
      } else {
        try {
          await apiUpdate(id, patch);
        } catch (e: any) {
          const status = e?.response?.status;
          if (status === 401 || status === 403 || status === 404 || !status) {
            MOCK_ENABLED = true;
            await mockUpdate(id, patch);
          } else {
            throw e;
          }
        }
      }
      await fetchAll();
    },
    [fetchAll]
  );

  const remove = useCallback(
    async (id: number) => {
      if (MOCK_ENABLED) {
        await mockRemove(id);
      } else {
        try {
          await apiRemove(id);
        } catch (e: any) {
          const status = e?.response?.status;
          if (status === 401 || status === 403 || status === 404 || !status) {
            MOCK_ENABLED = true;
            await mockRemove(id);
          } else {
            throw e;
          }
        }
      }
      await fetchAll();
    },
    [fetchAll]
  );

  return { addresses, loading, error, add, update, remove };
}

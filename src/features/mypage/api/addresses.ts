import api from "../../../shared/api/axiosInstance";
import type { Address } from "../types/address";

export async function getAddresses(): Promise<Address[]> {
  const { data } = await api.get<Address[]>("/users/me/addresses");
  return data ?? [];
}

type SavePayload = Omit<Address, "id">;

export async function createAddress(body: SavePayload) {
  const { data } = await api.post<Address>("/users/me/addresses", body);
  return data;
}

export async function updateAddress(id: number, body: SavePayload) {
  const { data } = await api.put<Address>(`/users/me/addresses/${id}`, body);
  return data;
}

export async function deleteAddressApi(id: number) {
  const { data } = await api.delete<{ message?: string }>(
    `/users/me/addresses/${id}`
  );
  return data;
}

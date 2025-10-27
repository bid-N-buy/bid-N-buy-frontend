/** 서버 스펙 기반 Address 타입 */
export type Address = {
  addressId?: number; // id → addressId
  name: string; // receiver → name
  phoneNumber: string; // phone → phoneNumber
  zonecode: string; // postcode → zonecode
  address: string; // address1 → address
  detailAddress?: string; // address2 → detailAddress
  createdAt?: string;
  updatedAt?: string;
};

/** 등록/수정 시 사용되는 Draft 타입 */
export type AddressDraft = Omit<
  Address,
  "addressId" | "createdAt" | "updatedAt"
>;
a;

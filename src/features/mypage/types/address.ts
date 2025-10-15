export type Address = {
  id: number;
  receiver: string;
  phone: string;
  postcode: string;
  address1: string;
  address2?: string;
  isDefault: boolean;
};

export type AddressDraft = Omit<Address, "id">;

export type AddressLabel = "Home" | "Office" | "Other";

export type CustomerAddress = {
  id: string;
  label: AddressLabel;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  joinedDate: string;
};

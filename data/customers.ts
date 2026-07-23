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
  addresses: CustomerAddress[];
  wishlist: string[];
};

export const customers: Customer[] = [
  {
    id: "1",
    name: "Nusrat Jahan",
    email: "nusrat.jahan@example.com",
    phone: "+8801711223344",
    avatar: null,
    joinedDate: "2025-02-10",
    addresses: [
      {
        id: "1-1",
        label: "Home",
        fullName: "Nusrat Jahan",
        phone: "+8801711223344",
        street: "House 12, Road 5, Dhanmondi",
        city: "Dhaka",
        state: "Dhaka Division",
        zipCode: "1209",
        isDefault: true,
      },
      {
        id: "1-2",
        label: "Office",
        fullName: "Nusrat Jahan",
        phone: "+8801711998800",
        street: "Level 6, Gulshan Avenue",
        city: "Dhaka",
        state: "Dhaka Division",
        zipCode: "1212",
        isDefault: false,
      },
      {
        id: "1-3",
        label: "Home",
        fullName: "Nusrat Jahan",
        phone: "+8801711223399",
        street: "Flat 4B, Baridhara Road",
        city: "Dhaka",
        state: "Dhaka Division",
        zipCode: "1206",
        isDefault: false,
      },
    ],
    wishlist: ["1", "4", "12"],
  },
  {
    id: "2",
    name: "Tanvir Ahmed",
    email: "tanvir.ahmed@example.com",
    phone: "+8801812345678",
    avatar: null,
    joinedDate: "2025-05-22",
    addresses: [
      {
        id: "2-1",
        label: "Home",
        fullName: "Tanvir Ahmed",
        phone: "+8801812345678",
        street: "45 Agrabad Access Road",
        city: "Chattogram",
        state: "Chattogram Division",
        zipCode: "4100",
        isDefault: true,
      },
    ],
    wishlist: ["2", "17"],
  },
  {
    id: "3",
    name: "Farzana Akter",
    email: "farzana.akter@example.com",
    phone: "+8801911998877",
    avatar: null,
    joinedDate: "2024-11-03",
    addresses: [
      {
        id: "3-1",
        label: "Home",
        fullName: "Farzana Akter",
        phone: "+8801911998877",
        street: "House 3, Sector 7, Uttara",
        city: "Dhaka",
        state: "Dhaka Division",
        zipCode: "1230",
        isDefault: true,
      },
    ],
    wishlist: ["5", "13", "19"],
  },
  {
    id: "4",
    name: "Rakibul Islam",
    email: "rakibul.islam@example.com",
    phone: "+8801611556677",
    avatar: null,
    joinedDate: "2025-07-01",
    addresses: [
      {
        id: "4-1",
        label: "Home",
        fullName: "Rakibul Islam",
        phone: "+8801611556677",
        street: "Zindabazar Road",
        city: "Sylhet",
        state: "Sylhet Division",
        zipCode: "3100",
        isDefault: true,
      },
    ],
    wishlist: ["15", "18"],
  },
  {
    id: "5",
    name: "Sadia Islam",
    email: "sadia.islam@example.com",
    phone: "+8801511332211",
    avatar: null,
    joinedDate: "2025-01-18",
    addresses: [
      {
        id: "5-1",
        label: "Home",
        fullName: "Sadia Islam",
        phone: "+8801511332211",
        street: "Shaheb Bazar",
        city: "Rajshahi",
        state: "Rajshahi Division",
        zipCode: "6000",
        isDefault: true,
      },
    ],
    wishlist: ["3", "9", "14"],
  },
  {
    id: "6",
    name: "Imran Kabir",
    email: "imran.kabir@example.com",
    phone: "+8801311887766",
    avatar: null,
    joinedDate: "2024-09-27",
    addresses: [
      {
        id: "6-1",
        label: "Home",
        fullName: "Imran Kabir",
        phone: "+8801311887766",
        street: "Boro Bazar",
        city: "Khulna",
        state: "Khulna Division",
        zipCode: "9000",
        isDefault: true,
      },
    ],
    wishlist: ["16", "20"],
  },
];

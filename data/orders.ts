export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  productName: string;
  image: string | null;
  placedOn: string;
  totalPrice: number;
  status: OrderStatus;
};

export const orders: Order[] = [
  {
    id: "1",
    orderNumber: "ES-46001",
    customerId: "1",
    productName: "Zero Waste Starter Kit",
    image: null,
    placedOn: "2026-07-18",
    totalPrice: 45.0,
    status: "processing",
  },
  {
    id: "2",
    orderNumber: "ES-45920",
    customerId: "1",
    productName: "Eco-Bamboo Hydration Kit",
    image: null,
    placedOn: "2026-07-10",
    totalPrice: 128.5,
    status: "shipped",
  },
  {
    id: "3",
    orderNumber: "ES-45812",
    customerId: "1",
    productName: "Sustainable Living Bundle",
    image: null,
    placedOn: "2026-06-28",
    totalPrice: 84.2,
    status: "delivered",
  },
  {
    id: "4",
    orderNumber: "ES-45710",
    customerId: "1",
    productName: "Organic Pantry Restock Box",
    image: null,
    placedOn: "2026-06-14",
    totalPrice: 62.75,
    status: "delivered",
  },
  {
    id: "5",
    orderNumber: "ES-45602",
    customerId: "1",
    productName: "Reusable Kitchen Essentials Set",
    image: null,
    placedOn: "2026-05-30",
    totalPrice: 96.4,
    status: "delivered",
  },
  {
    id: "6",
    orderNumber: "ES-45501",
    customerId: "1",
    productName: "Compostable Party Supplies Pack",
    image: null,
    placedOn: "2026-05-12",
    totalPrice: 33.1,
    status: "cancelled",
  },
  {
    id: "7",
    orderNumber: "ES-45410",
    customerId: "2",
    productName: "Solar Garden Light Set",
    image: null,
    placedOn: "2026-06-20",
    totalPrice: 54.0,
    status: "delivered",
  },
];

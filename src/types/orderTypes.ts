import { StoredCartItem } from "./globals";

export type OrderSummaryItem = {
    id: number;
    menu_item_id: number;
    item_name: string;
    unit_price: number;
    quantity: number;
    special_request: string | null;
    subtotal: number;
    created_at: string | null;
    updated_at: string | null;
};

export type OrderSummary = {
    order: {
        id: number;
        status: string;
        items: OrderSummaryItem[];
        subtotal: number;
    }[];
    cart_items: StoredCartItem[];
};

export type ReceiptItem = {
  id: number;
  item_name: string;
  unit_price: number;
  quantity: number;
  special_request: string | null;
  subtotal: number;
};

export type ReceiptOrder = {
  id: number;
  status: string;
  items: ReceiptItem[];
  subtotal: number;
};
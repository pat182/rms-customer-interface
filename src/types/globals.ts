

export type StoredCartItem = {
  itemId: number;
  itemName: string;
  unitPrice: number;
  quantity: number;
  specialRequest: string;
};

export type ViewOrdersBarProps = {
  tableQr: string;
}
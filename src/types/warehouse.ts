export interface WarehouseItem {
  ean: string;
  name: string;
  quantity: number;
  priceNet: number;
  priceGross: number;
  vat: number;
  source?: string;
}

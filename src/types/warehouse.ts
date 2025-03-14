export type WarehouseItem = {
  ean: string;
  name: string;
  quantity: number;
  priceNet: number;
  vat: number;
  source: string;
  priceGross: number;
};

export type WarehouseAvailability = {
  quantity: number;
  priceNet: number;
  vat: number;
  name: string;
  priceGross: number;
  source: string;
};

export type AggregatedProduct = {
  ean: string;
  availableOn: WarehouseAvailability[];
};

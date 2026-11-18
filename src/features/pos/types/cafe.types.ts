// ============================================================================
// Cafe POS Specific Type Definitions - QuickOne Cafe & Bakery
// ============================================================================

import {
  CategoryEntity,
  MenuItemEntity,
  ToppingEntity,
  DiningTableEntity,
  ShopSettingsEntity,
  SelectedTopping,
  OrderType,
  OrderStatus,
  PaymentMethod,
  PricingMatrix,
  SizePriceConfig,
  TempPriceConfig,
} from "@/types/database.types";

export type Temperature = "ຮ້ອນ" | "ເຢັນ" | "ປັ່ນ" | "ປົກກະຕິ" | string;
export type CupSize = "S" | "M" | "L" | "ມາດຕະຖານ" | string;
export type Sweetness = "0%" | "25%" | "50%" | "100%" | "120%" | "ປົກກະຕິ" | string;
export type IceLevel = "ປົກກະຕິ" | "ນ້ຳກ້ອນໜ້ອຍ" | "ບໍ່ໃສ່ນ້ຳກ້ອນ" | "ແຍກນ້ຳກ້ອນ" | string;
export type PosScreenTab = "terminal" | "tables" | "kds";

export interface CafeCartItem {
  id: string; // Unique composite key: ${menuItemId}_${temp}_${size}_${sweetness}_${ice}_${toppingsHash}
  menuItemId: string;
  name: string;
  name_en?: string;
  imageUrl?: string;
  temperature: Temperature;
  size: CupSize;
  sweetness: Sweetness;
  iceLevel: IceLevel;
  selectedToppings: SelectedTopping[];
  itemNote?: string;
  quantity: number;
  unitPrice: number;
  subtotalPrice: number;
  discountAmount: number;
  totalPrice: number;
}

export interface CafePosTotals {
  subtotal: number;
  discount: number;
  vatAmount: number;
  finalTotal: number;
  totalItemCount: number;
}

export interface CafeBillTab {
  id: string;
  tabTitle: string;
  items: CafeCartItem[];
  orderType: OrderType;
  tableId?: string | null;
  tableCode?: string | null;
  buzzerNumber?: string | null;
  customerNote?: string | null;
  heldAt?: string;
}

export {
  type CategoryEntity,
  type MenuItemEntity,
  type ToppingEntity,
  type DiningTableEntity,
  type ShopSettingsEntity,
  type SelectedTopping,
  type OrderType,
  type OrderStatus,
  type PaymentMethod,
};

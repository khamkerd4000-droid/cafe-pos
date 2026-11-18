// ============================================================================
// Dexie.js (IndexedDB) Local-First Database - QuickOne Cafe & Bakery POS
// Real Data Caching & Local Queue (Zero Mock Data)
// ============================================================================

import Dexie, { type EntityTable } from "dexie";
import {
  ShopSettingsEntity,
  CategoryEntity,
  MenuItemEntity,
  ToppingEntity,
  DiningTableEntity,
  CashierShiftEntity,
  OrderEntity,
  OrderItemEntity,
} from "@/types/database.types";

export interface LocalSyncQueueItem {
  id?: number;
  entity_type: "order" | "shift" | "table_status" | "menu_item" | "audit_log";
  entity_id: string;
  action: "INSERT" | "UPDATE";
  payload: Record<string, any>;
  status: "pending" | "processing" | "failed" | "synced";
  retry_count: number;
  error_message?: string;
  created_at: string;
}

export interface LocalShift {
  id: string;
  store_id?: string;
  user_id?: string;
  cashier_name?: string;
  opening_time: string;
  closing_time?: string;
  opening_cash: number;
  expected_closing_cash?: number | null;
  actual_closing_cash?: number | null;
  discrepancy?: number | null;
  status: string;
  notes?: string;
  created_at?: string;
}

export interface LocalCategory {
  id: string;
  store_id?: string;
  name?: string;
  name_lo?: string;
  name_en?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  product_count?: number;
  created_at?: string;
}

export interface LocalProduct {
  id: string;
  store_id?: string;
  category_id?: string;
  barcode?: string;
  sku?: string;
  name_lo?: string;
  name?: string;
  name_en?: string;
  image_url?: string;
  cost_price?: number;
  base_price?: number;
  selling_price?: number;
  base_unit?: string;
  is_active?: boolean;
  is_perishable?: boolean;
  is_weighing?: boolean;
  warning_days_before_expiry?: number;
  created_at?: string;
}

export interface LocalProductUnit {
  id: string;
  product_id: string;
  unit_name: string;
  conversion_rate: number;
  selling_price: number;
  barcode?: string;
  is_base_unit?: boolean;
}

export interface LocalProductBatch {
  id: string;
  store_id?: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  batch_number?: string;
  expiry_date?: string;
  quantity?: number;
  quantity_on_hand?: number;
  cost_price?: number;
  is_clearance?: boolean;
  clearance_discount_percent?: number;
  clearance_price?: number;
  received_date?: string;
  created_at?: string;
}

export interface LocalAuditLog {
  id: string;
  store_id?: string;
  user_id?: string;
  role?: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  before_data?: any;
  after_data?: any;
  reason?: string;
  created_at: string;
}

export interface LocalOrder {
  id: string;
  order_number: string;
  queue_number?: number;
  shift_id?: string | null;
  payment_method: string;
  total_amount?: number;
  final_total?: number;
  status?: string;
  order_status?: string;
  created_at?: string;
  offline_created_at?: string;
  items?: any[];
}

export interface LocalOrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  menu_item_id?: string;
  batch_id?: string;
  product_name?: string;
  item_name?: string;
  unit_name?: string;
  conversion_rate?: number;
  unit_price: number;
  quantity: number;
  subtotal_price?: number;
  discount_amount?: number;
  total_price: number;
}

export class CafeDexieDatabase extends Dexie {
  shop_settings!: EntityTable<ShopSettingsEntity, "id">;
  categories!: EntityTable<CategoryEntity, "id">;
  menu_items!: EntityTable<MenuItemEntity, "id">;
  toppings!: EntityTable<ToppingEntity, "id">;
  dining_tables!: EntityTable<DiningTableEntity, "id">;
  cashier_shifts!: EntityTable<CashierShiftEntity, "id">;
  orders!: EntityTable<OrderEntity, "id">;
  order_items!: EntityTable<OrderItemEntity, "id">;
  sync_queue!: EntityTable<LocalSyncQueueItem, "id">;

  // Compatibility tables
  shifts!: EntityTable<LocalShift, "id">;
  products!: EntityTable<LocalProduct, "id">;
  product_units!: EntityTable<LocalProductUnit, "id">;
  product_batches!: EntityTable<LocalProductBatch, "id">;
  audit_logs!: EntityTable<LocalAuditLog, "id">;

  constructor() {
    super("QuickOneCafeDb");

    this.version(2).stores({
      shop_settings: "id",
      categories: "id, sort_order, is_active",
      menu_items: "id, category_id, is_available",
      toppings: "id, is_available",
      dining_tables: "id, table_code, status, zone",
      cashier_shifts: "id, status, opening_time",
      orders: "id, order_number, shift_id, order_status, created_at",
      order_items: "id, order_id, menu_item_id",
      sync_queue: "++id, entity_type, entity_id, status, created_at",
      shifts: "id, status, opening_time",
      products: "id, category_id, barcode",
      product_units: "id, product_id, barcode",
      product_batches: "id, product_id, expiry_date",
      audit_logs: "id, entity_type, entity_id, created_at",
    });
  }
}

export const offlineDb = new CafeDexieDatabase();

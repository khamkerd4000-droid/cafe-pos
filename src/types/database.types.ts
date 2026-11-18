// ============================================================================
// Database & Entity Types for QuickOne Cafe & Bakery POS (Supabase Real Data)
// ============================================================================

export type OrderType = "dine_in" | "takeaway" | "delivery";
export type OrderStatus = "preparing" | "ready" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "lao_qr" | "mixed";
export type TableStatus = "available" | "occupied" | "maintenance";
export type ShiftStatus = "open" | "closed";
export type Temperature = "ຮ້ອນ" | "ເຢັນ" | "ປັ່ນ";
export type CupSize = "S" | "M" | "L";
export type Sweetness = "0%" | "25%" | "50%" | "100%" | "120%";
export type IceLevel = "ປົກກະຕິ" | "ນ້ຳກ້ອນໜ້ອຍ" | "ບໍ່ໃສ່ນ້ຳກ້ອນ" | "ແຍກນ້ຳກ້ອນ";

export interface ShopSettingsEntity {
  id: string;
  name: string;
  name_en?: string;
  branch: string;
  phone: string;
  address?: string;
  tax_code?: string;
  wifi_ssid: string;
  wifi_password: string;
  currency: string;
  printer_config?: {
    paper_size?: string;
    auto_cut?: boolean;
    open_cash_drawer?: boolean;
    sticker_width_mm?: number;
    sticker_height_mm?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CategoryEntity {
  id: string;
  name: string;
  name_en?: string;
  item_type?: "beverage" | "bakery"; // 'beverage' (Đồ uống) | 'bakery' (Bánh ngọt / Đồ ăn)
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface SizePriceConfig {
  code: string; // 'S' | 'M' | 'L'
  name: string; // 'Size S (12oz)'
  price: number;
  enabled: boolean;
}

export interface TempPriceConfig {
  enabled: boolean;
  sizes: SizePriceConfig[];
}

export interface PricingMatrix {
  hot?: TempPriceConfig;
  iced?: TempPriceConfig;
  frappe?: TempPriceConfig;
}

export interface SizeOption {
  code: string;
  name: string;
  price?: number;
  price_delta?: number;
  is_default?: boolean;
}

export interface MenuItemEntity {
  id: string;
  category_id?: string;
  name: string;
  name_en?: string;
  item_type?: "beverage" | "bakery";
  image_url?: string;
  base_price: number;
  has_variants: boolean;
  available_temps: string[]; // ['hot', 'iced', 'frappe']
  price_hot?: number;
  price_iced?: number;
  price_frappe?: number;
  available_sizes: SizeOption[];
  pricing_matrix?: PricingMatrix | null;
  allows_reheat?: boolean;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ToppingEntity {
  id: string;
  name: string;
  name_en?: string;
  price: number;
  is_available: boolean;
  created_at?: string;
}

export interface DiningTableEntity {
  id: string;
  table_code: string;
  zone: string; // 'ໃນຮ້ານ (Indoor)' | 'ສວນ (Garden)' | custom zone
  seats?: number; // e.g. 2, 4, 6, 8 seats
  status: TableStatus; // 'available' | 'occupied' | 'maintenance'
  current_order_id?: string | null;
  seated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CashierShiftEntity {
  id: string;
  cashier_name: string;
  opening_time: string;
  closing_time?: string | null;
  opening_cash: number;
  expected_closing_cash?: number | null;
  actual_closing_cash?: number | null;
  discrepancy?: number | null;
  status: ShiftStatus;
  denomination_counts?: Record<string, number> | null;
  notes?: string | null;
  created_at?: string;
}

export interface SelectedTopping {
  id: string;
  name: string;
  price: number;
}

export interface OrderItemEntity {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  temperature?: Temperature | string;
  size?: CupSize | string;
  sweetness?: Sweetness | string;
  ice_level?: IceLevel | string;
  selected_toppings: SelectedTopping[];
  item_note?: string | null;
  created_at?: string;
}

export interface OrderEntity {
  id: string;
  order_number: string;
  queue_number: number;
  order_type: OrderType;
  table_id?: string | null;
  buzzer_number?: string | null;
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  cash_received: number;
  change_amount: number;
  order_status: OrderStatus;
  shift_id?: string | null;
  cashier_name: string;
  note?: string | null;
  created_at: string;
  items?: OrderItemEntity[];
  table?: DiningTableEntity | null;
}

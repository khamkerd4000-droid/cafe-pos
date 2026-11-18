// ============================================================================
// Orders Type Definitions - QuickOne Cafe & Bakery POS
// ============================================================================

export type OrderPaymentMethod = "cash" | "lao_qr" | "transfer" | "split";
export type OrderRecordStatus = "preparing" | "ready" | "completed" | "cancelled";
export type OrderModeType = "dine_in" | "takeaway" | "delivery";

export interface SelectedToppingInfo {
  id: string;
  name: string;
  price: number;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  menu_item_id?: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  temperature?: string; // 'ຮ້ອນ' | 'ເຢັນ' | 'ປັ່ນ'
  size?: string; // 'S' | 'M' | 'L'
  sweetness?: string; // '0%' | '25%' | '50%' | '100%' | '120%'
  ice_level?: string; // 'ປົກກະຕິ' | 'ນ້ຳກ້ອນໜ້ອຍ' | 'ບໍ່ໃສ່ນ້ຳກ້ອນ' | 'ແຍກນ້ຳກ້ອນ'
  selected_toppings?: SelectedToppingInfo[];
  item_note?: string;
  created_at?: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  queue_number: number;
  order_type: OrderModeType;
  table_id?: string | null;
  table_code?: string | null;
  buzzer_number?: string | null;
  subtotal: number;
  discount: number;
  total_amount: number;
  // legacy alias
  final_total?: number;
  payment_method: OrderPaymentMethod;
  cash_received: number;
  change_amount: number;
  order_status: OrderRecordStatus;
  shift_id?: string | null;
  cashier_name?: string;
  note?: string | null;
  created_at: string;
  items?: OrderItemRecord[];
}

export interface VoidOrderInput {
  order_id: string;
  reason: string;
  manager_pin: string;
  notes?: string;
}

export interface OrdersFilter {
  dateRange: "today" | "week" | "month" | "all";
  paymentMethod: "all" | "cash" | "lao_qr" | "transfer";
  status: "all" | "preparing" | "ready" | "completed" | "cancelled";
  searchTerm: string;
  shiftId?: string;
}

export interface OrderKPIs {
  totalRevenue: number;
  completedOrderCount: number;
  cancelledOrderCount: number;
  cashRevenue: number;
  qrRevenue: number;
  averageOrderValue: number;
}

// ============================================================================
// Orders API: Real Supabase Cafe Orders, Items & Void Logic
// 100% Real Supabase - Zero Mock Data
// ============================================================================

import { supabase } from "@/apis/supabase-client";
import {
  OrderRecord,
  OrderItemRecord,
  VoidOrderInput,
} from "../types/order.types";

export const ordersApi = {
  /**
   * Fetches past cafe orders with their items from Supabase.
   */
  async fetchOrders(): Promise<OrderRecord[]> {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.warn("[OrdersApi] Supabase orders error:", error.message);
        return [];
      }

      if (!data) return [];

      const records: OrderRecord[] = data.map((raw: any) => {
        const rawItems = (raw.order_items || []) as any[];
        const items: OrderItemRecord[] = rawItems.map((item) => ({
          id: item.id,
          order_id: item.order_id,
          menu_item_id: item.menu_item_id,
          item_name: item.item_name || "ເມນູເຄື່ອງດື່ມ",
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          total_price: Number(item.total_price) || 0,
          temperature: item.temperature || "ເຢັນ",
          size: item.size || "M",
          sweetness: item.sweetness || "100%",
          ice_level: item.ice_level || "ປົກກະຕິ",
          selected_toppings: Array.isArray(item.selected_toppings)
            ? item.selected_toppings
            : [],
          item_note: item.item_note || "",
          created_at: item.created_at,
        }));

        const totalAmount = Number(raw.total_amount) || Number(raw.final_total) || 0;

        return {
          id: raw.id,
          order_number: raw.order_number || `CF-${raw.id.slice(0, 8)}`,
          queue_number: Number(raw.queue_number) || 1,
          order_type: raw.order_type || "dine_in",
          table_id: raw.table_id,
          table_code: raw.table_code,
          buzzer_number: raw.buzzer_number,
          subtotal: Number(raw.subtotal) || totalAmount,
          discount: Number(raw.discount) || 0,
          total_amount: totalAmount,
          final_total: totalAmount,
          payment_method: raw.payment_method || "cash",
          cash_received: Number(raw.cash_received) || totalAmount,
          change_amount: Number(raw.change_amount) || 0,
          order_status: raw.order_status || "completed",
          shift_id: raw.shift_id,
          cashier_name: raw.cashier_name || "Barista",
          note: raw.note,
          created_at: raw.created_at || new Date().toISOString(),
          items,
        };
      });

      return records;
    } catch (err) {
      console.error("[OrdersApi] fetchOrders failed:", err);
      return [];
    }
  },

  /**
   * Cancel/Void order and free table if dine-in
   */
  async voidOrder(input: VoidOrderInput): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Fetch order to check table_id
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, table_id, order_type")
        .eq("id", input.order_id)
        .single();

      // 2. Mark order as cancelled
      const { error } = await supabase
        .from("orders")
        .update({
          order_status: "cancelled",
          note: input.reason ? `[ຍົກເລີກ]: ${input.reason}` : "[ຍົກເລີກບິນ]",
        })
        .eq("id", input.order_id);

      if (error) {
        return { success: false, error: error.message };
      }

      // 3. Free table if assigned
      if (orderData?.table_id) {
        await supabase
          .from("dining_tables")
          .update({
            status: "available",
            current_order_id: null,
          })
          .eq("id", orderData.table_id);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "ບໍ່ສາມາດຍົກເລີກບິນໄດ້" };
    }
  },
};

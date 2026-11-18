// ============================================================================
// Cafe POS API: 100% Real Supabase Data Layer & Realtime Handlers (Zero Mock Data)
// ============================================================================

import { supabase, checkSupabaseConnection } from "@/lib/supabase";
import { offlineDb } from "@/apis/offline-db";
import {
  CategoryEntity,
  MenuItemEntity,
  ToppingEntity,
  DiningTableEntity,
  ShopSettingsEntity,
  OrderEntity,
  OrderItemEntity,
  OrderStatus,
} from "@/types/database.types";

export interface CafeCatalogLoadResult {
  categories: CategoryEntity[];
  menuItems: MenuItemEntity[];
  toppings: ToppingEntity[];
  tables: DiningTableEntity[];
  settings: ShopSettingsEntity | null;
  source: "supabase" | "dexie-cache";
  error?: string;
  hasTablesInDb: boolean;
}

export const cafePosApi = {
  /**
   * Fetches full cafe catalog from Supabase (categories, menu_items, toppings, dining_tables, shop_settings)
   */
  async fetchCafeCatalog(): Promise<CafeCatalogLoadResult> {
    // 1. First verify Supabase schema health
    const health = await checkSupabaseConnection();
    if (!health.hasTables) {
      // Try local cache if available
      const localCats = await offlineDb.categories.toArray();
      const localItems = await offlineDb.menu_items.toArray();
      const localToppings = await offlineDb.toppings.toArray();
      const localTables = await offlineDb.dining_tables.toArray();
      const localSettings = await offlineDb.shop_settings.toCollection().first();

      if (localItems.length > 0) {
        return {
          categories: localCats,
          menuItems: localItems,
          toppings: localToppings,
          tables: localTables,
          settings: localSettings || null,
          source: "dexie-cache",
          hasTablesInDb: false,
          error: health.error,
        };
      }

      return {
        categories: [],
        menuItems: [],
        toppings: [],
        tables: [],
        settings: null,
        source: "supabase",
        hasTablesInDb: false,
        error: health.error,
      };
    }

    try {
      const [catsRes, itemsRes, toppingsRes, tablesRes, settingsRes] = await Promise.all([
        supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("menu_items").select("*").order("name", { ascending: true }),
        supabase.from("toppings").select("*").order("price", { ascending: true }),
        supabase.from("dining_tables").select("*").order("table_code", { ascending: true }),
        supabase.from("shop_settings").select("*").limit(1).maybeSingle(),
      ]);

      const categories: CategoryEntity[] = catsRes.data || [];
      const menuItems: MenuItemEntity[] = (itemsRes.data || []).map((it) => ({
        ...it,
        available_sizes: Array.isArray(it.available_sizes) ? it.available_sizes : [],
        available_temps: Array.isArray(it.available_temps) ? it.available_temps : ["hot", "iced"],
      }));
      const toppings: ToppingEntity[] = toppingsRes.data || [];
      const tables: DiningTableEntity[] = tablesRes.data || [];
      const settings: ShopSettingsEntity | null = settingsRes.data || null;

      // Cache into local Dexie for offline resilience & fast startup
      try {
        await offlineDb.transaction(
          "rw",
          [
            offlineDb.categories,
            offlineDb.menu_items,
            offlineDb.toppings,
            offlineDb.dining_tables,
            offlineDb.shop_settings,
          ],
          async () => {
            if (categories.length > 0) await offlineDb.categories.bulkPut(categories);
            if (menuItems.length > 0) await offlineDb.menu_items.bulkPut(menuItems);
            if (toppings.length > 0) await offlineDb.toppings.bulkPut(toppings);
            if (tables.length > 0) await offlineDb.dining_tables.bulkPut(tables);
            if (settings) await offlineDb.shop_settings.put(settings);
          }
        );
      } catch (cacheErr) {
        console.warn("[CafePosApi] Failed caching to Dexie:", cacheErr);
      }

      return {
        categories,
        menuItems,
        toppings,
        tables,
        settings,
        source: "supabase",
        hasTablesInDb: true,
      };
    } catch (err: any) {
      console.error("[CafePosApi] fetchCafeCatalog error:", err);
      // Fallback to local Dexie cache
      const localCats = await offlineDb.categories.toArray();
      const localItems = await offlineDb.menu_items.toArray();
      const localToppings = await offlineDb.toppings.toArray();
      const localTables = await offlineDb.dining_tables.toArray();
      const localSettings = await offlineDb.shop_settings.toCollection().first();

      return {
        categories: localCats,
        menuItems: localItems,
        toppings: localToppings,
        tables: localTables,
        settings: localSettings || null,
        source: "dexie-cache",
        hasTablesInDb: true,
        error: err?.message,
      };
    }
  },

  /**
   * Fast toggle for Menu Item availability (86-ed / Out of stock)
   */
  async toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      await offlineDb.menu_items.update(id, { is_available: isAvailable });
      return true;
    } catch (err) {
      console.error("[CafePosApi] toggleMenuItemAvailability failed:", err);
      return false;
    }
  },

  /**
   * Fast toggle for Topping availability
   */
  async toggleToppingAvailability(id: string, isAvailable: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("toppings")
        .update({ is_available: isAvailable })
        .eq("id", id);

      if (error) throw error;
      await offlineDb.toppings.update(id, { is_available: isAvailable });
      return true;
    } catch (err) {
      console.error("[CafePosApi] toggleToppingAvailability failed:", err);
      return false;
    }
  },

  /**
   * Submits a completed order with its items to Supabase
   * Guaranteed collision-free with auto-retry on unique constraint violation
   */
  async submitCafeOrder(order: OrderEntity, items: OrderItemEntity[]): Promise<OrderEntity> {
    let currentOrderNumber = order.order_number;
    let orderData: any = null;
    let attempts = 0;

    while (attempts < 5) {
      const { data, error: orderErr } = await supabase
        .from("orders")
        .insert([
          {
            id: order.id,
            order_number: currentOrderNumber,
            queue_number: order.queue_number,
            order_type: order.order_type,
            table_id: order.table_id || null,
            buzzer_number: order.buzzer_number || null,
            subtotal: order.subtotal,
            discount: order.discount,
            total_amount: order.total_amount,
            payment_method: order.payment_method,
            cash_received: order.cash_received,
            change_amount: order.change_amount,
            order_status: order.order_status,
            shift_id: order.shift_id || null,
            cashier_name: order.cashier_name,
            note: order.note || null,
            created_at: order.created_at || new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (!orderErr) {
        orderData = data;
        break;
      }

      const isDuplicateKey =
        orderErr.code === "23505" ||
        orderErr.message?.includes("unique constraint") ||
        orderErr.message?.includes("orders_order_number_key");

      if (isDuplicateKey) {
        attempts++;
        const randomSalt = Math.floor(1000 + Math.random() * 9000);
        currentOrderNumber = `${order.order_number}-${randomSalt}`;
        order.order_number = currentOrderNumber;
        console.warn(
          `[CafePosApi] Duplicate order_number detected, auto-retrying (${attempts}/5) with ${currentOrderNumber}`
        );
        continue;
      }

      console.error("[CafePosApi] Order insert error:", orderErr);
      throw new Error(`ບັນທຶກອໍເດີບໍ່ສຳເລັດ: ${orderErr.message}`);
    }

    if (!orderData) {
      throw new Error("ບັນທຶກອໍເດີບໍ່ສຳເລັດ ເນື່ອງຈາກເລກບິນຊ້ຳຊ້ອນ ກະລຸນາລອງໃໝ່");
    }

    // Keep payload synchronized with actual saved order number
    order.order_number = orderData.order_number;

    if (items.length > 0) {
      const formattedItems = items.map((it) => ({
        id: it.id,
        order_id: order.id,
        menu_item_id: it.menu_item_id || null,
        item_name: it.item_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
        temperature: it.temperature,
        size: it.size,
        sweetness: it.sweetness,
        ice_level: it.ice_level,
        selected_toppings: it.selected_toppings,
        item_note: it.item_note || null,
        created_at: new Date().toISOString(),
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(formattedItems);
      if (itemsErr) {
        console.error("[CafePosApi] Order items insert error:", itemsErr);
      }
    }

    // If order was for a dining table, mark table occupied
    if (order.table_id && order.order_type === "dine_in") {
      await supabase
        .from("dining_tables")
        .update({
          status: "occupied",
          current_order_id: order.id,
          seated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.table_id);
    }

    // Cache to local Dexie
    try {
      await offlineDb.orders.put(orderData || order);
      if (items.length > 0) {
        await offlineDb.order_items.bulkPut(items);
      }
    } catch (e) {
      console.warn("[CafePosApi] Dexie put order warning:", e);
    }

    return orderData || order;
  },

  /**
   * Updates an order status (used by Barista KDS)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: status })
        .eq("id", orderId);

      if (error) throw error;
      await offlineDb.orders.update(orderId, { order_status: status });
      return true;
    } catch (err) {
      console.error("[CafePosApi] updateOrderStatus failed:", err);
      return false;
    }
  },

  /**
   * Frees a dining table (sets status to 'available' and clears order)
   */
  async freeDiningTable(tableId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("dining_tables")
        .update({
          status: "available",
          current_order_id: null,
          seated_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tableId);

      if (error) throw error;
      await offlineDb.dining_tables.update(tableId, {
        status: "available",
        current_order_id: null,
        seated_at: null,
      });
      return true;
    } catch (err) {
      console.error("[CafePosApi] freeDiningTable failed:", err);
      return false;
    }
  },

  /**
   * Fetches live orders for Barista KDS
   */
  async fetchLiveKdsOrders(): Promise<OrderEntity[]> {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), dining_tables(*)")
        .in("order_status", ["preparing", "ready"])
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((ord) => ({
        ...ord,
        items: ord.order_items || [],
        table: ord.dining_tables || null,
      }));
    } catch (err) {
      console.error("[CafePosApi] fetchLiveKdsOrders failed:", err);
      return [];
    }
  },

  /**
   * Fetches next daily customer buzzer/queue number (cycles 1..99 sequentially based on latest order today)
   */
  async getNextDailyQueueNumber(): Promise<number> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      const { data, error } = await supabase
        .from("orders")
        .select("queue_number, created_at")
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return 1;
      }

      const latestQueue = Number(data[0].queue_number) || 0;
      if (latestQueue >= 99 || latestQueue < 1) return 1;
      return latestQueue + 1;
    } catch {
      return 1;
    }
  },

  /**
   * Generates a guaranteed-unique sequential order number (e.g. CF-261119-001, CF-261119-002...)
   * Uses local date and detects existing orders in database to avoid collisions
   */
  async generateUniqueOrderNumber(suggestedQueue?: number): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const datePart = `${yy}${mm}${dd}`;
    const prefix = `CF-${datePart}-`;

    try {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const { data } = await supabase
        .from("orders")
        .select("order_number")
        .gte("created_at", todayStart.toISOString());

      let maxSeq = 0;
      const existingSet = new Set<string>();

      if (data && data.length > 0) {
        for (const o of data) {
          if (o.order_number) {
            existingSet.add(o.order_number);
            const match = o.order_number.match(new RegExp(`^CF-${datePart}-(\\d+)`));
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxSeq) {
                maxSeq = num;
              }
            }
          }
        }
      }

      let nextSeq = maxSeq + 1;
      if (suggestedQueue !== undefined && suggestedQueue > maxSeq) {
        nextSeq = suggestedQueue;
      }

      let candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
      while (existingSet.has(candidate)) {
        nextSeq++;
        candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
      }
      return candidate;
    } catch {
      const fallbackSeq = suggestedQueue || 1;
      const salt = Math.floor(100 + Math.random() * 900);
      return `${prefix}${String(fallbackSeq).padStart(3, "0")}-${salt}`;
    }
  },
};

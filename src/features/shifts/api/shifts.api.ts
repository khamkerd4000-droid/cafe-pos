// ============================================================================
// Shifts API: Real Supabase CRUD, Blind Cash Reconciliation & Dexie Offline Sync
// Compatible with QuickOne Cafe cashier_shifts & 8 Lao Kip Denominations
// ============================================================================

import { supabase } from "@/apis/supabase-client";
import { offlineDb, LocalShift, LocalAuditLog } from "@/apis/offline-db";
import { DEFAULT_STORE, DEFAULT_CASHIER } from "@/features/pos/constants/pos.constants";
import { useAuthStore } from "@/features/auth";
import {
  ShiftItem,
  CloseShiftBlindInput,
  ShiftClosingSummary,
} from "../types/shift.types";
import {
  calculateDenominationsTotal,
  calculateDiscrepancy,
} from "../utils/shift.util";

export const shiftsApi = {
  /**
   * Fetches the current active shift (status = 'open') from cashier_shifts or shifts.
   */
  async getActiveShift(): Promise<ShiftItem | null> {
    try {
      // 1. Try cashier_shifts first
      let shiftData: any = null;
      const { data: cafeShift, error: cafeErr } = await supabase
        .from("cashier_shifts")
        .select("*")
        .eq("status", "open")
        .order("opening_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cafeErr && cafeShift) {
        shiftData = cafeShift;
      }

      if (!shiftData) return null;

      // 2. Compute sales totals for this shift using valid schema columns
      const { data: ordersData } = await supabase
        .from("orders")
        .select("payment_method, total_amount, order_status")
        .eq("shift_id", shiftData.id);

      let cashSales = 0;
      let transferSales = 0;
      let orderCount = 0;

      if (ordersData) {
        for (const o of ordersData) {
          const isCancelled = o.order_status === "cancelled";
          if (isCancelled) continue;

          orderCount++;
          const amount = Number(o.total_amount) || 0;
          if (o.payment_method === "cash") {
            cashSales += amount;
          } else {
            transferSales += amount;
          }
        }
      }

      const currentUser = useAuthStore.getState().user;

      const activeShift: ShiftItem = {
        id: shiftData.id,
        store_id: shiftData.store_id || DEFAULT_STORE.id,
        user_id: shiftData.user_id || currentUser?.id || DEFAULT_CASHIER.id,
        cashier_name: shiftData.cashier_name || currentUser?.full_name_lo || DEFAULT_CASHIER.name,
        opening_time: shiftData.opening_time || shiftData.opened_at || shiftData.created_at,
        closing_time: shiftData.closing_time || shiftData.closed_at,
        opening_cash: Number(shiftData.opening_cash) || 0,
        expected_closing_cash: shiftData.expected_closing_cash ? Number(shiftData.expected_closing_cash) : null,
        actual_closing_cash: shiftData.actual_closing_cash ? Number(shiftData.actual_closing_cash) : null,
        discrepancy: shiftData.discrepancy ? Number(shiftData.discrepancy) : null,
        status: shiftData.status,
        notes: shiftData.notes,
        created_at: shiftData.created_at,
        total_cash_sales: cashSales,
        total_transfer_sales: transferSales,
        total_orders_count: orderCount,
      };

      // Cache to Dexie
      try {
        await offlineDb.shifts.put({
          id: activeShift.id,
          store_id: activeShift.store_id,
          user_id: activeShift.user_id,
          opening_time: activeShift.opening_time,
          closing_time: activeShift.closing_time || undefined,
          opening_cash: activeShift.opening_cash,
          status: "open",
          created_at: activeShift.created_at || new Date().toISOString(),
        });
      } catch (dexErr) {
        // ignore offline cache put errors
      }

      return activeShift;
    } catch (err) {
      console.error("[ShiftsApi] getActiveShift failed:", err);
      return this.getActiveShiftFromDexie();
    }
  },

  async getActiveShiftFromDexie(): Promise<ShiftItem | null> {
    try {
      const local = await offlineDb.shifts
        .where("status")
        .equals("open")
        .reverse()
        .first();

      if (!local) return null;

      const localOrders = await offlineDb.orders
        .where("shift_id")
        .equals(local.id)
        .toArray();

      const completed = (localOrders as any[]).filter(
        (o) => o.order_status !== "cancelled" && o.status !== "cancelled"
      );
      const cashSales = completed
        .filter((o) => o.payment_method === "cash")
        .reduce((sum, o) => sum + (Number(o.total_amount) || Number(o.final_total) || 0), 0);
      const transferSales = completed
        .filter((o) => (o.payment_method as string) !== "cash")
        .reduce((sum, o) => sum + (Number(o.total_amount) || Number(o.final_total) || 0), 0);

      return {
        ...local,
        status: (local.status as any) || "open",
        store_id: local.store_id || DEFAULT_STORE.id,
        user_id: local.user_id || DEFAULT_CASHIER.id,
        cashier_name: DEFAULT_CASHIER.name,
        total_cash_sales: cashSales,
        total_transfer_sales: transferSales,
        total_orders_count: completed.length,
      };
    } catch {
      return null;
    }
  },

  /**
   * Opens a new shift with the given starting cash float.
   * Ensures STRICTLY only 1 shift can be active/open at any time.
   */
  async openShift(openingCash: number, notes?: string): Promise<ShiftItem> {
    const existingActive = await this.getActiveShift();
    if (existingActive) {
      throw new Error(
        "ມີກະຂາຍເຄື່ອງກຳລັງເປີດຢູ່ແລ້ວ (" +
          new Date(existingActive.opening_time).toLocaleTimeString() +
          "). ກະລຸນາປິດກະເກົ່າກ່ອນເປີດກະໃໝ່."
      );
    }

    const shiftId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const currentUser = useAuthStore.getState().user;
    const storeId = currentUser?.store_id || DEFAULT_STORE.id;
    const userId = currentUser?.id || DEFAULT_CASHIER.id;
    const cashierName = currentUser?.full_name_lo || "ບາຣິສຕ້າ (Barista)";

    const cafePayload = {
      id: shiftId,
      cashier_name: cashierName,
      opening_time: timestamp,
      opening_cash: Number(openingCash) || 0,
      status: "open",
      notes: notes?.trim() || null,
      created_at: timestamp,
    };

    // 1. Insert into cashier_shifts
    try {
      const { error: insertErr } = await supabase
        .from("cashier_shifts")
        .insert([cafePayload]);

      if (insertErr) {
        // Fallback to legacy shifts table if cashier_shifts not found
        console.warn("[ShiftsApi] cashier_shifts insert error, trying shifts:", insertErr.message);
        await supabase.from("shifts").insert([{
          id: shiftId,
          store_id: storeId,
          user_id: userId,
          opening_time: timestamp,
          opening_cash: Number(openingCash) || 0,
          status: "open",
          notes: notes?.trim() || undefined,
          created_at: timestamp,
        }]);
      }
    } catch (e: any) {
      console.warn("[ShiftsApi] Supabase open shift exception:", e?.message);
    }

    // 2. Cache to Dexie
    try {
      await offlineDb.shifts.put({
        id: shiftId,
        store_id: storeId,
        user_id: userId,
        opening_time: timestamp,
        opening_cash: Number(openingCash) || 0,
        status: "open",
        created_at: timestamp,
      });
    } catch {}

    return {
      id: shiftId,
      store_id: storeId,
      user_id: userId,
      cashier_name: cashierName,
      opening_time: timestamp,
      opening_cash: Number(openingCash) || 0,
      status: "open",
      notes: notes?.trim(),
      total_cash_sales: 0,
      total_transfer_sales: 0,
      total_orders_count: 0,
    };
  },

  /**
   * Performs Blind Close:
   * 1. Multiplies actual physical denomination counts (8 Lao Kip notes).
   * 2. Queries system orders for total cash/transfer sales.
   * 3. Calculates expected closing cash & discrepancy.
   * 4. Updates shift to 'closed'.
   */
  async closeShiftBlind(input: CloseShiftBlindInput): Promise<ShiftClosingSummary> {
    const timestamp = new Date().toISOString();
    const actualCash =
      typeof input.actual_cash_entered === "number" && input.actual_cash_entered >= 0
        ? input.actual_cash_entered
        : calculateDenominationsTotal(input.counts);

    // 1. Read shift details
    let shiftData: any = null;
    const { data: cafeShift } = await supabase
      .from("cashier_shifts")
      .select("*")
      .eq("id", input.shift_id)
      .maybeSingle();

    if (cafeShift) {
      shiftData = cafeShift;
    } else {
      const { data: legacyShift } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", input.shift_id)
        .maybeSingle();
      shiftData = legacyShift;
    }

    if (!shiftData) {
      throw new Error(`ບໍ່ພົບຂໍ້ມູນກະທີ່ຕ້ອງການປິດ: ${input.shift_id}`);
    }

    const openingCash = Number(shiftData.opening_cash) || 0;

    // 2. Query orders in this shift to calculate expected cash
    const { data: ordersData } = await supabase
      .from("orders")
      .select("payment_method, total_amount, order_status")
      .eq("shift_id", input.shift_id);

    let cashSales = 0;
    let transferSales = 0;
    let orderCount = 0;

    if (ordersData) {
      for (const o of ordersData) {
        const isCancelled = o.order_status === "cancelled";
        if (isCancelled) continue;

        orderCount++;
        const amount = Number(o.total_amount) || 0;
        if (o.payment_method === "cash") {
          cashSales += amount;
        } else {
          transferSales += amount;
        }
      }
    }

    const expectedCash = openingCash + cashSales;
    const discrepancy = calculateDiscrepancy(actualCash, expectedCash);

    // 3. Update Supabase record
    const updatePayload = {
      closing_time: timestamp,
      expected_closing_cash: expectedCash,
      actual_closing_cash: actualCash,
      discrepancy: discrepancy,
      status: "closed",
      denomination_counts: input.counts,
      notes: input.notes?.trim() || null,
    };

    try {
      const { error: cafeUpdateErr } = await supabase
        .from("cashier_shifts")
        .update(updatePayload)
        .eq("id", input.shift_id);

      if (cafeUpdateErr) {
        await supabase
          .from("shifts")
          .update(updatePayload)
          .eq("id", input.shift_id);
      }
    } catch (e: any) {
      console.warn("[ShiftsApi] Supabase close shift exception:", e?.message);
    }

    // 4. Update Dexie
    try {
      await offlineDb.shifts.update(input.shift_id, {
        closing_time: timestamp,
        expected_closing_cash: expectedCash,
        actual_closing_cash: actualCash,
        discrepancy: discrepancy,
        status: "closed",
        notes: input.notes?.trim(),
      });
    } catch {}

    const updatedShift: ShiftItem = {
      id: shiftData.id,
      store_id: shiftData.store_id || DEFAULT_STORE.id,
      user_id: shiftData.user_id || DEFAULT_CASHIER.id,
      cashier_name: shiftData.cashier_name || DEFAULT_CASHIER.name,
      opening_time: shiftData.opening_time || shiftData.created_at,
      closing_time: timestamp,
      opening_cash: openingCash,
      expected_closing_cash: expectedCash,
      actual_closing_cash: actualCash,
      discrepancy: discrepancy,
      status: "closed",
      notes: input.notes,
      total_cash_sales: cashSales,
      total_transfer_sales: transferSales,
      total_orders_count: orderCount,
    };

    return {
      shift: updatedShift,
      opening_cash: openingCash,
      cash_sales: cashSales,
      transfer_sales: transferSales,
      expected_cash: expectedCash,
      actual_cash: actualCash,
      discrepancy: discrepancy,
      order_count: orderCount,
      counts: input.counts,
      closed_at: timestamp,
    };
  },

  /**
   * Fetches full shift history.
   */
  async fetchShiftHistory(): Promise<ShiftItem[]> {
    try {
      let data: any[] = [];
      const { data: cafeShifts, error: cafeErr } = await supabase
        .from("cashier_shifts")
        .select("*")
        .order("opening_time", { ascending: false })
        .limit(100);

      if (!cafeErr && cafeShifts) {
        data = cafeShifts;
      }

      return data.map((s) => ({
        id: s.id,
        store_id: s.store_id || DEFAULT_STORE.id,
        user_id: s.user_id || DEFAULT_CASHIER.id,
        cashier_name: s.cashier_name || DEFAULT_CASHIER.name,
        opening_time: s.opening_time || s.created_at,
        closing_time: s.closing_time,
        opening_cash: Number(s.opening_cash) || 0,
        expected_closing_cash: s.expected_closing_cash ? Number(s.expected_closing_cash) : null,
        actual_closing_cash: s.actual_closing_cash ? Number(s.actual_closing_cash) : null,
        discrepancy: s.discrepancy ? Number(s.discrepancy) : null,
        status: s.status,
        notes: s.notes,
        created_at: s.created_at,
      }));
    } catch (err) {
      console.error("[ShiftsApi] fetchShiftHistory error:", err);
      return [];
    }
  },

  /**
   * Force closes an abandoned or stuck shift
   */
  async forceCloseAbandonedShift(shiftId: string, notes?: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const updatePayload = {
      closing_time: timestamp,
      status: "closed",
      notes: notes || "ບັງຄັບປິດກະເກົ່າຄ້າງ",
    };

    try {
      await supabase.from("cashier_shifts").update(updatePayload).eq("id", shiftId);
      await supabase.from("shifts").update(updatePayload).eq("id", shiftId);
      await offlineDb.shifts.update(shiftId, updatePayload as any);
    } catch (err) {
      console.error("[ShiftsApi] forceCloseAbandonedShift error:", err);
    }
  },
};

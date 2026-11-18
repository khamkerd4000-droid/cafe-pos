// ============================================================================
// Order Utilities: Date Range Filtering, KPI Aggregation & Receipt Formatting
// QuickOne Cafe & Bakery POS
// ============================================================================

import { OrderRecord, OrderKPIs } from "../types/order.types";

/**
 * Filters orders by date range preset.
 */
export function filterOrdersByDateRange(
  orders: OrderRecord[],
  range: "today" | "week" | "month" | "all"
): OrderRecord[] {
  if (range === "all") return orders;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (range === "today") {
    return orders.filter((o) => {
      const time = new Date(o.created_at).getTime();
      return time >= startOfDay;
    });
  }

  if (range === "week") {
    const weekAgo = startOfDay - 7 * 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const time = new Date(o.created_at).getTime();
      return time >= weekAgo;
    });
  }

  if (range === "month") {
    const monthAgo = startOfDay - 30 * 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const time = new Date(o.created_at).getTime();
      return time >= monthAgo;
    });
  }

  return orders;
}

/**
 * Computes top summary KPIs for orders.
 */
export function computeOrderKPIs(orders: OrderRecord[]): OrderKPIs {
  let totalRevenue = 0;
  let completedOrderCount = 0;
  let cancelledOrderCount = 0;
  let cashRevenue = 0;
  let qrRevenue = 0;

  for (const o of orders) {
    const amount = Number(o.total_amount) || Number(o.final_total) || 0;
    if (o.order_status !== "cancelled") {
      completedOrderCount++;
      totalRevenue += amount;

      if (o.payment_method === "cash") {
        cashRevenue += amount;
      } else {
        qrRevenue += amount;
      }
    } else {
      cancelledOrderCount++;
    }
  }

  const averageOrderValue =
    completedOrderCount > 0 ? Math.round(totalRevenue / completedOrderCount) : 0;

  return {
    totalRevenue,
    completedOrderCount,
    cancelledOrderCount,
    cashRevenue,
    qrRevenue,
    averageOrderValue,
  };
}

/**
 * Formats ISO date time string for retail receipts in Laos.
 */
export function formatReceiptDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("lo-LA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString || "";
  }
}

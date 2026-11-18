// ============================================================================
// Dashboard Store: State Management for Cafe Metrics & Analytics
// ============================================================================

import { create } from "zustand";
import {
  DashboardTimeRange,
  DashboardKPIs,
  RevenueTimeSeriesPoint,
  PaymentMethodBreakdown,
  OrderTypeBreakdown,
  TopSellingProduct,
  DashboardStockAlert,
  DashboardRecentOrder,
} from "../types/dashboard.types";
import { dashboardApi } from "../api/dashboard.api";

interface DashboardState {
  timeRange: DashboardTimeRange;
  kpis: DashboardKPIs | null;
  revenueSeries: RevenueTimeSeriesPoint[];
  paymentBreakdown: PaymentMethodBreakdown | null;
  orderTypeBreakdown: OrderTypeBreakdown | null;
  topProducts: TopSellingProduct[];
  stockAlerts: DashboardStockAlert[];
  recentOrders: DashboardRecentOrder[];
  isLoading: boolean;

  // Actions
  loadDashboardStats: () => Promise<void>;
  setTimeRange: (range: DashboardTimeRange) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  timeRange: "today",
  kpis: null,
  revenueSeries: [],
  paymentBreakdown: null,
  orderTypeBreakdown: null,
  topProducts: [],
  stockAlerts: [],
  recentOrders: [],
  isLoading: false,

  loadDashboardStats: async () => {
    set({ isLoading: true });
    try {
      const data = await dashboardApi.fetchDashboardStats(get().timeRange);
      set({
        kpis: data.kpis,
        revenueSeries: data.revenueSeries,
        paymentBreakdown: data.paymentBreakdown,
        orderTypeBreakdown: data.orderTypeBreakdown,
        topProducts: data.topProducts,
        stockAlerts: data.stockAlerts,
        recentOrders: data.recentOrders,
        isLoading: false,
      });
    } catch (err) {
      console.error("[useDashboardStore] loadDashboardStats failed:", err);
      set({ isLoading: false });
    }
  },

  setTimeRange: (range) => {
    set({ timeRange: range });
    get().loadDashboardStats();
  },
}));

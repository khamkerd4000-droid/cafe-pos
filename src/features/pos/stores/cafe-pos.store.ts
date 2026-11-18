// ============================================================================
// Cafe POS Store: Zustand Engine for Specialty Coffee Studio POS
// 100% Real Supabase - Zero Mock Data
// ============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  CategoryEntity,
  MenuItemEntity,
  ToppingEntity,
  DiningTableEntity,
  ShopSettingsEntity,
  OrderType,
  OrderStatus,
  CafeCartItem,
  CafePosTotals,
  CafeBillTab,
  PosScreenTab,
} from "../types/cafe.types";
import { cafePosApi } from "../api/cafe-pos.api";
import { OrderEntity } from "@/types/database.types";

interface CafePosState {
  // Catalog & Settings
  categories: CategoryEntity[];
  menuItems: MenuItemEntity[];
  toppings: ToppingEntity[];
  diningTables: DiningTableEntity[];
  shopSettings: ShopSettingsEntity | null;
  isLoadingCatalog: boolean;
  hasTablesInDb: boolean;
  dbError: string | null;
  activeCategory: string;
  searchQuery: string;
  showOnlyAvailable: boolean;

  // View Navigation
  currentTab: PosScreenTab; // 'terminal' | 'tables' | 'kds'

  // Cart & Active Ticket
  orderType: OrderType; // 'dine_in' | 'takeaway' | 'delivery'
  selectedTable: DiningTableEntity | null;
  buzzerNumber: string;
  customerNote: string;
  cart: CafeCartItem[];
  totals: CafePosTotals;
  orderDiscount: number;

  // Multi-Bill Tabs (ບິນ #1, #2...)
  bills: CafeBillTab[];
  activeBillId: string;

  // Barista Modifier Modal
  isModifierModalOpen: boolean;
  selectedMenuItemForModifier: MenuItemEntity | null;
  editingCartItem: CafeCartItem | null;

  // KDS State
  kdsOrders: OrderEntity[];
  isLoadingKds: boolean;

  // Actions
  loadCatalog: () => Promise<void>;
  setCurrentTab: (tab: PosScreenTab) => void;
  setActiveCategory: (catId: string) => void;
  setSearchQuery: (query: string) => void;
  setShowOnlyAvailable: (onlyAvailable: boolean) => void;
  setOrderType: (type: OrderType) => void;
  setSelectedTable: (table: DiningTableEntity | null) => void;
  setBuzzerNumber: (buzzer: string) => void;
  setCustomerNote: (note: string) => void;
  setOrderDiscount: (discount: number) => void;

  // Modifier Modal Open/Close
  openModifierForNewItem: (item: MenuItemEntity) => void;
  openModifierForEditItem: (cartItem: CafeCartItem) => void;
  closeModifierModal: () => void;

  // Cart Manipulations
  addToCartWithModifiers: (item: CafeCartItem) => void;
  updateCartItem: (oldId: string, updatedItem: CafeCartItem) => void;
  updateQuantity: (itemId: string, newQty: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;

  // Multi-bill Actions
  holdCurrentOrder: () => boolean;
  switchBill: (billId: string) => void;
  deleteBill: (billId: string) => void;

  // Table & KDS Actions
  loadKdsOrders: () => Promise<void>;
  updateKdsStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  freeTable: (tableId: string) => Promise<void>;
}

const INITIAL_TOTALS: CafePosTotals = {
  subtotal: 0,
  discount: 0,
  vatAmount: 0,
  finalTotal: 0,
  totalItemCount: 0,
};

function calculateCartTotals(cart: CafeCartItem[], discount: number = 0): CafePosTotals {
  const subtotal = cart.reduce((sum, it) => sum + it.totalPrice, 0);
  const totalItemCount = cart.reduce((sum, it) => sum + it.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discount);

  return {
    subtotal,
    discount,
    vatAmount: 0,
    finalTotal,
    totalItemCount,
  };
}

export const useCafePosStore = create<CafePosState>()(
  persist(
    (set, get) => ({
      categories: [],
      menuItems: [],
      toppings: [],
      diningTables: [],
      shopSettings: null,
      isLoadingCatalog: false,
      hasTablesInDb: true,
      dbError: null,
      activeCategory: "all",
      searchQuery: "",
      showOnlyAvailable: true,

      currentTab: "terminal",

      orderType: "dine_in",
      selectedTable: null,
      buzzerNumber: "",
      customerNote: "",
      cart: [],
      totals: INITIAL_TOTALS,
      orderDiscount: 0,

      bills: [
        {
          id: "bill-1",
          tabTitle: "ບິນ #1",
          items: [],
          orderType: "dine_in",
        },
      ],
      activeBillId: "bill-1",

      isModifierModalOpen: false,
      selectedMenuItemForModifier: null,
      editingCartItem: null,

      kdsOrders: [],
      isLoadingKds: false,

      loadCatalog: async () => {
        set({ isLoadingCatalog: true, dbError: null });
        try {
          const res = await cafePosApi.fetchCafeCatalog();
          set({
            categories: res.categories,
            menuItems: res.menuItems,
            toppings: res.toppings,
            diningTables: res.tables,
            shopSettings: res.settings,
            hasTablesInDb: res.hasTablesInDb,
            dbError: res.error || null,
            isLoadingCatalog: false,
          });
        } catch (err: any) {
          set({
            isLoadingCatalog: false,
            dbError: err?.message || "ບໍ່ສາມາດໂຫຼດເມນູໄດ້",
          });
        }
      },

      setCurrentTab: (tab) => set({ currentTab: tab }),
      setActiveCategory: (catId) => set({ activeCategory: catId }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowOnlyAvailable: (onlyAvailable) => set({ showOnlyAvailable: onlyAvailable }),
      setOrderType: (type) => set({ orderType: type }),
      setSelectedTable: (table) => set({ selectedTable: table }),
      setBuzzerNumber: (buzzer) => set({ buzzerNumber: buzzer }),
      setCustomerNote: (note) => set({ customerNote: note }),
      setOrderDiscount: (discount) => {
        const state = get();
        const nextTotals = calculateCartTotals(state.cart, discount);
        set({ orderDiscount: discount, totals: nextTotals });
      },

      openModifierForNewItem: (item) => {
        set({
          selectedMenuItemForModifier: item,
          editingCartItem: null,
          isModifierModalOpen: true,
        });
      },

      openModifierForEditItem: (cartItem) => {
        const state = get();
        const originalMenuItem = state.menuItems.find((m) => m.id === cartItem.menuItemId) || null;
        set({
          selectedMenuItemForModifier: originalMenuItem,
          editingCartItem: cartItem,
          isModifierModalOpen: true,
        });
      },

      closeModifierModal: () => {
        set({
          isModifierModalOpen: false,
          selectedMenuItemForModifier: null,
          editingCartItem: null,
        });
      },

      addToCartWithModifiers: (newItem) => {
        const state = get();
        // Check if an item with the EXACT SAME configuration exists
        const existingIdx = state.cart.findIndex((i) => i.id === newItem.id);
        let nextCart: CafeCartItem[];

        if (existingIdx > -1) {
          nextCart = [...state.cart];
          const exist = nextCart[existingIdx];
          const newQty = exist.quantity + newItem.quantity;
          nextCart[existingIdx] = {
            ...exist,
            quantity: newQty,
            subtotalPrice: exist.unitPrice * newQty,
            totalPrice: exist.unitPrice * newQty,
          };
        } else {
          nextCart = [newItem, ...state.cart];
        }

        const nextTotals = calculateCartTotals(nextCart, state.orderDiscount);

        // Update active bill
        const activeId = state.activeBillId || "bill-1";
        const nextBills = state.bills.map((b) =>
          b.id === activeId ? { ...b, items: nextCart } : b
        );

        set({
          cart: nextCart,
          totals: nextTotals,
          bills: nextBills,
          isModifierModalOpen: false,
          selectedMenuItemForModifier: null,
          editingCartItem: null,
        });
      },

      updateCartItem: (oldId, updatedItem) => {
        const state = get();
        const nextCart = state.cart.map((i) => (i.id === oldId ? updatedItem : i));
        const nextTotals = calculateCartTotals(nextCart, state.orderDiscount);

        const activeId = state.activeBillId || "bill-1";
        const nextBills = state.bills.map((b) =>
          b.id === activeId ? { ...b, items: nextCart } : b
        );

        set({
          cart: nextCart,
          totals: nextTotals,
          bills: nextBills,
          isModifierModalOpen: false,
          selectedMenuItemForModifier: null,
          editingCartItem: null,
        });
      },

      updateQuantity: (itemId, newQty) => {
        const state = get();
        if (newQty <= 0) {
          state.removeItem(itemId);
          return;
        }

        const nextCart = state.cart.map((i) => {
          if (i.id === itemId) {
            return {
              ...i,
              quantity: newQty,
              subtotalPrice: i.unitPrice * newQty,
              totalPrice: i.unitPrice * newQty,
            };
          }
          return i;
        });

        const nextTotals = calculateCartTotals(nextCart, state.orderDiscount);
        const activeId = state.activeBillId || "bill-1";
        const nextBills = state.bills.map((b) =>
          b.id === activeId ? { ...b, items: nextCart } : b
        );

        set({ cart: nextCart, totals: nextTotals, bills: nextBills });
      },

      removeItem: (itemId) => {
        const state = get();
        const nextCart = state.cart.filter((i) => i.id !== itemId);
        const nextTotals = calculateCartTotals(nextCart, state.orderDiscount);

        const activeId = state.activeBillId || "bill-1";
        const nextBills = state.bills.map((b) =>
          b.id === activeId ? { ...b, items: nextCart } : b
        );

        set({ cart: nextCart, totals: nextTotals, bills: nextBills });
      },

      clearCart: () => {
        const state = get();
        const activeId = state.activeBillId || "bill-1";
        const nextBills = state.bills.map((b) =>
          b.id === activeId ? { ...b, items: [] } : b
        );

        set({
          cart: [],
          totals: INITIAL_TOTALS,
          orderDiscount: 0,
          buzzerNumber: "",
          customerNote: "",
          bills: nextBills,
        });
      },

      holdCurrentOrder: () => {
        const state = get();
        if (state.cart.length === 0) return false;

        const currentId = state.activeBillId || "bill-1";
        const updatedBills = state.bills.map((b) =>
          b.id === currentId
            ? {
                ...b,
                items: [...state.cart],
                orderType: state.orderType,
                tableId: state.selectedTable?.id || null,
                tableCode: state.selectedTable?.table_code || null,
                buzzerNumber: state.buzzerNumber,
                customerNote: state.customerNote,
                heldAt: new Date().toISOString(),
              }
            : b
        );

        // Find next index
        let idx = 1;
        while (updatedBills.some((b) => b.tabTitle === `ບິນ #${idx}`)) {
          idx++;
        }

        const newBillId = `bill-${Date.now()}`;
        const newBill: CafeBillTab = {
          id: newBillId,
          tabTitle: `ບິນ #${idx}`,
          items: [],
          orderType: "dine_in",
        };

        set({
          bills: [...updatedBills, newBill],
          activeBillId: newBillId,
          cart: [],
          totals: INITIAL_TOTALS,
          orderDiscount: 0,
          buzzerNumber: "",
          customerNote: "",
          selectedTable: null,
        });

        return true;
      },

      switchBill: (billId) => {
        const state = get();
        if (billId === state.activeBillId) return;

        const currentId = state.activeBillId || "bill-1";
        const updatedBills = state.bills.map((b) =>
          b.id === currentId
            ? {
                ...b,
                items: [...state.cart],
                orderType: state.orderType,
                tableId: state.selectedTable?.id || null,
                tableCode: state.selectedTable?.table_code || null,
                buzzerNumber: state.buzzerNumber,
                customerNote: state.customerNote,
              }
            : b
        );

        const target = updatedBills.find((b) => b.id === billId);
        if (!target) return;

        const targetTable = target.tableId
          ? state.diningTables.find((t) => t.id === target.tableId) || null
          : null;

        const nextTotals = calculateCartTotals(target.items, 0);

        set({
          bills: updatedBills,
          activeBillId: billId,
          cart: [...target.items],
          totals: nextTotals,
          orderDiscount: 0,
          orderType: target.orderType || "dine_in",
          selectedTable: targetTable,
          buzzerNumber: target.buzzerNumber || "",
          customerNote: target.customerNote || "",
        });
      },

      deleteBill: (billId) => {
        const state = get();
        if (state.bills.length <= 1) {
          // Reset single bill
          const defaultBill: CafeBillTab = {
            id: "bill-1",
            tabTitle: "ບິນ #1",
            items: [],
            orderType: "dine_in",
          };
          set({
            bills: [defaultBill],
            activeBillId: "bill-1",
            cart: [],
            totals: INITIAL_TOTALS,
            orderDiscount: 0,
            selectedTable: null,
            buzzerNumber: "",
            customerNote: "",
          });
          return;
        }

        const nextBills = state.bills.filter((b) => b.id !== billId);
        if (billId === state.activeBillId) {
          const newActive = nextBills[nextBills.length - 1];
          const newTable = newActive.tableId
            ? state.diningTables.find((t) => t.id === newActive.tableId) || null
            : null;
          const nextTotals = calculateCartTotals(newActive.items, 0);

          set({
            bills: nextBills,
            activeBillId: newActive.id,
            cart: [...newActive.items],
            totals: nextTotals,
            orderDiscount: 0,
            orderType: newActive.orderType || "dine_in",
            selectedTable: newTable,
            buzzerNumber: newActive.buzzerNumber || "",
            customerNote: newActive.customerNote || "",
          });
        } else {
          set({ bills: nextBills });
        }
      },

      loadKdsOrders: async () => {
        set({ isLoadingKds: true });
        try {
          const orders = await cafePosApi.fetchLiveKdsOrders();
          set({ kdsOrders: orders, isLoadingKds: false });
        } catch {
          set({ isLoadingKds: false });
        }
      },

      updateKdsStatus: async (orderId, status) => {
        await cafePosApi.updateOrderStatus(orderId, status);
        const state = get();
        if (status === "completed" || status === "cancelled") {
          set({ kdsOrders: state.kdsOrders.filter((o) => o.id !== orderId) });
        } else {
          set({
            kdsOrders: state.kdsOrders.map((o) =>
              o.id === orderId ? { ...o, order_status: status } : o
            ),
          });
        }
      },

      freeTable: async (tableId) => {
        await cafePosApi.freeDiningTable(tableId);
        const state = get();
        set({
          diningTables: state.diningTables.map((t) =>
            t.id === tableId ? { ...t, status: "available", current_order_id: null, seated_at: null } : t
          ),
          selectedTable: state.selectedTable?.id === tableId ? null : state.selectedTable,
        });
      },
    }),
    {
      name: "quickone-cafe-pos-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        totals: state.totals,
        bills: state.bills,
        activeBillId: state.activeBillId,
        orderType: state.orderType,
        selectedTable: state.selectedTable,
        buzzerNumber: state.buzzerNumber,
        customerNote: state.customerNote,
      }),
    }
  )
);

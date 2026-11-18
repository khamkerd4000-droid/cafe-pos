"use client";

// ============================================================================
// OrdersPage: Cafe Sales Order History, 80mm Bill & 50x30mm Cup Sticker Printing
// 100% Real Supabase - Zero Mock Data
// ============================================================================

import React, { useState } from "react";
import {
  Receipt,
  Search,
  RefreshCw,
  Printer,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  X,
  Tag,
  Coffee,
} from "lucide-react";
import { useOrders } from "../hooks/useOrders";
import { useOrderStore } from "../stores/order.store";
import { OrderSummaryCards } from "../components/OrderSummaryCards";
import { OrdersTable } from "../components/OrdersTable";
import { OrderDetailModal } from "../components/OrderDetailModal";
import { VoidOrderDialog } from "../components/VoidOrderDialog";
import { CafeReceipt80mm } from "@/features/pos/components/CafeReceipt80mm";
import { CupSticker50x30 } from "@/features/pos/components/CupSticker50x30";
import { ShiftsPage } from "@/features/shifts";
import { triggerHapticFeedback } from "@/utils/haptics";
import { OrderEntity } from "@/types/database.types";
import { OrderRecord } from "../types/order.types";

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "shifts">("orders");
  const { orders, totalCount, kpis, isLoading, refresh } = useOrders();

  const filters = useOrderStore((s) => s.filters);
  const setDateRange = useOrderStore((s) => s.setDateRange);
  const setPaymentMethod = useOrderStore((s) => s.setPaymentMethod);
  const setStatus = useOrderStore((s) => s.setStatus);
  const setSearchTerm = useOrderStore((s) => s.setSearchTerm);

  const selectedOrderForDetail = useOrderStore((s) => s.selectedOrderForDetail);
  const closeDetail = useOrderStore((s) => s.closeDetail);
  const openVoidDialog = useOrderStore((s) => s.openVoidDialog);
  const orderForReprint = useOrderStore((s) => s.orderForReprint);
  const setReprintOrder = useOrderStore((s) => s.setReprintOrder);

  const [orderForStickers, setOrderForStickers] = useState<OrderRecord | null>(null);

  const handlePrint = () => {
    window.print();
  };

  // Convert OrderRecord to OrderEntity for CafeReceipt80mm & CupSticker50x30
  const convertToEntity = (ord: OrderRecord): OrderEntity => {
    return {
      id: ord.id,
      order_number: ord.order_number,
      queue_number: ord.queue_number,
      order_type: ord.order_type as any,
      table_id: ord.table_id,
      buzzer_number: ord.buzzer_number,
      subtotal: ord.subtotal,
      discount: ord.discount,
      total_amount: ord.total_amount,
      payment_method: ord.payment_method as any,
      cash_received: ord.cash_received,
      change_amount: ord.change_amount,
      order_status: ord.order_status as any,
      shift_id: ord.shift_id,
      cashier_name: ord.cashier_name || "Barista",
      note: ord.note,
      created_at: ord.created_at,
      items: (ord.items || []).map((it) => ({
        id: it.id,
        order_id: it.order_id,
        menu_item_id: it.menu_item_id || undefined,
        item_name: it.item_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
        temperature: it.temperature as any,
        size: it.size as any,
        sweetness: it.sweetness as any,
        ice_level: it.ice_level as any,
        selected_toppings: (it.selected_toppings || []).map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
        })),
        item_note: it.item_note,
        created_at: it.created_at,
      })),
    };
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bar with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2C1810] text-amber-300 shadow-xs">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#2C1810] leading-tight">
              ປະຫວັດບິນ & ຄິວອໍເດີ (Cafe Orders & Shifts)
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              ກວດສອບລາຍການບິນ, ພິມບິນຄືນ (80mm) ແລະ ພິມສະຕິກເກີຕິດຈອກ (50x30mm)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Module Tab Toggle */}
          <div className="flex items-center rounded-2xl border border-stone-200 bg-stone-50 p-1.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(20);
                setActiveTab("orders");
              }}
              className={`flex min-h-[44px] h-11 items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-extrabold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                activeTab === "orders"
                  ? "bg-[#2C1810] text-amber-300 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>ປະຫວັດບິນ ({orders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(20);
                setActiveTab("shifts");
              }}
              className={`flex min-h-[44px] h-11 items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-extrabold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                activeTab === "shifts"
                  ? "bg-[#2C1810] text-amber-300 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>ກະຂາຍເຄື່ອງ (Shifts)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex min-h-[48px] h-12 w-12 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-50 touch-manipulation"
            title="ດຶງຂໍ້ມູນລ່າສຸດ"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin text-amber-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* 2. Tab Contents */}
      {activeTab === "shifts" ? (
        <ShiftsPage />
      ) : (
        <>
          {/* Orders Top Summary KPIs */}
          <OrderSummaryCards kpis={kpis} />

          {/* Orders Filter & Search Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-2xs select-none touch-manipulation">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ຄົ້ນຫາເລກທີບິນ, ຄິວ, ຊື່ເຄື່ອງດື່ມ..."
                className="h-12 w-full rounded-2xl border border-stone-200 pl-10 pr-4 text-xs sm:text-sm font-semibold outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-colors"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Range Chips */}
              <div className="flex items-center rounded-2xl border border-stone-200 bg-stone-50 p-1 shadow-2xs">
                {(["today", "week", "month", "all"] as const).map((r) => {
                  const labelMap = {
                    today: "ມື້ນີ້",
                    week: "7 ວັນ",
                    month: "30 ວັນ",
                    all: "ທັງໝົດ",
                  };
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback(20);
                        setDateRange(r);
                      }}
                      className={`min-h-[40px] h-10 rounded-xl px-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                        filters.dateRange === r
                          ? "bg-[#2C1810] text-amber-300 shadow-sm"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      {labelMap[r]}
                    </button>
                  );
                })}
              </div>

              {/* Payment Method Dropdown */}
              <select
                value={filters.paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="h-12 rounded-2xl border border-stone-200 bg-white px-3.5 text-xs sm:text-sm font-bold text-stone-700 outline-none focus:border-amber-600 cursor-pointer shadow-2xs"
              >
                <option value="all">ທຸກວິທີຊຳລະ (All)</option>
                <option value="cash">ເງິນສົດ (Cash)</option>
                <option value="lao_qr">LAO QR (Transfer)</option>
              </select>

              {/* Status Dropdown */}
              <select
                value={filters.status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="h-12 rounded-2xl border border-stone-200 bg-white px-3.5 text-xs sm:text-sm font-bold text-stone-700 outline-none focus:border-amber-600 cursor-pointer shadow-2xs"
              >
                <option value="all">ທຸກສະຖານະ (All)</option>
                <option value="preparing">ກຳລັງຊົງ (Preparing)</option>
                <option value="ready">ພ້ອມເສີບ (Ready)</option>
                <option value="completed">ສຳເລັດ (Completed)</option>
                <option value="cancelled">ຍົກເລີກ (Cancelled)</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            onPrintSticker={(ord) => setOrderForStickers(ord)}
          />

          {/* Touch-Friendly Order Details Modal */}
          <OrderDetailModal
            order={selectedOrderForDetail}
            isOpen={Boolean(selectedOrderForDetail)}
            onClose={closeDetail}
            onVoid={(ord) => {
              closeDetail();
              openVoidDialog(ord);
            }}
            onReprint={(ord) => {
              setReprintOrder(ord);
            }}
            onPrintStickers={(ord) => {
              setOrderForStickers(ord);
            }}
          />
          <VoidOrderDialog />

          {/* 1. 80mm Reprint Preview Modal */}
          {orderForReprint && (
            <div className="receipt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
              <div className="receipt-modal-card relative w-full max-w-[400px] max-h-[94vh] flex flex-col rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-100 py-3 px-4 shrink-0 bg-[#2C1810] text-white no-print">
                  <h3 className="font-extrabold text-xs sm:text-sm flex items-center gap-2">
                    <Printer className="h-4 w-4 text-amber-400" />
                    <span>ພິມໃບບິນຮັບເງິນ (80mm)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setReprintOrder(null)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Printable container */}
                <div className="receipt-modal-body flex-1 overflow-y-auto min-h-0 bg-stone-100/70 p-4">
                  <CafeReceipt80mm order={convertToEntity(orderForReprint)} />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 py-3 px-4 border-t border-stone-200 shrink-0 bg-white no-print">
                  <button
                    type="button"
                    onClick={() => setReprintOrder(null)}
                    className="h-10 px-4 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    ປິດ
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="h-10 px-5 flex items-center gap-1.5 rounded-xl bg-[#2C1810] text-xs font-black text-amber-300 shadow-md hover:bg-stone-900 active:scale-95 transition-all cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>ກົດພິມບິນ 80mm</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. 50x30mm Cup Sticker Sheet Modal */}
          {orderForStickers && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
              <div className="relative w-full max-w-[420px] max-h-[94vh] flex flex-col rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-100 py-3 px-4 shrink-0 bg-orange-700 text-white no-print">
                  <h3 className="font-extrabold text-xs sm:text-sm flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>ສະຕິກເກີຕິດຈອກ (50x30mm)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOrderForStickers(null)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 text-orange-200 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Printable container */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-stone-100/70 p-4">
                  <div className="text-center text-xs text-stone-500 mb-3 no-print">
                    ແຍກພິມ {orderForStickers.items?.reduce((s, i) => s + i.quantity, 0)} ແຜ່ນ (ຂະໜາດ 50mm x 30mm)
                  </div>
                  <CupSticker50x30 order={convertToEntity(orderForStickers)} />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 py-3 px-4 border-t border-stone-200 shrink-0 bg-white no-print">
                  <button
                    type="button"
                    onClick={() => setOrderForStickers(null)}
                    className="h-10 px-4 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    ປິດ
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="h-10 px-5 flex items-center gap-1.5 rounded-xl bg-orange-600 text-xs font-black text-white shadow-md hover:bg-orange-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <Tag className="h-4 w-4" />
                    <span>ກົດພິມສະຕິກເກີ</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

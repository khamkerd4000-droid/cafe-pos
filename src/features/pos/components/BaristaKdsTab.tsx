"use client";

// ============================================================================
// BaristaKdsTab: Live Barista Kitchen Display System (KDS Queue)
// Realtime Supabase Subscription for Instant New Orders
// Clean 2-Column Kanban Layout:
// - Left (8 Cols): ກຳລັງຊົງ (Preparing Queue)
// - Right (4 Cols): ພ້ອມເສີບ / ລໍຖ້າເອີ້ນລູກຄ້າ (Ready & Delivery)
// Interactive Checklist for Line Items + Large Quantity Badges (x2, x3)
// ZERO EMOJIS - Clean Lucide Icons Exclusively
// NO JUNK TAGS for Bakery / Food items
// ============================================================================

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Coffee,
  Clock,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  Bike,
  Sparkles,
  Flame,
  Snowflake,
  Wind,
  Printer,
  Tag,
  Bell,
  Check,
  Utensils,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { OrderEntity, OrderItemEntity } from "@/types/database.types";
import { supabase } from "@/lib/supabase";
import { triggerHapticFeedback } from "@/utils/haptics";
import { CafeReceipt80mm } from "./CafeReceipt80mm";
import { CupSticker50x30 } from "./CupSticker50x30";
import { printReceiptElement } from "@/utils/printReceiptHelper";

export function BaristaKdsTab() {
  const kdsOrders = useCafePosStore((s) => s.kdsOrders);
  const loadKdsOrders = useCafePosStore((s) => s.loadKdsOrders);
  const updateKdsStatus = useCafePosStore((s) => s.updateKdsStatus);
  const isLoadingKds = useCafePosStore((s) => s.isLoadingKds);
  const shopSettings = useCafePosStore((s) => s.shopSettings);

  // Direct print target state
  const [printOrder, setPrintOrder] = useState<OrderEntity | null>(null);
  const [printTarget, setPrintTarget] = useState<"receipt" | "sticker" | null>(null);
  const kdsReceiptRef = useRef<HTMLDivElement>(null);
  const kdsStickerRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    loadKdsOrders();
  }, [loadKdsOrders]);

  // Realtime subscription to Supabase 'orders' table
  useEffect(() => {
    const channel = supabase
      .channel("cafe_kds_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadKdsOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadKdsOrders]);

  // Split into 2 columns: Preparing (left) and Ready (right)
  const preparingOrders = useMemo(
    () => kdsOrders.filter((ord) => ord.order_status === "preparing"),
    [kdsOrders]
  );
  const readyOrders = useMemo(
    () => kdsOrders.filter((ord) => ord.order_status === "ready"),
    [kdsOrders]
  );

  const handleStatusAdvance = async (order: OrderEntity) => {
    triggerHapticFeedback(25);
    if (order.order_status === "preparing") {
      await updateKdsStatus(order.id, "ready");
      toast.success(`ຄິວ #${order.queue_number} ພ້ອມເສີບແລ້ວ!`);
    } else if (order.order_status === "ready") {
      await updateKdsStatus(order.id, "completed");
      toast.success(`ຄິວ #${order.queue_number} ສຳເລັດແລ້ວ!`);
    }
  };

  // Helper for elapsed minutes
  const getElapsedMinutes = (dateStr: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return Math.max(0, minutes);
  };

  // Print handlers
  const handlePrintReceipt = (order: OrderEntity) => {
    triggerHapticFeedback(15);
    setPrintOrder(order);
    setPrintTarget("receipt");
    toast.info(`ກຳລັງພິມບິນ ຄິວ #${order.queue_number}...`);
    setTimeout(() => {
      if (kdsReceiptRef.current) {
        printReceiptElement(kdsReceiptRef.current);
      } else {
        window.print();
      }
    }, 100);
  };

  const handlePrintStickers = (order: OrderEntity) => {
    triggerHapticFeedback(15);
    setPrintOrder(order);
    setPrintTarget("sticker");
    toast.info(`ກຳລັງພິມສະຕິກເກີ ຄິວ #${order.queue_number}...`);
    setTimeout(() => {
      if (kdsStickerRef.current) {
        printReceiptElement(kdsStickerRef.current);
      } else {
        window.print();
      }
    }, 100);
  };

  // Helper to determine if an item is Bakery / Food
  const isBakeryItem = (it: OrderItemEntity) => {
    const t = (it.temperature || "").trim();
    if (t === "ປົກກະຕິ" || t === "") return true;
    if (t !== "ຮ້ອນ" && t !== "ເຢັນ" && t !== "ປັ່ນ") return true;
    const name = (it.item_name || "").toLowerCase();
    return (
      name.includes("croissant") ||
      name.includes("cake") ||
      name.includes("ເຂົ້າໜົມ") ||
      name.includes("ຄົວຊອງ") ||
      name.includes("cheesecake")
    );
  };

  // Render a Single Order Ticket Card
  const renderOrderCard = (ord: OrderEntity, isReadyColumn: boolean = false) => {
    const elapsedMins = getElapsedMinutes(ord.created_at);
    const isUrgent = elapsedMins >= 10 && !isReadyColumn;
    const isDineIn = ord.order_type === "dine_in";
    const isTakeaway = ord.order_type === "takeaway";

    return (
      <div
        key={ord.id}
        className={`flex flex-col justify-between rounded-3xl border transition-all shadow-xs bg-white overflow-hidden ${
          isReadyColumn
            ? "border-amber-300 ring-2 ring-amber-500/20"
            : isUrgent
            ? "border-rose-400 ring-2 ring-rose-500/25"
            : "border-stone-200/90 hover:border-amber-400"
        }`}
      >
        {/* Card Header: Queue Number + Badges + Print Shortcuts */}
        <div
          className={`flex items-center justify-between px-3.5 py-2.5 ${
            isReadyColumn
              ? "bg-stone-800 text-amber-200"
              : isUrgent
              ? "bg-rose-700 text-white"
              : "bg-[#2C1810] text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg sm:text-xl font-black tracking-tight font-mono">
              #{ord.queue_number}
            </span>

            {/* Buzzer Badge */}
            {ord.buzzer_number && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-[10.5px] font-mono font-black text-white">
                <Bell className="h-3 w-3" />
                <span>ບັດສັ່ນ #{ord.buzzer_number}</span>
              </span>
            )}
          </div>

          {/* Right Header: Timer + Print Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Elapsed Timer */}
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                isUrgent ? "bg-white text-rose-700 animate-pulse font-black" : "bg-black/20 text-white"
              }`}
            >
              {isUrgent ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              <span>{elapsedMins} ນາທີ</span>
            </div>

            {/* Print Sticker Button */}
            <button
              type="button"
              onClick={() => handlePrintStickers(ord)}
              className="flex h-7 px-2 items-center justify-center gap-1 rounded-lg bg-white/15 hover:bg-white/30 text-white text-[10.5px] font-bold transition-all cursor-pointer"
              title="ພິມສະຕິກເກີຕິດຈອກ (50x30mm)"
            >
              <Tag className="h-3 w-3" />
              <span className="hidden sm:inline">ສະຕິກເກີ</span>
            </button>

            {/* Print Bill Button */}
            <button
              type="button"
              onClick={() => handlePrintReceipt(ord)}
              className="flex h-7 px-2 items-center justify-center gap-1 rounded-lg bg-white/15 hover:bg-white/30 text-white text-[10.5px] font-bold transition-all cursor-pointer"
              title="ພິມໃບບິນຄືນ (80mm)"
            >
              <Printer className="h-3 w-3" />
              <span className="hidden sm:inline">ໃບບິນ</span>
            </button>
          </div>
        </div>

        {/* Order Meta Bar: Order Type + Code */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/80 px-3.5 py-1.5 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            {isDineIn ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                <Utensils className="h-3 w-3 text-amber-700" />
                <span>ກິນທີ່ຮ້ານ {ord.table?.table_code ? `• ໂຕະ ${ord.table.table_code}` : ""}</span>
              </span>
            ) : isTakeaway ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-black bg-sky-100 text-sky-900 border border-sky-300">
                <ShoppingBag className="h-3 w-3 text-sky-700" />
                <span>ສັ່ງກັບບ້ານ</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                <Bike className="h-3 w-3 text-purple-700" />
                <span>Delivery</span>
              </span>
            )}
          </div>

          <span className="text-[10px] text-stone-400 font-mono">
            {ord.order_number}
          </span>
        </div>

        {/* Items List (Ultra Clean, Highly Legible, Zero Clutter) */}
        <div className="p-3 space-y-2 flex-1 overflow-y-auto no-scrollbar max-h-72">
          {(ord.items || []).map((it, idx) => {
            const isBakery = isBakeryItem(it);
            const isMultiQty = it.quantity > 1;

            return (
              <div
                key={it.id || idx}
                className="flex items-start gap-2.5 p-2 rounded-xl bg-stone-50 border border-stone-200/70"
              >
                {/* Quantity Badge */}
                <span
                  className={`inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-lg font-mono font-black text-xs shrink-0 ${
                    isMultiQty
                      ? "bg-[#2C1810] text-amber-300 shadow-2xs"
                      : "bg-stone-200 text-stone-800"
                  }`}
                >
                  x{it.quantity}
                </span>

                {/* Line Item Content */}
                <div className="flex-1 min-w-0">
                  <h5 className="font-extrabold text-xs sm:text-[13px] text-stone-900 leading-snug">
                    {it.item_name}
                  </h5>

                  {/* Clean Monochromatic Modifiers Subrow: Drinks have Temp/Sweetness/Ice, Bakery has only toppings if any */}
                  {(!isBakery || (it.selected_toppings && it.selected_toppings.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-1 mt-1 text-[10.5px]">
                      {!isBakery && (
                        <>
                          {/* Temperature & Optional Size Pill */}
                          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold bg-stone-200/80 text-stone-800 leading-none">
                            {it.temperature === "ຮ້ອນ" ? (
                              <Flame className="h-3 w-3 text-orange-600" />
                            ) : it.temperature === "ປັ່ນ" ? (
                              <Wind className="h-3 w-3 text-purple-600" />
                            ) : (
                              <Snowflake className="h-3 w-3 text-sky-600" />
                            )}
                            <span>
                              {it.size &&
                              it.size !== "STANDARD" &&
                              it.size !== "ມາດຕະຖານ" &&
                              it.size !== "REGULAR" &&
                              it.size !== "1 ຊິ້ນ" &&
                              (it.size === "S" || it.size === "L")
                                ? `${it.temperature} • Size ${it.size}`
                                : it.temperature}
                            </span>
                          </span>

                          {/* Sweetness */}
                          {it.sweetness && it.sweetness !== "ປົກກະຕິ" && (
                            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 font-bold bg-stone-200/80 text-stone-800 leading-none">
                              ຫວານ {it.sweetness}
                            </span>
                          )}

                          {/* Ice Level (only when changed from normal and not duplicated in note) */}
                          {it.temperature !== "ຮ້ອນ" &&
                            it.ice_level &&
                            it.ice_level !== "ປົກກະຕິ" &&
                            !it.item_note?.includes(it.ice_level) && (
                              <span className="inline-flex items-center rounded-md px-1.5 py-0.5 font-bold bg-stone-200/80 text-stone-800 leading-none">
                                {it.ice_level}
                              </span>
                            )}
                        </>
                      )}

                      {/* Toppings Pills */}
                      {it.selected_toppings?.map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center rounded-md px-1.5 py-0.5 font-bold bg-amber-100/80 text-amber-950 border border-amber-200/60 leading-none"
                        >
                          +{t.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Item Specific Note */}
                  {it.item_note && (
                    <p className="text-[10.5px] text-stone-500 italic mt-1 font-medium">
                      &quot;{it.item_note}&quot;
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Customer / Order Note */}
          {ord.note && (
            <div className="rounded-xl bg-amber-50 p-2 text-[11px] text-amber-950 font-bold border border-amber-200">
              ໝາຍເຫດອໍເດີ: {ord.note}
            </div>
          )}
        </div>

        {/* Card Footer: Advance Action Button */}
        <div className="p-2.5 border-t border-stone-100 bg-stone-50/70">
          <button
            type="button"
            onClick={() => handleStatusAdvance(ord)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-xs active:scale-98 ${
              isReadyColumn
                ? "bg-stone-900 text-amber-200 hover:bg-black"
                : "bg-[#2C1810] text-amber-300 hover:bg-[#1A0D08]"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {isReadyColumn
                ? "ເສີບແລ້ວ (Mark Completed)"
                : "ຊົງແລ້ວ (Mark Ready)"}
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden gap-3 select-none">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-4 rounded-3xl border border-stone-200/90 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2C1810] text-amber-300 shadow-xs">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#2C1810] leading-tight">
              ຄິວຊົງນ້ຳບາຣິສຕ້າ (Barista Studio KDS)
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              ກຳລັງຊົງ {preparingOrders.length} ຄິວ • ພ້ອມເສີບ {readyOrders.length} ຄິວ (Realtime Supabase)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadKdsOrders()}
            disabled={isLoadingKds}
            className="flex h-10 px-3 items-center justify-center gap-1.5 rounded-2xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:scale-95 transition-all shadow-2xs cursor-pointer text-xs font-bold"
            title="ໂຫຼດຄິວໃໝ່"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingKds ? "animate-spin text-amber-700" : ""}`} />
            <span>ຣີເຟຣຊຄິວ</span>
          </button>
        </div>
      </div>

      {/* 2. KDS 2-Column Kanban Layout: Left 8 Cols (Preparing) | Right 4 Cols (Ready) */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-0.5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-4 items-start">
          {/* ================================================================ */}
          {/* COLUMN 1 (8 COLS): PREPARING QUEUE (ກຳລັງຊົງ) */}
          {/* ================================================================ */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {/* Column Header */}
            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 px-4 py-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white font-bold text-xs">
                  <Flame className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-sm font-black text-orange-950">
                  ກຳລັງຊົງ (Preparing Queue)
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-600 text-white font-mono shadow-2xs">
                {preparingOrders.length} ຄິວ
              </span>
            </div>

            {/* Preparing Cards Grid */}
            {preparingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white/70 p-8 text-center min-h-[260px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-2">
                  <CheckCircle2 className="h-6 w-6 text-stone-400" />
                </div>
                <h5 className="text-sm font-black text-stone-700">
                  ບໍ່ມີຄິວຄ້າງຊົງໃນຕອນນີ້
                </h5>
                <p className="text-xs text-stone-400 mt-0.5">
                  ເມື່ອລູກຄ້າສັ່ງອໍເດີໃໝ່, ບິນຈະປາກົດຂຶ້ນທີ່ນີ້ທັນທີ
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {preparingOrders.map((ord) => renderOrderCard(ord, false))}
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* COLUMN 2 (4 COLS): READY & DELIVERY (ພ້ອມເສີບ / ລໍຖ້າເອີ້ນລູກຄ້າ) */}
          {/* ================================================================ */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {/* Column Header */}
            <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/90 px-4 py-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2C1810] text-amber-300 font-bold text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-sm font-black text-amber-950">
                  ພ້ອມເສີບ (Ready to Serve)
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#2C1810] text-amber-300 font-mono shadow-2xs">
                {readyOrders.length} ຄິວ
              </span>
            </div>

            {/* Ready Cards List */}
            {readyOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white/70 p-8 text-center min-h-[260px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-2">
                  <Bell className="h-6 w-6" />
                </div>
                <h5 className="text-sm font-black text-stone-700">
                  ຍັງບໍ່ມີຄິວລໍຖ້າເສີບ
                </h5>
                <p className="text-xs text-stone-400 mt-0.5">
                  ເມື່ອບາຣິສຕ້າກົດ &quot;ຊົງແລ້ວ&quot;, ບິນຈະຍ້າຍມາຖັນນີ້ເພື່ອເອີ້ນລູກຄ້າ
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {readyOrders.map((ord) => renderOrderCard(ord, true))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Print Containers for Receipt & Cup Stickers */}
      {printOrder && printTarget === "receipt" && (
        <div className="hidden print:block print:w-[80mm] print:m-0">
          <CafeReceipt80mm order={printOrder} shopSettings={shopSettings} />
        </div>
      )}

      {printOrder && printTarget === "sticker" && (
        <div className="hidden print:block print:w-[50mm] print:m-0">
          <CupSticker50x30 order={printOrder} />
        </div>
      )}

      {/* Hidden Off-Screen Containers for Pristine Thermal Receipt & Sticker Printing */}
      {printOrder && (
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: "-9999px",
            width: "72mm",
            pointerEvents: "none",
            opacity: 0,
          }}
          aria-hidden="true"
        >
          <div ref={kdsReceiptRef}>
            <CafeReceipt80mm order={printOrder} shopSettings={shopSettings} />
          </div>
          <div ref={kdsStickerRef}>
            <CupSticker50x30 order={printOrder} />
          </div>
        </div>
      )}
    </div>
  );
}

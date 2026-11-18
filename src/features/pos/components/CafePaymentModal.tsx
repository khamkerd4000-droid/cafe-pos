"use client";

// ============================================================================
// CafePaymentModal: Real Supabase Cash & LAO QR Checkout + Dual Print Engine
// 1. 80mm Thermal Bill Print (ໃບບິນຮັບເງິນ 80mm)
// 2. 50x30mm Cup Sticker Print (ພິມສະຕິກເກີຕິດຈອກ)
// 100% Real Supabase - Zero Mock Data
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import {
  Banknote,
  QrCode,
  WalletCards,
  CheckCircle,
  Printer,
  Tag,
  ArrowRight,
  X,
  Calculator,
  Loader2,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatLak, getSmartCashSuggestions } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { cafePosApi } from "../api/cafe-pos.api";
import { CafeReceipt80mm } from "./CafeReceipt80mm";
import { CupSticker50x30 } from "./CupSticker50x30";
import { TouchNumpad } from "./TouchNumpad";
import { triggerHapticFeedback } from "@/utils/haptics";
import { OrderEntity, OrderItemEntity } from "@/types/database.types";
import { useShiftStore } from "@/features/shifts";
import { useAuth } from "@/features/auth";
import { printReceiptElement } from "@/utils/printReceiptHelper";

interface CafePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export function CafePaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
}: CafePaymentModalProps) {
  const { user } = useAuth();
  const activeShift = useShiftStore((s) => s.activeShift);
  const cart = useCafePosStore((s) => s.cart);
  const totals = useCafePosStore((s) => s.totals);
  const orderType = useCafePosStore((s) => s.orderType);
  const selectedTable = useCafePosStore((s) => s.selectedTable);
  const buzzerNumber = useCafePosStore((s) => s.buzzerNumber);
  const customerNote = useCafePosStore((s) => s.customerNote);
  const clearCart = useCafePosStore((s) => s.clearCart);
  const shopSettings = useCafePosStore((s) => s.shopSettings);

  const [activeTab, setActiveTab] = useState<"cash" | "lao_qr" | "mixed">("cash");
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [splitCashPortion, setSplitCashPortion] = useState<number>(0);
  const [cashDiscount, setCashDiscount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<OrderEntity | null>(null);

  // Printing mode trigger: 'receipt' | 'sticker' | null
  const [printTarget, setPrintTarget] = useState<"receipt" | "sticker" | null>(null);
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const stickerPrintRef = useRef<HTMLDivElement>(null);

  const netPayable = Math.max(0, totals.finalTotal - cashDiscount);
  const changeDue = Math.max(0, cashTendered - netPayable);
  const isCashSufficient = cashTendered >= netPayable;

  const splitQrPortion = Math.max(0, netPayable - splitCashPortion);
  const isSplitValid =
    splitCashPortion > 0 && splitQrPortion > 0 && splitCashPortion < netPayable;

  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setCashDiscount(0);
      setCashTendered(totals.finalTotal);
      setSplitCashPortion(Math.floor(totals.finalTotal / 2 / 1000) * 1000);
      setIsCompleted(false);
      setIsProcessing(false);
      setLastCompletedOrder(null);
      setPrintTarget(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFinalizeOrder = async (targetPrint: "receipt" | "sticker" | "none") => {
    if (isProcessing) return;
    if (cart.length === 0) {
      toast.error("ກະຕ່າຫວ່າງເປົ່າ ບໍ່ສາມາດບັນທຶກອໍເດີໄດ້");
      return;
    }
    setIsProcessing(true);
    triggerHapticFeedback(30);

    try {
      const orderId = crypto.randomUUID();
      const nextQueue = await cafePosApi.getNextDailyQueueNumber();
      const orderNumber = await cafePosApi.generateUniqueOrderNumber(nextQueue);
      const nowIso = new Date().toISOString();

      const cashierName = user?.full_name_lo || user?.username || "ບາຣິສຕ້າ (Barista)";

      let finalTendered = netPayable;
      let finalChange = 0;

      if (activeTab === "cash") {
        finalTendered = cashTendered;
        finalChange = changeDue;
      } else if (activeTab === "mixed") {
        finalTendered = splitCashPortion;
        finalChange = 0;
      }

      const orderPayload: OrderEntity = {
        id: orderId,
        order_number: orderNumber,
        queue_number: nextQueue,
        order_type: orderType,
        table_id: selectedTable?.id || null,
        buzzer_number: buzzerNumber || null,
        subtotal: totals.subtotal,
        discount: totals.discount + cashDiscount,
        total_amount: netPayable,
        payment_method: activeTab,
        cash_received: finalTendered,
        change_amount: finalChange,
        order_status: "preparing",
        shift_id: activeShift?.id || null,
        cashier_name: cashierName,
        note: customerNote || null,
        created_at: nowIso,
        table: selectedTable || null,
      };

      const orderItemsPayload: OrderItemEntity[] = cart.map((it) => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        menu_item_id: it.menuItemId,
        item_name: it.name,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        total_price: it.totalPrice,
        temperature: it.temperature,
        size: it.size,
        sweetness: it.sweetness,
        ice_level: it.iceLevel,
        selected_toppings: it.selectedToppings,
        item_note: it.itemNote || null,
        created_at: nowIso,
      }));

      orderPayload.items = orderItemsPayload;

      // 100% Real Supabase submission (resilient with collision auto-retry)
      const savedOrder = await cafePosApi.submitCafeOrder(orderPayload, orderItemsPayload);

      setLastCompletedOrder(savedOrder);
      setIsCompleted(true);
      clearCart();
      onPaymentSuccess?.();

      if (targetPrint === "receipt") {
        setPrintTarget("receipt");
        setTimeout(() => {
          if (receiptPrintRef.current) {
            printReceiptElement(receiptPrintRef.current);
          }
        }, 150);
      } else if (targetPrint === "sticker") {
        setPrintTarget("sticker");
        setTimeout(() => {
          if (stickerPrintRef.current) {
            printReceiptElement(stickerPrintRef.current);
          }
        }, 150);
      }
    } catch (err: any) {
      console.error("[CafePaymentModal] Submission failed:", err);
      toast.error(err?.message || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກອໍເດີ");
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceiptNow = () => {
    setPrintTarget("receipt");
    setTimeout(() => {
      if (receiptPrintRef.current) {
        printReceiptElement(receiptPrintRef.current);
      } else {
        window.print();
      }
    }, 50);
  };

  const printStickersNow = () => {
    setPrintTarget("sticker");
    setTimeout(() => {
      if (stickerPrintRef.current) {
        printReceiptElement(stickerPrintRef.current);
      } else {
        window.print();
      }
    }, 50);
  };

  return (
    <div className="receipt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="receipt-modal-card relative w-full max-w-lg rounded-3xl bg-[#FAF7F2] p-5 sm:p-6 shadow-2xl border border-stone-200/90 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 no-print">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#2C1810]">
              {isCompleted ? "ການຊຳລະເງິນສຳເລັດແລ້ວ!" : "ຊຳລະເງິນ (Payment)"}
            </h3>
            <p className="text-[11px] text-stone-500">
              {shopSettings?.name || "BrewCraft Roastery & Cafe"} • {orderType === "dine_in" ? "ກິນທີ່ຮ້ານ" : "ສັ່ງກັບບ້ານ"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1. COMPLETED SUCCESS VIEW */}
        {isCompleted && lastCompletedOrder ? (
          <div className="py-4 flex flex-col items-center text-center space-y-3.5 animate-in fade-in duration-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-lg shadow-emerald-700/20">
              <CheckCircle className="h-10 w-10" />
            </div>

            <div>
              <div className="border-2 border-black rounded-2xl py-1 px-4 inline-block bg-white shadow-xs">
                <span className="text-[10px] font-bold text-stone-500 block uppercase">
                  ເລກຄິວຮັບເຄື່ອງດື່ມ
                </span>
                <span className="text-3xl font-black text-[#2C1810]">
                  ຄິວທີ #{lastCompletedOrder.queue_number}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono mt-1 font-bold">
                ເລກທີບິນ: {lastCompletedOrder.order_number}
              </p>
            </div>

            {/* Total Paid & Change Banner */}
            <div className="rounded-2xl bg-white p-3.5 border border-stone-200/90 w-full text-xs space-y-2 text-left shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-600 font-medium">ຍອດຊຳລະທັງໝົດ:</span>
                <span className="text-base font-black text-[#2C1810] tabular-nums">
                  {formatLak(lastCompletedOrder.total_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-600 font-medium">ວິທີຊຳລະ:</span>
                <span className="font-bold text-stone-900">
                  {lastCompletedOrder.payment_method === "cash"
                    ? "ເງິນສົດ (Cash)"
                    : lastCompletedOrder.payment_method === "lao_qr"
                    ? "ໂອນ LAO QR (BCEL One)"
                    : "ຈ່າຍຮ່ວມ (ສົດ + QR)"}
                </span>
              </div>
              {lastCompletedOrder.change_amount > 0 && (
                <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                  <span className="font-bold text-amber-800">ເງິນທອນລູກຄ້າ:</span>
                  <span className="text-xl font-black text-amber-600 tabular-nums">
                    {formatLak(lastCompletedOrder.change_amount)}
                  </span>
                </div>
              )}
            </div>

            {/* Print Action Buttons (Bill 80mm + Tem dán ly 50x30mm) */}
            <div className="grid grid-cols-2 gap-2 w-full pt-1 no-print">
              <button
                type="button"
                onClick={printReceiptNow}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-stone-300 bg-white p-3 text-xs font-bold text-[#2C1810] hover:bg-stone-50 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 text-amber-600" />
                <span>ພິມໃບບິນ (80mm)</span>
              </button>

              <button
                type="button"
                onClick={printStickersNow}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Tag className="h-4 w-4 text-amber-700" />
                <span>ພິມສະຕິກເກີຕິດຈອກ</span>
              </button>
            </div>

            {/* Next Customer Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2C1810] text-white p-3.5 text-xs sm:text-sm font-extrabold hover:bg-[#1A0D08] active:scale-98 transition-all shadow-md shadow-[#2C1810]/20 cursor-pointer no-print"
            >
              <span>ສຳເລັດ (ຂາຍອໍເດີຕໍ່ໄປ)</span>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </button>

            {/* Hidden Printable Elements */}
            {lastCompletedOrder && printTarget === "receipt" && (
              <div className="receipt-print-wrapper">
                <CafeReceipt80mm order={lastCompletedOrder} shopSettings={shopSettings} />
              </div>
            )}
            {lastCompletedOrder && printTarget === "sticker" && (
              <div className="receipt-print-wrapper">
                <CupSticker50x30 order={lastCompletedOrder} />
              </div>
            )}

            {/* Off-screen Rendered Containers for Instant & Pristine Thermal Printing */}
            {lastCompletedOrder && (
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
                <div ref={receiptPrintRef}>
                  <CafeReceipt80mm order={lastCompletedOrder} shopSettings={shopSettings} />
                </div>
                <div ref={stickerPrintRef}>
                  <CupSticker50x30 order={lastCompletedOrder} />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 2. ACTIVE PAYMENT ENTRY VIEW */
          <div className="space-y-3.5 py-2">
            {/* Total Due Banner */}
            <div className="rounded-2xl bg-amber-50/90 border border-amber-200/90 p-3.5 text-center shadow-2xs">
              <span className="text-xs font-bold text-amber-900 block">
                ຍອດທີ່ຕ້ອງຊຳລະ (Total Due)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#2C1810] tabular-nums mt-0.5">
                {formatLak(netPayable)}
              </div>
            </div>

            {/* Payment Method Tabs (Cash | LAO QR | Mixed) */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(15);
                  setActiveTab("cash");
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "cash"
                    ? "bg-[#2C1810] text-amber-300 shadow-xs"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                <Banknote className="h-4 w-4 mb-0.5" />
                <span>ເງິນສົດ (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(15);
                  setActiveTab("lao_qr");
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "lao_qr"
                    ? "bg-[#2C1810] text-amber-300 shadow-xs"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                <QrCode className="h-4 w-4 mb-0.5" />
                <span>LAO QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(15);
                  setActiveTab("mixed");
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "mixed"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                <WalletCards className="h-4 w-4 mb-0.5" />
                <span>ຈ່າຍຮ່ວມ</span>
              </button>
            </div>

            {/* TAB 1: CASH (Clean Keyboard Input & Quick Chips - No Bulky Numpad) */}
            {activeTab === "cash" && (
              <div className="space-y-3">
                {/* Cash Tendered Input */}
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    ເງິນສົດຮັບມາ (Cash Tendered):
                  </label>
                  <KipCurrencyInput
                    value={cashTendered}
                    onValueChange={(val) => setCashTendered(val)}
                    className="h-11 text-lg font-black text-right text-stone-900 font-mono bg-white rounded-xl border border-stone-200"
                    placeholder="0"
                  />
                </div>

                {/* Quick Smart Cash Suggestions */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(15);
                      setCashTendered(netPayable);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      cashTendered === netPayable
                        ? "bg-[#2C1810] text-amber-300 font-black shadow-2xs"
                        : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    ພໍດີ ({formatLak(netPayable)})
                  </button>
                  {getSmartCashSuggestions(netPayable).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback(15);
                        setCashTendered(sug);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        cashTendered === sug
                          ? "bg-[#2C1810] text-amber-300 font-black shadow-2xs"
                          : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      {formatLak(sug)}
                    </button>
                  ))}
                </div>

                {/* Change Due Card */}
                <div
                  className={`rounded-2xl p-3.5 border transition-all ${
                    !isCashSufficient
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : changeDue > 0
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                      : "bg-stone-50 border-stone-200 text-stone-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">ເງິນທອນລູກຄ້າ (Change Due):</span>
                    <span className="text-xl font-black font-mono tabular-nums">
                      {isCashSufficient ? formatLak(changeDue) : "ຍັງບໍ່ພໍດີ"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LAO QR */}
            {activeTab === "lao_qr" && (
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-stone-300 rounded-2xl bg-white text-center">
                <div className="mb-2 text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                  LAO QR - LAPNet Standard (BCEL OnePay / LDB / JDB)
                </div>

                <div className="relative flex h-40 w-40 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md border border-stone-200 my-1">
                  <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-stone-900 rounded-lg">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          i % 2 === 0 || i % 5 === 0 ? "bg-white" : "bg-stone-900"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-lg bg-white px-2 py-1 text-[11px] font-black text-amber-800 shadow-md border border-amber-200">
                      BCEL One
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold text-stone-800 mt-1">
                  ຍອດໂອນ: <span className="text-amber-700 text-sm">{formatLak(netPayable)}</span>
                </div>
              </div>
            )}

            {/* TAB 3: MIXED SPLIT */}
            {activeTab === "mixed" && (
              <div className="space-y-3 bg-white p-3 rounded-2xl border border-stone-200">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    1. ສ່ວນຮັບເງິນສົດ (Cash):
                  </label>
                  <KipCurrencyInput
                    value={splitCashPortion}
                    onValueChange={(val) => setSplitCashPortion(val)}
                    className="h-10 text-base font-extrabold text-right text-stone-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    2. ສ່ວນໂອນ LAO QR:
                  </label>
                  <div className="h-10 flex items-center justify-end px-3 rounded-xl border border-amber-300 bg-amber-50/50 text-base font-extrabold text-amber-900 tabular-nums">
                    {formatLak(splitQrPortion)}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons: Exactly 2 Buttons: ພິມບິນ & ບໍ່ພິມບິນ */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-stone-200/80">
              {/* Button 1: Complete & Print Bill */}
              <button
                type="button"
                disabled={
                  isProcessing ||
                  (activeTab === "cash" && !isCashSufficient) ||
                  (activeTab === "mixed" && !isSplitValid)
                }
                onClick={() => handleFinalizeOrder("receipt")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#2C1810] p-3.5 text-xs sm:text-sm font-black text-amber-300 shadow-md shadow-[#2C1810]/20 hover:bg-[#1A0D08] active:scale-98 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                ) : (
                  <Printer className="h-4 w-4 text-amber-300" />
                )}
                <span>ພິມບິນ</span>
              </button>

              {/* Button 2: Complete Without Print */}
              <button
                type="button"
                disabled={
                  isProcessing ||
                  (activeTab === "cash" && !isCashSufficient) ||
                  (activeTab === "mixed" && !isSplitValid)
                }
                onClick={() => handleFinalizeOrder("none")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white p-3.5 text-xs sm:text-sm font-bold text-stone-800 hover:bg-stone-50 active:scale-98 disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-stone-600" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
                <span>ບໍ່ພິມບິນ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

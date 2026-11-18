"use client";

// ============================================================================
// OrderDetailModal: Touch-First Modal for Cafe Order Details, 80mm & 50x30 Stickers
// QuickOne Cafe & Bakery POS
// ============================================================================

import React, { useState } from "react";
import {
  X,
  Receipt,
  Printer,
  Ban,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Coffee,
  Utensils,
  ShoppingBag,
  Bike,
} from "lucide-react";
import { OrderRecord } from "../types/order.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { formatReceiptDateTime } from "../utils/order.util";
import {
  ORDER_PAYMENT_METHODS,
  ORDER_STATUS_CONFIG,
  ORDER_MODE_CONFIG,
} from "../constants/order.constants";
import { triggerHapticFeedback } from "@/utils/haptics";

interface OrderDetailModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onVoid?: (order: OrderRecord) => void;
  onReprint?: (order: OrderRecord) => void;
  onPrintStickers?: (order: OrderRecord) => void;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onVoid,
  onReprint,
  onPrintStickers,
}: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

  const statusCfg =
    ORDER_STATUS_CONFIG[order.order_status] || ORDER_STATUS_CONFIG.completed;
  const paymentCfg =
    ORDER_PAYMENT_METHODS[order.payment_method] || ORDER_PAYMENT_METHODS.cash;
  const modeCfg =
    ORDER_MODE_CONFIG[order.order_type] || ORDER_MODE_CONFIG.dine_in;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-[#2C1810] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 px-3 items-center justify-center rounded-xl bg-amber-500 text-stone-950 font-black text-base font-mono shadow-md">
              #{String(order.queue_number).padStart(2, "0")}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black font-mono tracking-tight text-white">
                  {order.order_number}
                </h2>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${statusCfg.bgClass}`}
                >
                  {statusCfg.label_lo}
                </span>
              </div>
              <div className="text-xs text-stone-300 mt-0.5 flex items-center gap-1.5">
                {order.order_type === "takeaway" ? (
                  <ShoppingBag className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                ) : order.order_type === "delivery" ? (
                  <Bike className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Utensils className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                )}
                <span>
                  {order.table_code
                    ? `ໂຕະ ${order.table_code}`
                    : order.buzzer_number
                    ? `ສັ່ນ #${order.buzzer_number}`
                    : modeCfg.label_lo}{" "}
                  • {formatReceiptDateTime(order.created_at)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-stone-600 border-b border-stone-200 pb-2">
            <span>ລາຍການເຄື່ອງດື່ມ & ເບເກີຣີ</span>
            <span>ຈຳນວນ & ລາຄາ</span>
          </div>

          <div className="space-y-3 divide-y divide-stone-100">
            {(order.items || []).map((item, idx) => (
              <div key={item.id || idx} className="pt-2 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                    <span>{item.item_name}</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded">
                      x{item.quantity}
                    </span>
                  </div>

                  {/* Recipe Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {item.temperature && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                        {item.temperature}
                      </span>
                    )}
                    {item.size && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                        Size {item.size}
                      </span>
                    )}
                    {item.sweetness && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                        ຫວານ {item.sweetness}
                      </span>
                    )}
                    {item.ice_level && item.temperature !== "ຮ້ອນ" && item.ice_level !== "ປົກກະຕິ" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                        {item.ice_level}
                      </span>
                    )}
                    {(item.selected_toppings || []).map((t) => (
                      <span
                        key={t.id || t.name}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-900"
                      >
                        +{t.name}
                      </span>
                    ))}
                    {item.item_note && (
                      <span className="text-[10px] font-medium italic text-stone-500">
                        &quot;{item.item_note}&quot;
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-extrabold text-sm text-stone-900 tabular-nums">
                    {formatLak(item.total_price)}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    @{formatLak(item.unit_price)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="mt-4 pt-4 border-t border-stone-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>ຍອດລວມ (Subtotal)</span>
              <span className="font-bold tabular-nums">{formatLak(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>ສ່ວນຫຼຸດ (Discount)</span>
                <span className="font-bold tabular-nums">-{formatLak(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-[#2C1810] pt-2 border-t border-stone-200">
              <span>ຍອດສຸທິ (Net Total)</span>
              <span className="tabular-nums text-amber-700">{formatLak(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-stone-500 pt-1 text-[11px]">
              <span>ວິທີຊຳລະ</span>
              <span className="font-bold">{paymentCfg.label_lo}</span>
            </div>
            {order.payment_method === "cash" && (
              <>
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>ຮັບເງິນສົດ</span>
                  <span className="font-bold tabular-nums">{formatLak(order.cash_received)}</span>
                </div>
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>ເງິນທອນ</span>
                  <span className="font-bold tabular-nums text-emerald-700">{formatLak(order.change_amount)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-stone-200 bg-stone-50 p-4 flex flex-wrap items-center justify-between gap-2">
          {order.order_status !== "cancelled" && onVoid && (
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(40);
                onVoid(order);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
            >
              <Ban className="h-4 w-4" />
              <span>ຍົກເລີກບິນ</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onPrintStickers && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(30);
                  onPrintStickers(order);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-orange-300 bg-orange-50 text-orange-800 text-xs font-extrabold hover:bg-orange-100 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Tag className="h-4 w-4 text-orange-600" />
                <span>ພິມສະຕິກເກີຕິດຈອກ (50x30mm)</span>
              </button>
            )}

            {onReprint && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(30);
                  onReprint(order);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2C1810] text-amber-300 text-xs font-extrabold hover:bg-stone-900 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <Printer className="h-4 w-4" />
                <span>ພິມບິນຄືນ (80mm)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

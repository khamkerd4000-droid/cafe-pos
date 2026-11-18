"use client";

// ============================================================================
// OrdersTable: Responsive Cafe Order History Table with Queue, Table & Printing
// QuickOne Cafe & Bakery POS
// ============================================================================

import React from "react";
import {
  Receipt,
  Eye,
  Printer,
  Ban,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Utensils,
  ShoppingBag,
  Bike,
} from "lucide-react";
import { OrderRecord } from "../types/order.types";
import { useOrderStore } from "../stores/order.store";
import { formatLak } from "@/utils/formatLakCurrency";
import { formatReceiptDateTime } from "../utils/order.util";
import {
  ORDER_PAYMENT_METHODS,
  ORDER_STATUS_CONFIG,
  ORDER_MODE_CONFIG,
} from "../constants/order.constants";
import { triggerHapticFeedback } from "@/utils/haptics";

interface OrdersTableProps {
  orders: OrderRecord[];
  isLoading: boolean;
  onPrintSticker?: (order: OrderRecord) => void;
}

export function OrdersTable({ orders, isLoading, onPrintSticker }: OrdersTableProps) {
  const openDetail = useOrderStore((s) => s.openDetail);
  const openVoidDialog = useOrderStore((s) => s.openVoidDialog);
  const setReprintOrder = useOrderStore((s) => s.setReprintOrder);

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-stone-200/80">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-600 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-stone-500">ກຳລັງໂຫຼດລາຍການບິນ...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-stone-200/80 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-3">
          <Receipt className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-stone-800">ບໍ່ພົບລາຍການບິນ</h3>
        <p className="text-xs text-stone-400 mt-1 max-w-sm">
          ບໍ່ມີຂໍ້ມູນບິນທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ ຫຼື ຊ່ວງເວລາທີ່ເລືອກ
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white shadow-2xs overflow-hidden select-none touch-manipulation">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/90 text-[11px] text-stone-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">ຄິວ / ເລກທີບິນ</th>
              <th className="py-3 px-3">ຮູບແບບ & ໂຕະ</th>
              <th className="py-3 px-3">ເວລາຂາຍ</th>
              <th className="py-3 px-3">ພະນັກງານ</th>
              <th className="py-3 px-3 text-center">ຈຳນວນຈອກ</th>
              <th className="py-3 px-3">ວິທີຊຳລະ</th>
              <th className="py-3 px-3 text-right">ຍອດລວມ (Total)</th>
              <th className="py-3 px-3 text-center">ສະຖານະ</th>
              <th className="py-3 px-4 text-center">ຈັດການ & ພິມ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100">
            {orders.map((o) => {
              const statusCfg =
                ORDER_STATUS_CONFIG[o.order_status] || ORDER_STATUS_CONFIG.completed;
              const paymentCfg =
                ORDER_PAYMENT_METHODS[o.payment_method] || ORDER_PAYMENT_METHODS.cash;
              const modeCfg =
                ORDER_MODE_CONFIG[o.order_type] || ORDER_MODE_CONFIG.dine_in;
              const totalCups = (o.items || []).reduce(
                (sum, i) => sum + i.quantity,
                0
              );

              return (
                <tr
                  key={o.id}
                  onClick={() => {
                    triggerHapticFeedback(20);
                    openDetail(o);
                  }}
                  className={`hover:bg-amber-50/40 active:bg-amber-100/50 transition-all cursor-pointer group ${
                    o.order_status === "cancelled" ? "bg-rose-50/20 opacity-70" : ""
                  }`}
                  title="ແຕະເພື່ອເບິ່ງລາຍລະອຽດບິນ & ພິມບິນ/ສະຕິກເກີ"
                >
                  {/* Queue & Order Number */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 px-2 items-center justify-center rounded-lg bg-[#2C1810] text-amber-300 font-black text-xs font-mono shadow-2xs">
                        #{String(o.queue_number).padStart(2, "0")}
                      </span>
                      <span className="font-mono font-bold text-stone-800 text-[12px] group-hover:text-amber-700">
                        {o.order_number}
                      </span>
                    </div>
                  </td>

                  {/* Mode & Table */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 font-bold text-stone-700">
                      {o.order_type === "takeaway" ? (
                        <ShoppingBag className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      ) : o.order_type === "delivery" ? (
                        <Bike className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Utensils className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                      )}
                      <span>
                        {o.table_code
                          ? `ໂຕະ ${o.table_code}`
                          : o.buzzer_number
                          ? `ສັ່ນ #${o.buzzer_number}`
                          : modeCfg.label_lo}
                      </span>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="py-3 px-3">
                    <div className="text-xs font-medium text-stone-600">
                      {formatReceiptDateTime(o.created_at)}
                    </div>
                  </td>

                  {/* Cashier */}
                  <td className="py-3 px-3">
                    <span className="text-xs font-medium text-stone-700">
                      {o.cashier_name || "Barista"}
                    </span>
                  </td>

                  {/* Items Count */}
                  <td className="py-3 px-3 text-center text-xs font-bold text-stone-800 tabular-nums">
                    <span className="bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                      {totalCups} ຈອກ
                    </span>
                  </td>

                  {/* Payment Method */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-bold border ${paymentCfg.badgeClass}`}
                    >
                      {paymentCfg.short_lo}
                    </span>
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-3 text-right font-extrabold text-[#2C1810] text-[13px] tabular-nums">
                    {formatLak(o.total_amount)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${statusCfg.bgClass}`}
                    >
                      {o.order_status === "completed" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      <span>{statusCfg.label_lo}</span>
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View Detail */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback(20);
                          openDetail(o);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="ເບິ່ງລາຍລະອຽດອໍເດີ"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Print 80mm */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback(30);
                          setReprintOrder(o);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="ພິມບິນຄືນ (80mm)"
                      >
                        <Printer className="h-4 w-4" />
                      </button>

                      {/* Print Cup Sticker 50x30 */}
                      {onPrintSticker && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHapticFeedback(30);
                            onPrintSticker(o);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                          title="ພິມສະຕິກເກີຕິດຈອກ (50x30mm)"
                        >
                          <Tag className="h-4 w-4" />
                        </button>
                      )}

                      {/* Void Order */}
                      {o.order_status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHapticFeedback(40);
                            openVoidDialog(o);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                          title="ຍົກເລີກບິນ"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

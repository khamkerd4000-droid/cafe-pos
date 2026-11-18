"use client";

// ============================================================================
// CafeReceipt80mm: 80mm Thermal Receipt Layout for QuickOne Cafe
// - Enormous Queue / Table Number Badge at Top (text-2xl font-black border-2 border-black py-1)
// - Detailed Recipe Modifier under each item (- ເຢັນ | ຫວານ 50% | +ໄຂ່ມຸກ)
// - Wi-Fi Password from shop_settings at bottom (Wi-Fi: QuickOne_Cafe / Pass: 88888888)
// - Strict 72mm thermal width & 0 margin for POS-80 thermal printers
// ============================================================================

import React from "react";
import { formatLak } from "@/utils/formatLakCurrency";
import { OrderEntity, ShopSettingsEntity } from "@/types/database.types";

interface CafeReceipt80mmProps {
  order: OrderEntity;
  shopSettings?: ShopSettingsEntity | null;
  className?: string;
}

export function CafeReceipt80mm({
  order,
  shopSettings,
  className = "",
}: CafeReceipt80mmProps) {
  const shopName = shopSettings?.name || "BrewCraft Roastery & Cafe";
  const shopBranch = shopSettings?.branch || "ສາຂາ ປາກຊອງ (Paksong Highland)";
  const shopPhone = shopSettings?.phone || "020 55257555";
  const wifiSsid = shopSettings?.wifi_ssid || "BrewCraft_Cafe";
  const wifiPass = shopSettings?.wifi_password || "88888888";

  const orderTypeLabel =
    order.order_type === "dine_in"
      ? "ກິນທີ່ຮ້ານ (Dine-in)"
      : order.order_type === "takeaway"
      ? "ສັ່ງກັບບ້ານ (Takeaway)"
      : "Delivery";

  const orderDateFormatted = order.created_at
    ? new Date(order.created_at).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toLocaleString("en-GB");

  return (
    <div
      className={`receipt-80mm font-sans text-slate-900 w-full bg-white rounded-xl px-4 py-3.5 shadow-xs mx-auto select-none border border-slate-200/80 ${className}`}
    >
      {/* 1. Store Header */}
      <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
        <h2 className="font-extrabold text-[15px] uppercase tracking-tight text-black leading-tight">
          {shopName}
        </h2>
        <p className="text-[11px] text-slate-600 font-medium">{shopBranch}</p>
        <p className="font-mono text-[10.5px] text-slate-600">ໂທ: {shopPhone}</p>
      </div>

      {/* 2. Top Prominent Queue / Table Badge */}
      <div className="my-2.5 text-center">
        <div className="border-2 border-black rounded-xl py-1 px-2 inline-block w-full bg-slate-50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 leading-none">
            {order.order_type === "dine_in" ? "ເລກໂຕະ / TABLE" : "ເລກຄິວຮັບເຄື່ອງດື່ມ / QUEUE"}
          </p>
          <div className="text-2xl font-black text-black leading-tight tracking-tight mt-0.5">
            {order.order_type === "dine_in" && order.table?.table_code
              ? `ໂຕະ ${order.table.table_code}`
              : `ຄິວທີ #${order.queue_number || "01"}`}
          </div>
          {(order.buzzer_number || (order as any).buzzerNumber) && (
            <p className="text-[10px] font-bold text-slate-700 leading-none mt-0.5">
              (ເບີເຄື່ອງສັ່ນ: #{order.buzzer_number || (order as any).buzzerNumber})
            </p>
          )}
        </div>
      </div>

      {/* 3. Order Metadata */}
      <div className="py-1.5 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-600">ເລກທີບິນ:</span>
          <span className="font-bold font-mono text-black">{order.order_number}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>ວັນທີ & ເວລາ:</span>
          <span className="font-medium text-black">{orderDateFormatted}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>ຮູບແບບ:</span>
          <span className="font-bold text-black">{orderTypeLabel}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>ບາຣິສຕ້າ / ຜູ້ຂາຍ:</span>
          <span className="font-medium text-black">{order.cashier_name || "Barista"}</span>
        </div>
      </div>

      {/* 4. Drink Items with Recipe Formula */}
      <div className="py-2 border-b border-dashed border-slate-400">
        <div className="flex justify-between font-bold pb-1 border-b border-dashed border-slate-300 text-[11px] text-slate-600">
          <span className="w-1/2">ລາຍການ / ສູດຊົງ</span>
          <span className="w-1/4 text-center">ຈຳນວນ</span>
          <span className="w-1/4 text-right">ລວມ (₭)</span>
        </div>

        <div className="divide-y divide-dashed divide-slate-100 py-1 space-y-1.5">
          {(order.items || []).map((item, idx) => {
            // Build recipe string: e.g. "ເຢັນ | Size L | ຫວານ 50% | ນ້ຳກ້ອນໜ້ອຍ | +ໄຂ່ມຸກ"
            const recipeParts: string[] = [];
            if (item.temperature) recipeParts.push(item.temperature);
            if (item.size) recipeParts.push(`Size ${item.size}`);
            if (item.sweetness) recipeParts.push(`ຫວານ ${item.sweetness}`);
            if (
              item.ice_level &&
              item.temperature !== "ຮ້ອນ" &&
              item.ice_level !== "ປົກກະຕິ" &&
              !item.item_note?.includes(item.ice_level)
            ) {
              recipeParts.push(item.ice_level);
            }
            if (item.selected_toppings && item.selected_toppings.length > 0) {
              const topNames = item.selected_toppings.map((t) => `+${t.name}`).join(", ");
              recipeParts.push(topNames);
            }
            if (item.item_note) {
              recipeParts.push(`(${item.item_note})`);
            }

            return (
              <div key={item.id || idx} className="pt-1.5">
                <div className="flex justify-between items-start text-xs font-bold text-black leading-tight">
                  <span className="w-1/2 break-words">{item.item_name}</span>
                  <span className="w-1/4 text-center font-bold">{item.quantity}</span>
                  <span className="w-1/4 text-right tabular-nums font-black">
                    {formatLak(item.total_price)}
                  </span>
                </div>

                {/* Formula Line */}
                {recipeParts.length > 0 && (
                  <div className="text-[10px] text-slate-600 font-medium pl-1 mt-0.5 leading-snug">
                    - {recipeParts.join(" | ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Totals */}
      <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-1">
        <div className="flex justify-between text-slate-600">
          <span>ລວມເງິນສິນຄ້າ (Subtotal):</span>
          <span className="tabular-nums font-bold text-black">{formatLak(order.subtotal)}</span>
        </div>

        {order.discount > 0 && (
          <div className="flex justify-between text-rose-600 font-semibold">
            <span>ສ່ວນຫຼຸດ (Discount):</span>
            <span className="tabular-nums font-bold">-{formatLak(order.discount)}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline font-black text-sm pt-1 border-t border-black text-black">
          <span>ຍອດລວມສຸດທິ (Total):</span>
          <span className="tabular-nums text-base">{formatLak(order.total_amount)}</span>
        </div>
      </div>

      {/* 6. Payment Information */}
      <div className="py-1.5 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
        <div className="flex justify-between items-center text-slate-600">
          <span>ວິທີຊຳລະເງິນ:</span>
          <span className="font-bold text-black">
            {order.payment_method === "cash"
              ? "ເງິນສົດ (Cash)"
              : order.payment_method === "lao_qr"
              ? "ໂອນ LAO QR (BCEL One)"
              : "ຈ່າຍຮ່ວມ (Cash + QR)"}
          </span>
        </div>

        {order.payment_method === "cash" && (
          <>
            <div className="flex justify-between items-center text-slate-600">
              <span>ຮັບເງິນສົດມາ:</span>
              <span className="tabular-nums font-bold text-black">
                {formatLak(order.cash_received)}
              </span>
            </div>
            <div className="flex justify-between items-center font-bold text-black">
              <span>ເງິນທອນ:</span>
              <span className="tabular-nums text-emerald-800 font-black">
                {formatLak(order.change_amount)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 7. Wi-Fi Password Box & Thank You Footer */}
      <div className="pt-2 text-center space-y-1">
        {/* Wi-Fi Details */}
        <div className="border border-dashed border-slate-400 rounded-lg p-1.5 bg-slate-50 text-[10.5px]">
          <span className="font-bold block text-black">ລະຫັດ Wi-Fi ຂອງຮ້ານ (Shop Wi-Fi)</span>
          <p className="font-mono text-slate-700">
            Wi-Fi: <strong>{wifiSsid}</strong> | Pass: <strong>{wifiPass}</strong>
          </p>
        </div>

        <p className="font-bold text-[11px] text-black mt-1">ຂໍຂອບໃຈທີ່ມາອຸດໜູນ!</p>
        <p className="text-[9.5px] text-slate-500">
          ກະລຸນາເບິ່ງເບີຄິວທີ່ໜ້າຈໍເມື່ອເຄື່ອງດື່ມພ້ອມເສີບ
        </p>
      </div>
    </div>
  );
}


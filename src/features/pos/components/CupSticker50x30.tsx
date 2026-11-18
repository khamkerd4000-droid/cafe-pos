"use client";

// ============================================================================
// CupSticker50x30: 50x30mm Thermal Cup Sticker Label Sheet
// Splits multi-cup orders into sequential stickers (1/N, 2/N, 3/N)
// Line 1: #ຄິວ 12 (ກັບບ້ານ) | ຈອກ 1/3 | 14:25
// Line 2: Tên món + Size + Nóng/Đá (e.g. ອາເມຣິກາໂນ່ (ເຢັນ - L))
// Line 3: Công thức (e.g. ຫວານ 50% • ນ້ຳກ້ອນໜ້ອຍ)
// Line 4: Topping (e.g. + ໄຂ່ມຸກ, + ວິບຄຣີມ)
// ============================================================================

import React from "react";
import { OrderEntity, OrderItemEntity } from "@/types/database.types";

interface CupSticker50x30Props {
  order: OrderEntity;
  className?: string;
}

interface SingleCupStickerData {
  cupIndex: number;
  totalCups: number;
  queueNumber: number | string;
  orderType: string;
  timeStr: string;
  itemName: string;
  temperature: string;
  size: string;
  sweetness: string;
  iceLevel: string;
  toppings: string[];
  note?: string;
}

export function CupSticker50x30({
  order,
  className = "",
}: CupSticker50x30Props) {
  // Expand order items by quantity into individual cup stickers
  const cupsList: SingleCupStickerData[] = [];
  const items = order.items || [];

  const timeFormatted = order.created_at
    ? new Date(order.created_at).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

  const orderTypeShort =
    order.order_type === "dine_in"
      ? order.table?.table_code
        ? `ໂຕະ ${order.table.table_code}`
        : "ທີ່ຮ້ານ"
      : order.order_type === "takeaway"
      ? "ກັບບ້ານ"
      : "Delivery";

  // Calculate total cups across all items
  const totalCups = items.reduce((sum, it) => sum + (it.quantity || 1), 0);

  let currentCupNum = 1;
  for (const item of items) {
    const qty = item.quantity || 1;
    for (let i = 0; i < qty; i++) {
      const topNames = (item.selected_toppings || []).map((t) => t.name);
      cupsList.push({
        cupIndex: currentCupNum,
        totalCups,
        queueNumber: order.queue_number || "01",
        orderType: orderTypeShort,
        timeStr: timeFormatted,
        itemName: item.item_name,
        temperature: item.temperature || "ເຢັນ",
        size: item.size || "M",
        sweetness: item.sweetness || "100%",
        iceLevel: item.ice_level || "ປົກກະຕິ",
        toppings: topNames,
        note: item.item_note || undefined,
      });
      currentCupNum++;
    }
  }

  return (
    <div className={`cup-sticker-sheet flex flex-col gap-3 ${className}`}>
      {cupsList.map((cup, idx) => {
        // Line 2: Name + (Temp - Size)
        const titleWithVariant = `${cup.itemName} (${cup.temperature} - ${cup.size})`;

        // Line 3: Recipe (Never show default "ປົກກະຕິ" ice level)
        const recipeParts: string[] = [`ຫວານ ${cup.sweetness}`];
        if (
          cup.temperature !== "ຮ້ອນ" &&
          cup.iceLevel &&
          cup.iceLevel !== "ປົກກະຕິ" &&
          !cup.note?.includes(cup.iceLevel)
        ) {
          recipeParts.push(cup.iceLevel);
        }
        const recipeLine = recipeParts.join(" • ");

        // Line 4: Toppings & Note (Includes quick ice tags like ນ້ຳກ້ອນໜ້ອຍ, ແຍກນ້ຳກ້ອນ)
        const toppingLine =
          cup.toppings.length > 0
            ? cup.toppings.map((t) => `+ ${t}`).join(", ")
            : null;
        const extraDetails: string[] = [];
        if (toppingLine) extraDetails.push(toppingLine);
        if (cup.note) extraDetails.push(`* ${cup.note}`);
        const line4Text = extraDetails.length > 0 ? extraDetails.join(" • ") : "BrewCraft Cafe";

        return (
          <div
            key={idx}
            className="cup-sticker-item border border-black bg-white rounded-lg p-2 flex flex-col justify-between font-sans select-none text-black leading-tight"
            style={{ width: "50mm", height: "30mm", boxSizing: "border-box" }}
          >
            {/* Line 1: Header */}
            <div className="flex items-center justify-between text-[9px] font-bold border-b border-black pb-0.5">
              <span>
                #ຄິວ {cup.queueNumber} ({cup.orderType})
              </span>
              <span className="font-extrabold bg-black text-white px-1 py-0.2 rounded text-[8px]">
                ຈອກ {cup.cupIndex}/{cup.totalCups}
              </span>
              <span className="font-mono text-[8.5px]">{cup.timeStr}</span>
            </div>

            {/* Line 2: Item Name + Size + Hot/Iced */}
            <div className="text-[10.5px] font-black truncate text-black my-0.5 leading-snug">
              {titleWithVariant}
            </div>

            {/* Line 3: Sweetness & Ice Recipe */}
            <div className="text-[8.5px] font-bold text-slate-800 truncate">
              {recipeLine}
            </div>

            {/* Line 4: Toppings & Note */}
            <div className="text-[8px] font-medium text-slate-700 truncate min-h-[10px]">
              {line4Text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

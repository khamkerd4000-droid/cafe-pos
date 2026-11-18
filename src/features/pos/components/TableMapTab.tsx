"use client";

// ============================================================================
// TableMapTab: Live Table Layout Map for QuickOne Cafe (Indoor & Garden Zones)
// Realtime Status from Supabase: Available (Stone/White) vs Occupied (Caramel Orange)
// Tap to select table for active order, add items, or free table
// ============================================================================

import React, { useState } from "react";
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Plus,
  RefreshCw,
  LogOut,
  Settings,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { DiningTableEntity } from "../types/cafe.types";
import { TableZoneManagerModal } from "./TableZoneManagerModal";
import { triggerHapticFeedback } from "@/utils/haptics";

export function TableMapTab() {
  const diningTables = useCafePosStore((s) => s.diningTables);
  const selectedTable = useCafePosStore((s) => s.selectedTable);
  const setSelectedTable = useCafePosStore((s) => s.setSelectedTable);
  const setOrderType = useCafePosStore((s) => s.setOrderType);
  const setCurrentTab = useCafePosStore((s) => s.setCurrentTab);
  const freeTable = useCafePosStore((s) => s.freeTable);
  const loadCatalog = useCafePosStore((s) => s.loadCatalog);
  const isLoading = useCafePosStore((s) => s.isLoadingCatalog);

  const [activeZone, setActiveZone] = useState<string>("all");
  const [activeDetailTable, setActiveDetailTable] = useState<DiningTableEntity | null>(null);
  const [isTableManagerOpen, setIsTableManagerOpen] = useState(false);

  // Split zones
  const indoorTables = diningTables.filter((t) => t.zone.includes("ໃນຮ້ານ") || t.zone.includes("Indoor"));
  const gardenTables = diningTables.filter((t) => t.zone.includes("ສວນ") || t.zone.includes("Garden"));

  const filteredTables =
    activeZone === "indoor"
      ? indoorTables
      : activeZone === "garden"
      ? gardenTables
      : diningTables;

  const occupiedCount = diningTables.filter((t) => t.status === "occupied").length;
  const availableCount = diningTables.length - occupiedCount;

  const handleTableClick = (table: DiningTableEntity) => {
    triggerHapticFeedback(20);
    setActiveDetailTable(table);
  };

  const handleSelectForOrder = (table: DiningTableEntity) => {
    triggerHapticFeedback(20);
    setSelectedTable(table);
    setOrderType("dine_in");
    setCurrentTab("terminal");
    toast.success(`ໄດ້ເລືອກໂຕະ ${table.table_code} ສຳລັບອໍເດີແລ້ວ`);
  };

  const handleFreeTableAction = async (table: DiningTableEntity) => {
    const confirm = window.confirm(`ທ່ານຕ້ອງການປ່ອຍໂຕະ ${table.table_code} ໃຫ້ວ່າງແມ່ນບໍ່?`);
    if (confirm) {
      triggerHapticFeedback(25);
      await freeTable(table.id);
      setActiveDetailTable(null);
      toast.success(`ໄດ້ປ່ອຍໂຕະ ${table.table_code} ຮຽບຮ້ອຍແລ້ວ`);
    }
  };

  // Helper to format seated duration
  const getDurationText = (seatedAt?: string | null) => {
    if (!seatedAt) return "ຫາກໍ່ນັ່ງ";
    const minutes = Math.floor((Date.now() - new Date(seatedAt).getTime()) / 60000);
    if (minutes < 1) return "ຫາກໍ່ນັ່ງ";
    if (minutes < 60) return `${minutes} ນາທີ`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ຊົ່ວໂມງ ${minutes % 60} ນາທີ`;
  };

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden gap-3 select-none">
      {/* 1. Header Toolbar: Zone Tabs & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-4 rounded-3xl border border-stone-200/90 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-2xs">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#2C1810] leading-tight">
              ຜັງໂຕະນັ່ງ (Dining Tables Map)
            </h3>
            <p className="text-[11px] text-stone-500">
              ວ່າງ {availableCount} ໂຕະ • ມີແຂກນັ່ງ {occupiedCount} ໂຕະ (ທັງໝົດ {diningTables.length} ໂຕະ)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zone Selector Pills */}
          <div className="flex items-center rounded-2xl bg-stone-100 p-1 border border-stone-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveZone("all")}
              className={`py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                activeZone === "all"
                  ? "bg-white text-[#2C1810] shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              ທັງໝົດ ({diningTables.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveZone("indoor")}
              className={`py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                activeZone === "indoor"
                  ? "bg-white text-[#2C1810] shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              ໃນຮ້ານ ({indoorTables.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveZone("garden")}
              className={`py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                activeZone === "garden"
                  ? "bg-white text-[#2C1810] shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              ສວນ ({gardenTables.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadCatalog()}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="ອັບເດດສະຖານະໂຕະ"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-amber-700" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(20);
              setIsTableManagerOpen(true);
            }}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-2xl bg-[#2C1810] text-amber-300 font-black text-xs hover:bg-stone-900 active:scale-95 transition-all cursor-pointer shadow-xs"
            title="ຕັ້ງຄ່າຜັງໂຕະ & ເພີ່ມໂຊນ"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">ຕັ້ງຄ່າໂຕະ & ໂຊນ</span>
          </button>
        </div>
      </div>

      {/* 2. Tables Grid Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-0.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-4">
          {filteredTables.map((table) => {
            const isOccupied = table.status === "occupied";
            const isCurrentSelected = selectedTable?.id === table.id;

            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`group relative flex flex-col justify-between p-3.5 rounded-3xl border transition-all cursor-pointer shadow-2xs hover:shadow-md min-h-[140px] ${
                  isCurrentSelected
                    ? "bg-[#2C1810] text-amber-300 border-[#2C1810] ring-4 ring-amber-400/40"
                    : isOccupied
                    ? "bg-amber-500/10 border-amber-400/80 hover:border-amber-500 text-stone-900"
                    : "bg-white border-stone-200/90 hover:border-stone-300 text-stone-800"
                }`}
              >
                {/* Top: Code & Status Dot */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-lg font-black tracking-tight ${
                      isCurrentSelected
                        ? "text-amber-300"
                        : isOccupied
                        ? "text-amber-900"
                        : "text-[#2C1810]"
                    }`}
                  >
                    {table.table_code}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isOccupied
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOccupied ? "bg-white animate-pulse" : "bg-stone-400"
                      }`}
                    />
                    <span>{isOccupied ? "ມີແຂກ" : "ວ່າງ"}</span>
                  </span>
                </div>

                {/* Middle: Zone & Time duration */}
                <div className="my-2">
                  <p
                    className={`text-[11px] font-bold ${
                      isCurrentSelected
                        ? "text-amber-200/80"
                        : isOccupied
                        ? "text-amber-800"
                        : "text-stone-400"
                    }`}
                  >
                    {table.zone}
                  </p>
                  {isOccupied && (
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-950 mt-1">
                      <Clock className="h-3 w-3 text-amber-700" />
                      <span>{getDurationText(table.seated_at)}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Trigger */}
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs font-bold">
                  <span
                    className={`text-[10px] ${
                      isCurrentSelected ? "text-amber-300" : "text-stone-500"
                    }`}
                  >
                    {isCurrentSelected ? "ເລືອກຢູ່" : "ແຕະເພື່ອຈັດການ"}
                  </span>
                  <div
                    className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${
                      isCurrentSelected
                        ? "bg-amber-400 text-[#2C1810]"
                        : "bg-stone-100 group-hover:bg-[#2C1810] group-hover:text-amber-300 text-stone-600"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Table Action Modal / Sheet */}
      {activeDetailTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#2C1810]">
                    ໂຕະ {activeDetailTable.table_code}
                  </h4>
                  <p className="text-xs text-stone-500">
                    {activeDetailTable.zone} • {activeDetailTable.status === "occupied" ? "ມີແຂກນັ່ງຢູ່" : "ໂຕະວ່າງ"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailTable(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Actions for Table */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleSelectForOrder(activeDetailTable);
                  setActiveDetailTable(null);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2C1810] text-amber-300 p-3 text-xs sm:text-sm font-extrabold hover:bg-[#1A0D08] active:scale-98 transition-all shadow-md shadow-[#2C1810]/20 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>ເລືອກໂຕະນີ້ສັ່ງເຄື່ອງດື່ມ (Order on Table)</span>
              </button>

              {activeDetailTable.status === "occupied" && (
                <button
                  type="button"
                  onClick={() => handleFreeTableAction(activeDetailTable)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 text-rose-700 p-3 text-xs font-bold hover:bg-rose-100 active:scale-98 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>ແຈ້ງເຊັກບິນ & ປ່ອຍໂຕະວ່າງ (Free Table)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 3. Table & Zone Setup Management Modal */}
      <TableZoneManagerModal
        isOpen={isTableManagerOpen}
        onClose={() => setIsTableManagerOpen(false)}
      />
    </div>
  );
}

"use client";

// ============================================================================
// TableZoneManagerModal: Full Backoffice & Touchscreen Table & Zone Management
// QuickOne Cafe & Bakery POS
// 100% Real Supabase - Zero Mock Data
// Add / Edit / Delete Tables, Assign Zones (Indoor, Garden, 2nd Floor), Set Seats
// ============================================================================

import React, { useState } from "react";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wrench,
  UtensilsCrossed,
  Save,
  Loader2,
  Layers,
  Users,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { DiningTableEntity } from "@/types/database.types";
import { triggerHapticFeedback } from "@/utils/haptics";

interface TableZoneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TableZoneManagerModal({ isOpen, onClose }: TableZoneManagerModalProps) {
  const diningTables = useCafePosStore((s) => s.diningTables);
  const loadCatalog = useCafePosStore((s) => s.loadCatalog);

  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>("all");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTableEntity | null>(null);
  const [tableCode, setTableCode] = useState("");
  const [tableZone, setTableZone] = useState("ໃນຮ້ານ (Indoor)");
  const [customZoneInput, setCustomZoneInput] = useState("");
  const [tableSeats, setTableSeats] = useState<number>(4);
  const [tableStatus, setTableStatus] = useState<"available" | "maintenance">("available");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Extract distinct zones
  const distinctZones = Array.from(
    new Set(diningTables.map((t) => t.zone).filter(Boolean))
  );
  if (!distinctZones.includes("ໃນຮ້ານ (Indoor)")) distinctZones.unshift("ໃນຮ້ານ (Indoor)");
  if (!distinctZones.includes("ສວນ (Garden)")) distinctZones.push("ສວນ (Garden)");

  const filteredTables =
    selectedZoneFilter === "all"
      ? diningTables
      : diningTables.filter((t) => t.zone === selectedZoneFilter);

  // Open Form to Add
  const handleOpenAdd = () => {
    triggerHapticFeedback(15);
    setEditingTable(null);
    setTableCode("");
    setTableZone(selectedZoneFilter !== "all" ? selectedZoneFilter : "ໃນຮ້ານ (Indoor)");
    setCustomZoneInput("");
    setTableSeats(4);
    setTableStatus("available");
    setIsFormOpen(true);
  };

  // Open Form to Edit
  const handleOpenEdit = (table: DiningTableEntity) => {
    triggerHapticFeedback(15);
    setEditingTable(table);
    setTableCode(table.table_code);
    setTableZone(table.zone);
    setCustomZoneInput("");
    setTableSeats(table.seats || 4);
    setTableStatus(table.status === "occupied" ? "available" : (table.status as any));
    setIsFormOpen(true);
  };

  // Submit Form (Insert or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableCode.trim()) {
      toast.error("ກະລຸນາປ້ອນລະຫັດໂຕະ (ຕົວຢ່າງ: T16, VIP2)");
      return;
    }

    const finalZone = customZoneInput.trim() ? customZoneInput.trim() : tableZone;

    setIsSubmitting(true);
    try {
      if (editingTable) {
        // Update Table
        const { error } = await supabase
          .from("dining_tables")
          .update({
            table_code: tableCode.trim().toUpperCase(),
            zone: finalZone,
            seats: tableSeats,
            status: tableStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTable.id);

        if (error) throw error;
        toast.success(`ອັບເດດໂຕະ ${tableCode} ສຳເລັດແລ້ວ`);
      } else {
        // Insert Table
        const { error } = await supabase.from("dining_tables").insert([
          {
            table_code: tableCode.trim().toUpperCase(),
            zone: finalZone,
            seats: tableSeats,
            status: tableStatus,
          },
        ]);

        if (error) throw error;
        toast.success(`ເພີ່ມໂຕະ ${tableCode} ສຳເລັດແລ້ວ`);
      }

      await loadCatalog();
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກໂຕະ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Table
  const handleDeleteTable = async (table: DiningTableEntity) => {
    if (table.status === "occupied") {
      toast.error("ໂຕະກຳລັງມີແຂກນັ່ງ ບໍ່ສາມາດລຶບໄດ້! ກະລຸນາປ່ອຍໂຕະກ່ອນ.");
      return;
    }

    const confirm = window.confirm(`ທ່ານຕ້ອງການລຶບໂຕະ "${table.table_code}" ແທ້ບໍ່?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from("dining_tables")
        .delete()
        .eq("id", table.id);

      if (error) throw error;
      toast.success(`ໄດ້ລຶບໂຕະ ${table.table_code} ແລ້ວ`);
      await loadCatalog();
    } catch (err: any) {
      toast.error(err?.message || "ລຶບໂຕະບໍ່ສຳເລັດ");
    }
  };

  // Clear / Free Table (ເຄລຍໂຕະຫວ່າງ)
  const handleFreeTable = async (table: DiningTableEntity) => {
    triggerHapticFeedback(30);
    const confirm = window.confirm(`ທ່ານຕ້ອງການເຄລຍໂຕະ "${table.table_code}" ໃຫ້ເປັນໂຕະຫວ່າງແທ້ບໍ່?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from("dining_tables")
        .update({ status: "available", updated_at: new Date().toISOString() })
        .eq("id", table.id);

      if (error) throw error;
      toast.success(`ເຄລຍໂຕະ ${table.table_code} ເປັນໂຕະຫວ່າງຮຽບຮ້ອຍ`);
      await loadCatalog();
    } catch (err: any) {
      toast.error(err?.message || "ເຄລຍໂຕະບໍ່ສຳເລັດ");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-[#2C1810] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-stone-950 shadow-md">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>ຕັ້ງຄ່າຜັງໂຕະ & ໂຊນ (Table & Zone Management)</span>
              </h2>
              <p className="text-xs text-stone-300 mt-0.5">
                ເພີ່ມ, ແກ້ໄຂ, ປ່ຽນໂຊນ ແລະ ຈັດການຈຳນວນບ່ອນນັ່ງຂອງໂຕະ
              </p>
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

        {/* Action Toolbar */}
        <div className="p-4 border-b border-stone-100 bg-stone-50/70 flex flex-wrap items-center justify-between gap-2.5">
          {/* Zone Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedZoneFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedZoneFilter === "all"
                  ? "bg-[#2C1810] text-amber-300 shadow-xs"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
              }`}
            >
              ທຸກໂຊນ ({diningTables.length})
            </button>
            {distinctZones.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setSelectedZoneFilter(z)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedZoneFilter === z
                    ? "bg-[#2C1810] text-amber-300 shadow-xs"
                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                {z} ({diningTables.filter((t) => t.zone === z).length})
              </button>
            ))}
          </div>

          {/* Add Table Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white font-black text-xs hover:bg-amber-700 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>+ ເພີ່ມໂຕະໃໝ່</span>
          </button>
        </div>

        {/* Content: Form vs Table Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isFormOpen ? (
            /* Add/Edit Table Form */
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="font-black text-sm text-[#2C1810] flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                  <span>{editingTable ? `ແກ້ໄຂໂຕະ ${editingTable.table_code}` : "ເພີ່ມໂຕະໃໝ່ເຂົ້າຮ້ານ"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-stone-500 hover:text-stone-800"
                >
                  ຍົກເລີກ
                </button>
              </div>

              {/* Table Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  ລະຫັດໂຕະ (Table Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tableCode}
                  onChange={(e) => setTableCode(e.target.value)}
                  placeholder="ຕົວຢ່າງ: T16, VIP2, G05..."
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-white font-mono font-black text-sm outline-none focus:border-amber-600"
                />
              </div>

              {/* Zone Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  ໂຊນ / ພື້ນທີ່ (Zone)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {distinctZones.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => {
                        setTableZone(z);
                        setCustomZoneInput("");
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        tableZone === z && !customZoneInput
                          ? "bg-[#2C1810] text-amber-300 border-[#2C1810]"
                          : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
                <div className="pt-1.5">
                  <input
                    type="text"
                    value={customZoneInput}
                    onChange={(e) => setCustomZoneInput(e.target.value)}
                    placeholder="ຫຼື ພິມຊື່ໂຊນໃໝ່ (ຕົວຢ່າງ: ຊັ້ນ 2, ລະບຽງ, VIP Room...)"
                    className="w-full h-10 px-3.5 rounded-xl border border-stone-200 bg-white text-xs font-medium outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Seats Count */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  ຈຳນວນບ່ອນນັ່ງ (Seats)
                </label>
                <div className="flex items-center gap-2">
                  {[2, 4, 6, 8, 10].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTableSeats(s)}
                      className={`h-9 px-3.5 rounded-xl border text-xs font-bold transition-all ${
                        tableSeats === s
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {s} ບ່ອນນັ່ງ
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={tableSeats}
                    onChange={(e) => setTableSeats(Number(e.target.value) || 2)}
                    className="h-9 w-20 px-2 rounded-xl border border-stone-200 bg-white text-center font-bold text-xs"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  ສະຖານະໂຕະ (Status)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTableStatus("available")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                      tableStatus === "available"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-black"
                        : "bg-white border-stone-200 text-stone-600"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>ພ້ອມຮັບແຂກ (Available)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableStatus("maintenance")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                      tableStatus === "maintenance"
                        ? "bg-amber-50 text-amber-900 border-amber-300 font-black"
                        : "bg-white border-stone-200 text-stone-600"
                    }`}
                  >
                    <Wrench className="h-4 w-4" />
                    <span>ປິດປັບປຸງ (Maintenance)</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-white"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C1810] text-amber-300 font-black text-xs hover:bg-stone-900 shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{editingTable ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກໂຕະໃໝ່"}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Tables Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredTables.map((table) => {
                const isOccupied = table.status === "occupied";
                const isMaintenance = table.status === "maintenance";

                return (
                  <div
                    key={table.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between select-none ${
                      isOccupied
                        ? "bg-orange-50/80 border-orange-300 shadow-xs"
                        : isMaintenance
                        ? "bg-stone-100 border-stone-300 opacity-75"
                        : "bg-white border-stone-200 hover:border-amber-400 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="font-black text-base font-mono text-[#2C1810]">
                          {table.table_code}
                        </div>
                        <div className="text-[11px] font-semibold text-stone-500 mt-0.5">
                          {table.zone}
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          isOccupied
                            ? "bg-orange-100 text-orange-900 border-orange-200"
                            : isMaintenance
                            ? "bg-stone-200 text-stone-700 border-stone-300"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {isOccupied ? "ມີແຂກ" : isMaintenance ? "ປັບປຸງ" : "ວ່າງ"}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span className="flex items-center gap-1 font-bold text-stone-600">
                        <Users className="h-3.5 w-3.5 text-stone-400" />
                        <span>{table.seats || 4} ບ່ອນນັ່ງ</span>
                      </span>

                      <div className="flex items-center gap-1">
                        {isOccupied && (
                          <button
                            type="button"
                            onClick={() => handleFreeTable(table)}
                            className="h-7 px-2 flex items-center gap-1 rounded-lg bg-orange-600 text-white hover:bg-orange-700 active:scale-90 transition-all cursor-pointer text-[10px] font-bold shadow-2xs"
                            title="ເຄລຍໂຕະຫວ່າງ (Free Table)"
                          >
                            <LogOut className="h-3 w-3" />
                            <span>ເຄລຍຫວ່າງ</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(table)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-90 transition-all cursor-pointer"
                          title="ແກ້ໄຂໂຕະ"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTable(table)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-90 transition-all cursor-pointer"
                          title="ລຶບໂຕະ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

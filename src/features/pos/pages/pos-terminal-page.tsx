"use client";

// ============================================================================
// Master POS Terminal Page - QuickOne Cafe & Bakery (100% Real Supabase)
// Artisanal Specialty Coffee & Bakery Studio UI
// Modes: Terminal POS (ຈຸດຂາຍດ່ວນ) | Tables Map (ຜັງໂຕະ) | Barista KDS (ຄິວຊົງນ້ຳ)
// Zero Mock Data - Automatic Supabase Setup Guide if database unseeded
// ============================================================================

import React, { useEffect, useState } from "react";
import { ShoppingBag, ChevronUp, X } from "lucide-react";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { CafePosHeader } from "../components/CafePosHeader";
import { DrinkCatalogGrid } from "../components/DrinkCatalogGrid";
import { CafeCartPanel } from "../components/CafeCartPanel";
import { TableMapTab } from "../components/TableMapTab";
import { BaristaKdsTab } from "../components/BaristaKdsTab";
import { BaristaModifierModal } from "../components/BaristaModifierModal";
import { SupabaseSetupGuide } from "../components/SupabaseSetupGuide";
import { formatLak } from "@/utils/formatLakCurrency";
import { useShiftStore } from "@/features/shifts";

export function PosTerminalPage() {
  const loadCatalog = useCafePosStore((s) => s.loadCatalog);
  const currentTab = useCafePosStore((s) => s.currentTab);
  const hasTablesInDb = useCafePosStore((s) => s.hasTablesInDb);
  const menuItems = useCafePosStore((s) => s.menuItems);
  const dbError = useCafePosStore((s) => s.dbError);
  const totals = useCafePosStore((s) => s.totals);

  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const loadActiveShift = useShiftStore((s) => s.loadActiveShift);

  // Load live Supabase catalog & active shift on mount
  useEffect(() => {
    loadCatalog();
    loadActiveShift();
  }, [loadCatalog, loadActiveShift]);

  // If Supabase schema does not have the tables yet, show the guided setup screen
  if (!hasTablesInDb && menuItems.length === 0) {
    return <SupabaseSetupGuide error={dbError} />;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#FAF7F2] select-none text-stone-900 font-sans">
      {/* 1. Barista Header Toolbar */}
      <CafePosHeader />

      {/* 2. Main Work Area based on currentTab */}
      <main className="flex flex-1 overflow-hidden p-2.5 sm:p-3 gap-2.5 sm:gap-3 min-h-0">
        {currentTab === "terminal" ? (
          <>
            {/* Left Area: Visual Category Pills + Drink Studio Catalog Grid */}
            <section className="flex flex-1 flex-col overflow-hidden min-w-0 min-h-0">
              <DrinkCatalogGrid />
            </section>

            {/* Right Area: Barista Order Ticket (Cart & Modifiers) */}
            <aside className="hidden md:flex w-[400px] xl:w-[440px] shrink-0 flex-col overflow-hidden">
              <CafeCartPanel />
            </aside>
          </>
        ) : currentTab === "tables" ? (
          <section className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
            <TableMapTab />
          </section>
        ) : (
          <section className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
            <BaristaKdsTab />
          </section>
        )}
      </main>

      {/* 3. Floating Bottom Cart Bar (Mobile Only: < 768px when cart has items) */}
      {currentTab === "terminal" && totals.totalItemCount > 0 && !isMobileCartOpen && (
        <div className="fixed bottom-3 left-3 right-3 z-40 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full flex items-center justify-between rounded-2xl bg-[#2C1810] text-white px-4 py-3 shadow-xl active:scale-[0.99] transition-all cursor-pointer border border-stone-800"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-[#2C1810] shadow-xs font-black">
                <ShoppingBag className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-2xs">
                  {totals.totalItemCount}
                </span>
              </div>
              <div className="text-left">
                <div className="text-[10px] text-amber-200/80 font-bold leading-none">
                  ອໍເດີ ({totals.totalItemCount} ຈອກ)
                </div>
                <div className="text-sm font-black text-white tabular-nums leading-tight mt-0.5">
                  {formatLak(totals.finalTotal)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-white/20 transition-all">
              <span>ເບິ່ງອໍເດີ</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* 4. Mobile Cart Drawer Sheet (< 768px) */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="relative mt-auto h-[90vh] w-full rounded-t-3xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 bg-stone-50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-900 font-bold">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#2C1810]">
                  ອໍເດີເຄື່ອງດື່ມ ({totals.totalItemCount} ຈອກ)
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-2">
              <CafeCartPanel />
            </div>
          </div>
        </div>
      )}

      {/* 5. Tactile Barista Modifier Modal / Drawer */}
      <BaristaModifierModal />
    </div>
  );
}

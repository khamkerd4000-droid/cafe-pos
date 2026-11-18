"use client";

// ============================================================================
// DrinkCatalogGrid: Category Visual Pills + Compact Search + Drink Studio Grid
// Artisanal Specialty Coffee & Bakery Catalog for Barista Touch POS
// ============================================================================

import React from "react";
import {
  Coffee,
  CupSoda,
  Sparkles,
  IceCream,
  Cake,
  LayoutGrid,
  Search,
  X,
  RefreshCw,
  SlidersHorizontal,
  PackageX,
  AlertCircle,
} from "lucide-react";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { DrinkStudioCard } from "./DrinkStudioCard";
import { triggerHapticFeedback } from "@/utils/haptics";

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  Coffee: <Coffee className="h-4 w-4" />,
  CupSoda: <CupSoda className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  IceCream: <IceCream className="h-4 w-4" />,
  Cake: <Cake className="h-4 w-4" />,
  LayoutGrid: <LayoutGrid className="h-4 w-4" />,
};

export function DrinkCatalogGrid() {
  const categories = useCafePosStore((s) => s.categories);
  const menuItems = useCafePosStore((s) => s.menuItems);
  const activeCategory = useCafePosStore((s) => s.activeCategory);
  const setActiveCategory = useCafePosStore((s) => s.setActiveCategory);
  const searchQuery = useCafePosStore((s) => s.searchQuery);
  const setSearchQuery = useCafePosStore((s) => s.setSearchQuery);
  const showOnlyAvailable = useCafePosStore((s) => s.showOnlyAvailable);
  const setShowOnlyAvailable = useCafePosStore((s) => s.setShowOnlyAvailable);
  const isLoadingCatalog = useCafePosStore((s) => s.isLoadingCatalog);
  const loadCatalog = useCafePosStore((s) => s.loadCatalog);

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    // 1. Category Filter
    if (activeCategory !== "all" && item.category_id !== activeCategory) {
      return false;
    }

    // 2. Only Available (86-ed toggle)
    if (showOnlyAvailable && !item.is_available) {
      return false;
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchEn = item.name_en?.toLowerCase().includes(q);
      return matchName || matchEn;
    }

    return true;
  });

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden gap-2.5">
      {/* 1. Control Toolbar: Visual Category Pills + Compact Search + 86-ed Toggle */}
      <div className="flex flex-col gap-2 rounded-2xl border border-stone-200/90 bg-white p-2 sm:p-2.5 shadow-2xs shrink-0 select-none">
        {/* Top: Compact Search Bar & 86-ed Toggle */}
        <div className="flex items-center gap-2">
          {/* Compact Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາຊື່ເຄື່ອງດື່ມ, ກາເຟ, ເບເກີຣີ..."
              className="h-9 w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-9 pr-8 text-xs font-semibold text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-600 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* 86-ed Quick Toggle (ໝົດຊົ່ວຄາວ) */}
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(15);
              setShowOnlyAvailable(!showOnlyAvailable);
            }}
            className={`flex h-9 items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
              !showOnlyAvailable
                ? "bg-amber-100 text-amber-900 border-amber-300"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
            }`}
            title="ສະແດງເມນູທີ່ໝົດຊົ່ວຄາວນຳ"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-700" />
            <span className="hidden sm:inline">
              {!showOnlyAvailable ? "ສະແດງທັງໝົດ" : "ສະເພາະທີ່ມີ"}
            </span>
          </button>
        </div>

        {/* Bottom: Horizontal Visual Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
          {/* 'All' Category Pill */}
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(15);
              setActiveCategory("all");
            }}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
              activeCategory === "all"
                ? "bg-[#2C1810] text-amber-300 shadow-xs"
                : "border border-stone-200 bg-stone-50/80 text-stone-700 hover:bg-stone-100"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>ທັງໝົດ ({menuItems.length})</span>
          </button>

          {/* Dynamic Categories from Supabase */}
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = menuItems.filter((m) => m.category_id === cat.id).length;
            const icon = CATEGORY_ICON_MAP[cat.icon || ""] || <Coffee className="h-3.5 w-3.5" />;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  triggerHapticFeedback(15);
                  setActiveCategory(cat.id);
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  isActive
                    ? "bg-[#2C1810] text-amber-300 shadow-xs"
                    : "border border-stone-200 bg-stone-50/80 text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className={isActive ? "text-amber-400" : "text-amber-700"}>
                  {icon}
                </span>
                <span>{cat.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? "bg-[#3D2217] text-amber-200" : "bg-stone-200/80 text-stone-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Drink Studio Catalog Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 no-scrollbar">
        {isLoadingCatalog && menuItems.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 pb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <div
                key={n}
                className="flex flex-col h-full rounded-2xl border border-stone-200/80 bg-white p-2 shadow-2xs animate-pulse"
              >
                <div className="h-36 w-full rounded-xl bg-stone-100" />
                <div className="px-1 pt-2 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-stone-200" />
                  <div className="h-4 w-1/3 rounded bg-stone-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 p-6 text-center select-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-2.5">
              <PackageX className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-800">ບໍ່ພົບລາຍການເຄື່ອງດື່ມ</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              {searchQuery
                ? `ບໍ່ມີເຄື່ອງດື່ມກົງກັບຄຳຄົ້ນຫາ "${searchQuery}"`
                : "ຍັງບໍ່ມີເມນູໃນໝວດໝູ່ນີ້ ຫຼື ເມນູຖືກຕັ້ງເປັນໝົດຊົ່ວຄາວ"}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
              >
                ລຶບການຄົ້ນຫາ
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 pb-4">
            {filteredItems.map((item) => (
              <DrinkStudioCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

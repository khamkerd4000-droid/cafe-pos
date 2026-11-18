"use client";

// ============================================================================
// CafePosHeader: Artisanal Specialty Coffee & Bakery Barista Header
// Navigation Switcher Tabs: POS Terminal | Table Map | Barista KDS
// Multi-bill Tabs, Smart Shift Indicator & Hardware Peripherals
// ============================================================================

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Menu,
  Clock,
  Printer,
  Settings2,
  LockOpen,
  Coffee,
  UtensilsCrossed,
  Layers,
  ShieldCheck,
  AlertCircle,
  Plus,
  X,
  PauseCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { QuickOneLogo } from "@/components/QuickOneLogo";
import { NetworkSyncBadge } from "@/components/NetworkSyncBadge";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth, UserProfileMenu } from "@/features/auth";
import {
  useShiftStore,
  OpenShiftDialog,
  CloseShiftBlindDialog,
  formatShiftDuration,
} from "@/features/shifts";
import { PosScreenTab } from "../types/cafe.types";
import { triggerHapticFeedback } from "@/utils/haptics";
import { PrinterSettingsModal } from "./PrinterSettingsModal";

export function CafePosHeader() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  const currentTab = useCafePosStore((s) => s.currentTab);
  const setCurrentTab = useCafePosStore((s) => s.setCurrentTab);
  const bills = useCafePosStore((s) => s.bills);
  const activeBillId = useCafePosStore((s) => s.activeBillId);
  const cart = useCafePosStore((s) => s.cart);
  const holdCurrentOrder = useCafePosStore((s) => s.holdCurrentOrder);
  const switchBill = useCafePosStore((s) => s.switchBill);
  const deleteBill = useCafePosStore((s) => s.deleteBill);
  const kdsOrders = useCafePosStore((s) => s.kdsOrders);
  const diningTables = useCafePosStore((s) => s.diningTables);

  const activeShift = useShiftStore((s) => s.activeShift);
  const loadActiveShift = useShiftStore((s) => s.loadActiveShift);
  const openOpenShiftModal = useShiftStore((s) => s.openOpenShiftModal);
  const openCloseShiftModal = useShiftStore((s) => s.openCloseShiftModal);

  // Sync Active Shift from Supabase on mount and every 30s
  useEffect(() => {
    loadActiveShift();
    const interval = setInterval(() => {
      loadActiveShift();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadActiveShift]);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleHoldClick = () => {
    if (cart.length === 0) {
      toast.info("ບໍ່ມີເຄື່ອງດື່ມໃນກະຕ່າເພື່ອພັກບິນ");
      return;
    }
    const success = holdCurrentOrder();
    if (success) {
      toast.success("ໄດ້ພັກບິນ ແລະ ເປີດບິນໃໝ່ສຳເລັດແລ້ວ");
    }
  };

  const shiftDuration = activeShift
    ? formatShiftDuration(activeShift.opening_time)
    : "";

  const pendingKdsCount = kdsOrders.filter((o) => o.order_status === "preparing").length;
  const occupiedTablesCount = diningTables.filter((t) => t.status === "occupied").length;

  return (
    <>
      <header className="flex h-13 w-full items-center justify-between border-b border-stone-200/90 bg-white px-2.5 sm:px-4 shadow-2xs select-none gap-2 shrink-0 touch-manipulation">
        {/* 1. Left: Menu Trigger & Coffee Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(15);
              setIsMenuOpen(true);
            }}
            className="flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-amber-400 active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="ເມນູລະບົບ (Menu)"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <QuickOneLogo size="md" showText={true} />
        </div>

        {/* 2. Center: Mode Switcher Tabs (Terminal / Tables / KDS Queue) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-xl mx-auto">
          {/* Main 3 View Modes */}
          <div className="flex items-center rounded-2xl bg-stone-100 p-1 border border-stone-200 text-xs font-extrabold shadow-2xs">
            {/* Terminal POS Tab */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(15);
                setCurrentTab("terminal");
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                currentTab === "terminal"
                  ? "bg-[#2C1810] text-amber-300 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Coffee className="h-3.5 w-3.5" />
              <span>ຂາຍໜ້າຮ້ານ</span>
            </button>

            {/* Tables Tab */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(15);
                setCurrentTab("tables");
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                currentTab === "tables"
                  ? "bg-[#2C1810] text-amber-300 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              <span>ຜັງໂຕະ</span>
              {occupiedTablesCount > 0 && (
                <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[9px] font-black">
                  {occupiedTablesCount}
                </span>
              )}
            </button>

            {/* KDS Barista Queue Tab */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(15);
                setCurrentTab("kds");
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                currentTab === "kds"
                  ? "bg-[#2C1810] text-amber-300 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>ຄິວຊົງນ້ຳ</span>
              {pendingKdsCount > 0 && (
                <span className="rounded-full bg-orange-600 text-white px-1.5 py-0.2 text-[9px] font-black animate-pulse">
                  {pendingKdsCount}
                </span>
              )}
            </button>
          </div>

          {/* Multi-bill Tabs on Terminal Screen */}
          {currentTab === "terminal" && (
            <div className="hidden xl:flex items-center gap-1 ml-1 pl-1 border-l border-stone-200">
              {bills.map((bill) => {
                const isActive = bill.id === activeBillId;
                const itemCount = isActive ? cart.length : bill.items.length;

                return (
                  <button
                    key={bill.id}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(15);
                      switchBill(bill.id);
                    }}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#2C1810] text-amber-300 shadow-xs"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                    }`}
                  >
                    <span>{bill.tabTitle}</span>
                    <span className="rounded-full bg-stone-300/60 px-1 py-0.2 text-[9px] font-mono">
                      {itemCount}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleHoldClick}
                className="flex items-center gap-1 rounded-xl border border-dashed border-amber-500 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
                title="ພັກບິນປັດຈຸບັນ ແລະ ເປີດບິນໃໝ່"
              >
                <Plus className="h-3 w-3" />
                <span>+ ພັກບິນ</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Right: Clock, Shift Status, Hardware & Staff */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2.5 h-9 text-xs font-bold text-stone-700 font-mono">
            <Clock className="h-3.5 w-3.5 text-stone-400" />
            <span>{currentTime}</span>
          </div>

          <NetworkSyncBadge />

          {/* Printer Settings Button */}
          <button
            type="button"
            onClick={() => setIsPrinterSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="ຕັ້ງຄ່າເຄື່ອງພິມ"
          >
            <Printer className="h-4 w-4 text-stone-600" />
          </button>

          {/* Shift Control Button */}
          {!activeShift ? (
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(20);
                openOpenShiftModal();
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
              title="ກົດເພື່ອເປີດກະຂາຍໃໝ່"
            >
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="whitespace-nowrap">ເປີດກະ</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(20);
                openCloseShiftModal();
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-400/80 bg-amber-500/10 px-2.5 text-xs font-bold text-[#2C1810] hover:bg-amber-100 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
              title="ກວດສອບ ຫຼື ປິດກະຂາຍ"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700 shrink-0" />
              <span className="whitespace-nowrap">
                ປິດກະ{" "}
                <span className="font-mono text-[11px] text-amber-800 font-semibold">
                  ({shiftDuration})
                </span>
              </span>
            </button>
          )}

          {/* Staff profile menu */}
          <UserProfileMenu compact={true} />
        </div>
      </header>

      {/* Slide-out Navigation Drawer */}
      <AppSidebar
        mode="drawer"
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Printer Modal */}
      <PrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
      />

      {/* Shift Dialogs */}
      <OpenShiftDialog />
      <CloseShiftBlindDialog />
    </>
  );
}

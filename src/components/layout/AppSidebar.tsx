"use client";

// ============================================================================
// AppSidebar: QuickOne Cafe & Bakery Universal Sidebar (Lao Language)
// Supports Collapsible Mode (Backoffice) & Overlay Drawer Mode (POS Terminal)
// Warm Latte & Espresso Styling
// ============================================================================

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Coffee,
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  ShieldCheck,
  LogOut,
  Loader2,
} from "lucide-react";
import { useAuth, formatRoleLabel, getRoleBadgeClass } from "@/features/auth";
import { QuickOneLogo } from "@/components/QuickOneLogo";

export interface NavItem {
  name: string;
  subname: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  isSpecial?: boolean;
}

export const BACKOFFICE_NAV_ITEMS: NavItem[] = [
  {
    name: "ຂາຍໜ້າຮ້ານ (POS)",
    subname: "Barista & Cafe Studio",
    href: "/pos",
    icon: Coffee,
    isSpecial: true,
  },
  {
    name: "ພາບລວມ (Dashboard)",
    subname: "ສະຖິຕິ & ຍອດຂາຍ",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "ເມນູ & ທ໊ອບປິ້ງ",
    subname: "ລາຍການເຄື່ອງດື່ມ & Bakery",
    href: "/products",
    icon: UtensilsCrossed,
  },
  {
    name: "ປະຫວັດບິນ & ຄິວ",
    subname: "ລາຍການບິນ & ພິມສະຕິກເກີ",
    href: "/orders",
    icon: Receipt,
  },
  {
    name: "ຕັ້ງຄ່າຮ້ານ",
    subname: "ລະບົບ & ພະນັກງານ",
    href: "/settings",
    icon: Settings,
  },
];

interface AppSidebarProps {
  mode?: "collapsible" | "drawer";
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({
  mode = "collapsible",
  isOpen = false,
  onClose,
  collapsed: externalCollapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    const confirmLogout = window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການອອກຈາກລະບົບ? (Logout)");
    if (!confirmLogout) return;

    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isControlled = typeof externalCollapsed === "boolean";
  const isCollapsed = isControlled ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // Helper for Nav Items
  const renderNavList = (collapsedState: boolean) => (
    <nav className="flex-1 space-y-1.5 px-2.5 py-3 overflow-y-auto no-scrollbar">
      {BACKOFFICE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/pos" && (pathname.startsWith(item.href + "/") || pathname === item.href));

        // 1. Special POS Button
        if (item.isSpecial) {
          return (
            <React.Fragment key={item.href}>
              <div className="px-0.5 pb-1">
                <Link
                  href={item.href}
                  onClick={onClose}
                  title={collapsedState ? item.name : undefined}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-[#2C1810] text-amber-300 font-extrabold shadow-md"
                      : "border border-stone-200 bg-stone-50/80 text-stone-700 hover:bg-stone-100 hover:text-stone-900 font-bold"
                  } ${collapsedState ? "justify-center px-1.5" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isActive
                        ? "bg-amber-400 text-stone-950 font-black"
                        : "bg-white border border-stone-200 text-stone-700 group-hover:text-amber-800 shadow-2xs"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  {!collapsedState && (
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-black leading-tight ${
                          isActive ? "text-amber-300" : "text-stone-800"
                        }`}
                      >
                        {item.name}
                      </div>
                      <div
                        className={`text-[10px] leading-none mt-0.5 ${
                          isActive ? "text-stone-300" : "text-stone-400"
                        }`}
                      >
                        {item.subname}
                      </div>
                    </div>
                  )}

                  {!collapsedState && !isActive && (
                    <span className="text-[9px] font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                      POS
                    </span>
                  )}
                </Link>
              </div>
              <div className="border-b border-stone-200/80 my-2 mx-1" />
            </React.Fragment>
          );
        }

        // 2. Regular Backoffice Menu Item
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            title={collapsedState ? item.name : undefined}
            className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all cursor-pointer select-none ${
              isActive
                ? "bg-amber-100/70 text-[#2C1810] font-black border-l-4 border-amber-600 shadow-2xs"
                : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900 font-semibold border-l-4 border-transparent"
            } ${collapsedState ? "justify-center px-1.5 border-l-0" : ""}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? "bg-[#2C1810] text-amber-300 shadow-2xs"
                  : "text-stone-500 group-hover:text-stone-800 group-hover:bg-stone-200/50"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>

            {!collapsedState && (
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs leading-tight ${
                    isActive ? "text-[#2C1810] font-black" : "text-stone-700 font-bold"
                  }`}
                >
                  {item.name}
                </div>
                <div
                  className={`text-[10px] leading-none mt-0.5 truncate ${
                    isActive ? "text-amber-800 font-semibold" : "text-stone-400"
                  }`}
                >
                  {item.subname}
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );

  // Helper for Store Header
  const renderHeader = (collapsedState: boolean, showCloseBtn: boolean) => (
    <div className="flex h-16 items-center justify-between border-b border-stone-200/80 px-4 select-none shrink-0 bg-white">
      <div className={`flex items-center min-w-0 ${collapsedState ? "justify-center w-full" : "flex-1 justify-start"}`}>
        <QuickOneLogo size="md" showText={!collapsedState} />
      </div>

      {showCloseBtn && (
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer ml-2"
          title="ປິດເມນູ"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );

  // Helper for Staff Profile Footer
  const renderFooter = (collapsedState: boolean, showCollapseToggle: boolean) => (
    <div className="border-t border-stone-200/80 bg-stone-50/70 p-3 shrink-0 select-none">
      <div
        className={`flex items-center gap-2.5 rounded-2xl p-2 transition-colors ${
          collapsedState ? "justify-center" : "bg-white border border-stone-200/80 shadow-2xs"
        }`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
          <User className="h-4 w-4" />
        </div>

        {!collapsedState && (
          <>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-stone-800 truncate block">
                {user?.full_name_lo || "Barista / ພະນັກງານ"}
              </span>
              <div className="mt-0.5">
                <span
                  className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8.5px] font-bold border leading-none ${getRoleBadgeClass(
                    user?.role
                  )}`}
                >
                  <ShieldCheck className="h-2.5 w-2.5" />
                  <span>{formatRoleLabel(user?.role)}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
              title="ອອກຈາກລະບົບ (Logout)"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </button>
          </>
        )}
      </div>

      {showCollapseToggle && (
        <div className="mt-2.5 flex justify-center">
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex h-7 w-full items-center justify-center rounded-xl text-stone-400 hover:bg-stone-200/70 hover:text-stone-700 transition-colors cursor-pointer text-[11px] font-bold gap-1"
            title={collapsedState ? "ຂະຫຍາຍເມນູ" : "ຫຍໍ້ເມນູ"}
          >
            {collapsedState ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>ຫຍໍ້ເມນູ</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  // 1. DRAWER OVERLAY MODE
  if (mode === "drawer") {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={onClose}
        />
        <div className="relative z-10 flex h-full w-[280px] flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
          {renderHeader(false, true)}
          {renderNavList(false)}
          {renderFooter(false, false)}
        </div>
      </div>
    );
  }

  // 2. COLLAPSIBLE BACKOFFICE MODE
  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-stone-200 bg-white transition-[width] duration-200 shrink-0 ${
        isCollapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {renderHeader(isCollapsed, false)}
      {renderNavList(isCollapsed)}
      {renderFooter(isCollapsed, true)}
    </aside>
  );
}

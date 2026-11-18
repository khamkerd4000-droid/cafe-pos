"use client";

// ============================================================================
// DashboardPage: Specialty Coffee & Bakery Back-Office Analytics Overview
// 100% Real Supabase - Zero Mock Data
// Metrics: Real Revenue, Top 5 Best-Selling Drinks, Dine-in vs Takeaway, Cash vs QR
// ============================================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Coffee,
  UtensilsCrossed,
  Package,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  QrCode,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useDashboardStore } from "../stores/dashboard.store";
import { DashboardTimeRange } from "../types/dashboard.types";
import { formatLak } from "@/utils/formatLakCurrency";

export function DashboardPage() {
  const {
    timeRange,
    setTimeRange,
    kpis,
    paymentBreakdown,
    orderTypeBreakdown,
    topProducts,
    stockAlerts,
    recentOrders,
    isLoading,
    loadDashboardStats,
  } = useDashboardStore();

  useEffect(() => {
    loadDashboardStats();
  }, [timeRange, loadDashboardStats]);

  const timeRangeOptions: { id: DashboardTimeRange; label: string }[] = [
    { id: "today", label: "ມື້ນີ້ (Today)" },
    { id: "week", label: "7 ວັນຜ່ານມາ (Week)" },
    { id: "month", label: "30 ວັນຜ່ານມາ (Month)" },
  ];

  const totalRevenue = kpis?.totalRevenue || 0;
  const totalOrdersCount = kpis?.totalOrdersCount || 0;
  const averageOrderValue = kpis?.averageOrderValue || 0;

  return (
    <div className="space-y-4">
      {/* 1. Header Bar: Title, Range Filter & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2C1810] text-amber-300 shadow-xs">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#2C1810] leading-tight">
              ພາບລວມຮ້ານກາເຟ & ເບເກີຣີ (QuickOne Cafe Overview)
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              ສະຖິຕິຍອດຂາຍຕົວຈິງ, Top ເຄື່ອງດື່ມຂາຍດີ, ອັດຕາກິນທີ່ຮ້ານ vs ກັບບ້ານ (Supabase Real Data)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Range Selector */}
          <div className="flex items-center rounded-2xl bg-stone-100 p-1 border border-stone-200 shadow-2xs">
            {timeRangeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTimeRange(opt.id)}
                className={`h-9 rounded-xl px-3.5 text-xs font-bold transition-all cursor-pointer ${
                  timeRange === opt.id
                    ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh Data Button */}
          <button
            type="button"
            onClick={() => loadDashboardStats()}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-amber-700" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Primary Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Revenue */}
        <div className="flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500">ຍອດຂາຍລວມ (Total Revenue)</span>
              <div className="text-xl sm:text-2xl font-black text-[#2C1810] mt-1 tabular-nums">
                {formatLak(totalRevenue)}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-stone-500 pt-2 border-t border-stone-100">
            <span>ຈຳນວນອໍເດີ:</span>
            <span className="font-extrabold text-[#2C1810] tabular-nums">{totalOrdersCount} ອໍເດີ</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500">ສະເລ່ຍຕໍ່ບິນ (Avg Order Value)</span>
              <div className="text-xl sm:text-2xl font-black text-[#2C1810] mt-1 tabular-nums">
                {formatLak(averageOrderValue)}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-[#2C1810]">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-stone-500 pt-2 border-t border-stone-100">
            <span>ຄິດໄລ່ຈາກຍອດຂາຍຕົວຈິງ</span>
          </div>
        </div>

        {/* Dine-in vs Takeaway Ratio */}
        <div className="flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500">ກິນທີ່ຮ້ານ vs ກັບບ້ານ</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-amber-900">
                  {orderTypeBreakdown?.dineInPct || 0}% ທີ່ຮ້ານ
                </span>
                <span className="text-xs text-stone-400">/</span>
                <span className="text-sm font-bold text-sky-800">
                  {orderTypeBreakdown?.takeawayPct || 0}% ກັບບ້ານ
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-stone-500 pt-2 border-t border-stone-100">
            <span>ທີ່ຮ້ານ: {orderTypeBreakdown?.dineInCount || 0} ບິນ</span>
            <span>ກັບບ້ານ: {orderTypeBreakdown?.takeawayCount || 0} ບິນ</span>
          </div>
        </div>

        {/* Cash vs QR Payment Breakdown */}
        <div className="flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500">ເງິນສົດ vs LAO QR</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-emerald-800">
                  {paymentBreakdown?.cashPct || 0}% ສົດ
                </span>
                <span className="text-xs text-stone-400">/</span>
                <span className="text-sm font-bold text-indigo-700">
                  {paymentBreakdown?.transferPct || 0}% QR
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <QrCode className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-stone-500 pt-2 border-t border-stone-100">
            <span>ສົດ: {formatLak(paymentBreakdown?.cashTotal || 0)}</span>
            <span>QR: {formatLak(paymentBreakdown?.transferTotal || 0)}</span>
          </div>
        </div>
      </div>

      {/* 3. Top 5 Best-Selling Drinks Today & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Real Recent POS Orders from Supabase */}
        <div className="lg:col-span-2 rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3.5 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#2C1810]">
                ລາຍການອໍເດີຫຼ້າສຸດ (Recent Orders)
              </h3>
              <p className="text-[11px] text-stone-400">
                ຂໍ້ມູນຈິງຈາກ Supabase Database
              </p>
            </div>
            <Link
              href="/orders"
              className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
            >
              <span>ເບິ່ງທັງໝົດ</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-50/70 text-[11px] text-stone-500 uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">ຄິວ & ລະຫັດບິນ</th>
                  <th className="py-2.5 px-3">ເວລາ</th>
                  <th className="py-2.5 px-3">ຮູບແບບ</th>
                  <th className="py-2.5 px-3">ວິທີຊຳລະ</th>
                  <th className="py-2.5 px-3 text-right">ຍອດລວມ</th>
                  <th className="py-2.5 px-3 text-center">ສະຖານະ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400 font-semibold">
                      ຍັງບໍ່ທັນມີລາຍການອໍເດີໃນຊ່ວງເວລານີ້
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => {
                    const timeFormatted = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";

                    return (
                      <tr key={ord.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">
                          <span className="font-black text-[#2C1810] mr-1.5">
                            #{ord.queueNumber || "01"}
                          </span>
                          <span className="text-[10.5px] text-stone-500 font-normal">
                            ({ord.orderNumber})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-stone-600 font-medium">{timeFormatted}</td>
                        <td className="py-3 px-3">
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10.5px] font-bold text-stone-700">
                            {ord.orderType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-700">
                          {ord.paymentMethod}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-[#2C1810] text-sm tabular-nums">
                          {formatLak(ord.total)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{ord.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Top 5 Best-Selling Drinks Today */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#2C1810]">
                  Top 5 ເຄື່ອງດື່ມຂາຍດີສຸດ
                </h3>
              </div>
            </div>

            {topProducts.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">
                ຍັງບໍ່ມີຂໍ້ມູນການຂາຍເຄື່ອງດື່ມ
              </p>
            ) : (
              <div className="space-y-2.5">
                {topProducts.map((p, idx) => (
                  <div
                    key={p.productId || idx}
                    className="flex items-center justify-between p-2 rounded-2xl border border-stone-100 bg-stone-50/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#2C1810] text-amber-300 font-mono font-black text-xs">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {p.productName}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          ຂາຍໄດ້ {p.quantitySold} ຈອກ
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#2C1810] tabular-nums">
                        {formatLak(p.totalRevenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Out of Stock (86-ed) alerts if any */}
          {stockAlerts.length > 0 && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <span>ເມນູທີ່ໝົດຊົ່ວຄາວ (86-ed)</span>
              </div>
              <div className="space-y-1">
                {stockAlerts.map((a) => (
                  <div
                    key={a.id}
                    className="text-xs text-stone-700 font-medium flex justify-between"
                  >
                    <span>• {a.productName}</span>
                    <span className="text-amber-800 font-bold text-[10px]">
                      {a.detail}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/products"
                className="mt-2 block text-center rounded-xl bg-amber-600 text-white py-1.5 text-xs font-bold hover:bg-amber-700"
              >
                ຈັດການເມນູ & ເປີດຂາຍຄືນ
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

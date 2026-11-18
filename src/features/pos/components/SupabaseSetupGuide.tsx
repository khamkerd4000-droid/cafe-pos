"use client";

// ============================================================================
// SupabaseSetupGuide: Friendly Setup Guide Screen when Tables are not yet created
// 100% Real Supabase - ZERO Mock Data Rule
// ============================================================================

import React, { useState } from "react";
import {
  Database,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Terminal,
  AlertTriangle,
  Coffee,
} from "lucide-react";
import { toast } from "sonner";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { QuickOneLogo } from "@/components/QuickOneLogo";

export function SupabaseSetupGuide({ error }: { error?: string | null }) {
  const loadCatalog = useCafePosStore((s) => s.loadCatalog);
  const isLoading = useCafePosStore((s) => s.isLoadingCatalog);
  const [copied, setCopied] = useState(false);

  const handleCopySqlInstruction = () => {
    const instruction = `-- ກະລຸນາເປີດໄຟລ໌: supabase/schema_cafe.sql ໃນໂຄງການ
-- ແລ້ວຄັດລອກເນື້ອໃນທັງໝົດໄປ Run ໃນ Supabase SQL Editor.`;
    navigator.clipboard.writeText(instruction);
    setCopied(true);
    toast.success("ໄດ້ຄັດລອກຄຳແນະນຳແລ້ວ! ກະລຸນາເປີດ supabase/schema_cafe.sql ເພື່ອ Run.");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#FAF7F2] p-4 select-none text-stone-900 font-sans">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-stone-200/90 space-y-6">
        {/* Header & Brand */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <QuickOneLogo size="md" showText={true} />
          <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-black border border-amber-300">
            100% Real Supabase
          </span>
        </div>

        {/* Status Banner */}
        <div className="rounded-2xl bg-amber-50 border border-amber-200/90 p-4 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>ລະບົບຕ້ອງການຕາຕະລາງຖານຂໍ້ມູນ (Supabase Database Tables Required)</span>
          </div>
          <p className="text-xs text-amber-900/80 leading-relaxed">
            ລະບົບ <strong>QuickOne Cafe POS</strong> ເຮັດວຽກກັບຖານຂໍ້ມູນ Supabase ຕົວຈິງ (Zero Mock Data).
            {error ? ` ຂໍ້ຄວາມ: ${error}` : " ຍັງບໍ່ພົບຕາຕະລາງ 'shop_settings' ແລະ ເມນູໃນຖານຂໍ້ມູນ."}
          </p>
        </div>

        {/* 3 Step Instructions */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-stone-500">
            ຂັ້ນຕອນການຕັ້ງຄ່າຖານຂໍ້ມູນ (3 ຂັ້ນຕອນງ່າຍໆ):
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2C1810] text-amber-300 font-black text-xs">
                1
              </span>
              <div className="leading-relaxed">
                <p className="font-bold text-stone-900">ເປີດ Supabase SQL Editor</p>
                <p className="text-stone-500 mt-0.5">
                  ເຂົ້າໄປທີ່ Dashboard ຂອງ Supabase ໂຄງການຂອງທ່ານ ແລ້ວໄປທີ່ເມນູ <strong>SQL Editor</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2C1810] text-amber-300 font-black text-xs">
                2
              </span>
              <div className="leading-relaxed">
                <p className="font-bold text-stone-900">Run ໄຟລ໌ Schema & Seed Data</p>
                <p className="text-stone-500 mt-0.5">
                  ເປີດໄຟລ໌ <code className="bg-stone-200/80 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">supabase/schema_cafe.sql</code> ທີ່ມີຢູ່ໃນໂຄງການ, ຄັດລອກເນື້ອໃນທັງໝົດໄປວາງໃສ່ SQL Editor ແລ້ວກົດປຸ່ມ <strong>Run</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2C1810] text-amber-300 font-black text-xs">
                3
              </span>
              <div className="leading-relaxed">
                <p className="font-bold text-stone-900">ກົດກວດສອບການເຊື່ອມຕໍ່ໃໝ່</p>
                <p className="text-stone-500 mt-0.5">
                  ຫຼັງຈາກ Run SQL ສຳເລັດແລ້ວ, ມາກົດປຸ່ມ <strong>&quot;ກວດສອບ &amp; ໂຫຼດເມນູໃໝ່&quot;</strong> ດ້ານລຸ່ມນີ້.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={handleCopySqlInstruction}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4 text-amber-700" />
            )}
            <span>{copied ? "ຄັດລອກແລ້ວ!" : "ເບິ່ງເສັ້ນທາງ supabase/schema_cafe.sql"}</span>
          </button>

          <button
            type="button"
            onClick={() => loadCatalog()}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-[#2C1810] px-6 py-3 text-xs sm:text-sm font-extrabold text-amber-300 shadow-md shadow-[#2C1810]/20 hover:bg-[#1A0D08] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-amber-300" : ""}`} />
            <span>{isLoading ? "ກຳລັງກວດສອບ..." : "ກວດສອບ & ໂຫຼດເມນູໃໝ່ (Reload DB)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

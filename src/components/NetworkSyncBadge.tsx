"use client";

// ============================================================================
// Network & Offline Sync Status Badge
// ============================================================================

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { syncEngine } from "@/apis/sync-engine";
import { lo } from "@/constants/locales/lo";

export function NetworkSyncBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state) => {
      setIsOnline(state.isOnline);
      setPendingCount(state.pendingCount);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    try {
      await syncEngine.processQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleManualSync}
        title={isOnline ? lo.app.onlineNotice : lo.app.offlineNotice}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
          isOnline
            ? "border-stone-200 bg-stone-100/90 text-stone-700 hover:bg-stone-200/70 shadow-2xs"
            : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 shadow-2xs"
        }`}
      >
        {isOnline ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        ) : (
          <WifiOff className="h-3 w-3 text-amber-600" />
        )}

        <span className="font-semibold text-[11px]">{isOnline ? "Online" : "Offline"}</span>

        {pendingCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-200/80 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
            <RefreshCw
              className={`h-2.5 w-2.5 ${isSyncing ? "animate-spin" : ""}`}
            />
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
}


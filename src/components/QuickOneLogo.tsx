"use client";

// ============================================================================
// BrewCraft Logo: Artisanal Specialty Coffee & Roastery Studio POS Logo
// Dark Espresso Brown (#2C1810) & Roasted Caramel Gold (#D97706)
// ============================================================================

import React from "react";

interface QuickOneLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  light?: boolean;
}

export function QuickOneLogo({
  className = "",
  size = "md",
  showText = true,
  light = false,
}: QuickOneLogoProps) {
  const sizeMap = {
    sm: { icon: 28, textH: 28 },
    md: { icon: 38, textH: 38 },
    lg: { icon: 52, textH: 48 },
    xl: { icon: 72, textH: 64 },
  };

  const dim = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Modern Artisanal Coffee Emblem: Craft Roaster Stamp & Golden Bean Drop */}
      <svg
        width={dim.icon}
        height={dim.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="brewDarkGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3E2014" />
            <stop offset="60%" stopColor="#24120B" />
            <stop offset="100%" stopColor="#150A06" />
          </linearGradient>

          <linearGradient id="goldCraftGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <linearGradient id="cremaDropGrad" x1="35" y1="25" x2="65" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Outer Squircle Badge with Golden Inset Ring */}
        <rect width="100" height="100" rx="26" fill="url(#brewDarkGrad)" />
        <rect x="5" y="5" width="90" height="90" rx="21" stroke="url(#goldCraftGrad)" strokeWidth="2" strokeOpacity="0.35" fill="none" />

        {/* Artisanal Coffee Cup Silhouette (Clean base - no bottom wire) */}
        <path
          d="M24 35C24 33.3 25.3 32 27 32H69C70.7 32 72 33.3 72 35V42C72 55 62 64 48 64C34 64 24 55 24 42V35Z"
          fill="url(#goldCraftGrad)"
          fillOpacity="0.15"
          stroke="url(#goldCraftGrad)"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Coffee Cup Handle */}
        <path
          d="M71 39C78 39 81.5 43.5 81.5 49C81.5 54.5 78 59 71 59"
          stroke="url(#goldCraftGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Artisanal Saucer Plate Base */}
        <path
          d="M22 69C31 72.5 65 72.5 74 69"
          stroke="url(#goldCraftGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Pure Golden Coffee Bean in the center of the cup */}
        <path
          d="M48 42C42.5 42 38.5 46 38.5 50.5C38.5 55 42.5 59 48 59C53.5 59 57.5 55 57.5 50.5C57.5 46 53.5 42 48 42Z"
          fill="url(#cremaDropGrad)"
        />
        {/* Curved S-cleft of coffee bean */}
        <path
          d="M47 43C45 47 51 50 49 58"
          stroke="#24120B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* 3 Craft Steam Arcs rising above */}
        <path
          d="M40 25C40 20 44 19 44 14"
          stroke="#FDE68A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
        <path
          d="M48 23C48 17 53 16 53 11"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M56 25C56 20 60 19 60 14"
          stroke="#FDE68A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
      </svg>

      {/* Typography: BrewCraft Roastery & Cafe */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline gap-1">
            <span
              className={`font-black tracking-tight ${
                light ? "text-white" : "text-[#2C1810]"
              }`}
              style={{ fontSize: dim.textH * 0.52 }}
            >
              Brew<span className="text-[#D97706]">Craft</span>
            </span>
          </div>
          <span
            className={`font-bold tracking-[0.22em] uppercase mt-0.5 ${
              light ? "text-amber-200/90" : "text-[#B45309]"
            }`}
            style={{ fontSize: dim.textH * 0.22 }}
          >
            Roastery & Cafe
          </span>
        </div>
      )}
    </div>
  );
}

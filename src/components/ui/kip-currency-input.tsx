"use client";

// ============================================================================
// KipCurrencyInput: Standard Lao Kip (LAK) Currency Input Component
// Real-time dot (.) thousand separator formatting, pure integer number output,
// 'k' shortcut (*1,000), mobile numeric keyboard, right-aligned '₭' suffix.
// ============================================================================

import React, { forwardRef, useState } from "react";
import { cn } from "cn";

export interface KipCurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  /**
   * Numeric value in Lao Kip (always integer)
   */
  value: number;

  /**
   * Primary callback when the numeric value changes
   */
  onValueChange?: (val: number) => void;

  /**
   * Backward-compatible alias for onValueChange
   */
  onChange?: (val: number) => void;

  /**
   * Currency suffix displayed inside the input (default: '₭')
   */
  suffix?: string;

  /**
   * Whether to show the currency suffix
   */
  showSuffix?: boolean;

  /**
   * Additional class name for outer wrapper
   */
  containerClassName?: string;

  /**
   * Optional custom styling for the suffix badge
   */
  suffixClassName?: string;
}

/**
 * Formats integer to Lao Kip string with dot (.) thousand separators
 * e.g. 15000 -> "15.000"
 */
export function formatKipDots(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return "0";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export const KipCurrencyInput = forwardRef<
  HTMLInputElement,
  KipCurrencyInputProps
>(
  (
    {
      value,
      onValueChange,
      onChange,
      suffix = "₭",
      showSuffix = true,
      containerClassName = "",
      suffixClassName = "",
      className = "",
      placeholder = "0",
      disabled = false,
      onKeyDown,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const safeValue =
      typeof value === "number" && !isNaN(value)
        ? Math.max(0, Math.round(value))
        : 0;

    // Notify parent with pure integer number
    const triggerChange = (newVal: number) => {
      const sanitized = Math.max(0, Math.round(newVal));
      if (onValueChange) {
        onValueChange(sanitized);
      }
      if (onChange) {
        onChange(sanitized);
      }
    };

    // Calculate display text: show '0' when unfocused and 0, empty with placeholder '0' when focused
    const displayValue =
      safeValue === 0 ? (isFocused ? "" : "0") : formatKipDots(safeValue);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawText = e.target.value;

      // 1. Shortcut: If user types 'k' or 'K' (e.g. "15k" -> 15.000, "25.000k" -> 25.000.000)
      const kMatch = rawText.match(/^([0-9.]+)\s*k$/i);
      if (kMatch) {
        const cleanNum = kMatch[1].replace(/\./g, "");
        const base = cleanNum ? parseInt(cleanNum, 10) : 0;
        triggerChange(base * 1000);
        return;
      }

      // 2. Extract digits only
      const digits = rawText.replace(/\D/g, "");
      if (!digits) {
        triggerChange(0);
        return;
      }

      // 3. Strip leading zeros to avoid "05" -> "5"
      const cleanDigits = digits.replace(/^0+(?=\d)/, "");
      const parsed = parseInt(cleanDigits, 10) || 0;
      triggerChange(parsed);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Shortcut 'k' or 'K' -> multiply current value by 1,000
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        if (safeValue > 0) {
          triggerChange(safeValue * 1000);
        }
        return;
      }

      onKeyDown?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Automatically select all text on focus for effortless re-typing
      e.target.select();
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div
        className={cn(
          "relative flex items-center w-full group",
          containerClassName
        )}
      >
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-900 outline-none transition-all tabular-nums",
            "focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20",
            "disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400",
            showSuffix && "pr-7",
            className
          )}
          {...props}
        />
        {showSuffix && (
          <span
            className={cn(
              "pointer-events-none absolute right-2.5 select-none text-xs font-black text-stone-400 group-focus-within:text-amber-600 transition-colors",
              suffixClassName
            )}
          >
            {suffix}
          </span>
        )}
      </div>
    );
  }
);

KipCurrencyInput.displayName = "KipCurrencyInput";
export default KipCurrencyInput;


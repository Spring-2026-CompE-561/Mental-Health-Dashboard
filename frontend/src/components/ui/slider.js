"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Slider = forwardRef(function Slider(
  { className, min = 1, max = 10, step = 1, value, onValueChange, disabled, ...props },
  ref
) {
  const fillPercent = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("relative w-full h-[40px] flex items-center", className)} ref={ref} {...props}>
      <div
        className="absolute w-full h-[12px] rounded-full"
        style={{ backgroundColor: "var(--input-bg)" }}
      />
      <div
        className="absolute h-[12px] bg-[#b2def9] rounded-full pointer-events-none transition-all"
        style={{ width: `${fillPercent}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="absolute w-full h-[40px] opacity-0 cursor-pointer appearance-none"
        disabled={disabled}
      />
      <div
        className="absolute w-[32px] h-[32px] border-4 border-[#b2def9] rounded-full shadow-md pointer-events-none transition-all"
        style={{
          left: `calc(${fillPercent}% - 16px)`,
          backgroundColor: "var(--card-bg)",
        }}
      />
    </div>
  );
});
Slider.displayName = "Slider";

export { Slider };

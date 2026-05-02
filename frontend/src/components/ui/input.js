import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef(function Input({ className, type, ...props }, ref) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-[56px] w-full rounded-2xl px-5 text-[15px] transition-all focus:outline-none focus:ring-4 focus:ring-[#b2def9]/10",
        className
      )}
      style={{
        backgroundColor: "var(--input-bg)",
        border: "1px solid var(--border-color)",
        color: "var(--body-color)",
      }}
      ref={ref}
      onFocus={(e) => {
        e.target.style.borderColor = "#b2def9";
        e.target.style.backgroundColor = "var(--input-focus-bg)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--border-color)";
        e.target.style.backgroundColor = "var(--input-bg)";
      }}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };

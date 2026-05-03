import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(function Label(
  { className, ...props },
  ref
) {
  return (
    <label
      ref={ref}
      className={cn(
        "font-semibold text-[14px] ml-1 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      style={{ color: "var(--secondary-color)" }}
      {...props}
    />
  );
});
Label.displayName = "Label";

export { Label };

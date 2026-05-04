import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, style, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("rounded-[32px] shadow-sm relative overflow-hidden", className)}
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-light)",
        transition: "background-color 0.3s, border-color 0.3s",
        ...style,
      }}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader(
  { className, ...props },
  ref
) {
  return <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
});
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function CardTitle(
  { className, ...props },
  ref
) {
  return (
    <h3
      ref={ref}
      className={cn("font-semibold text-[24px] tracking-tight leading-none", className)}
      style={{ color: "var(--heading-color)" }}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardContent(
  { className, ...props },
  ref
) {
  return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
});
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };

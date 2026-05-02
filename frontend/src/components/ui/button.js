import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer border-none",
  {
    variants: {
      variant: {
        default: "bg-[#b2def9] text-white shadow-[0px_8px_24px_rgba(178,222,249,0.4)] hover:opacity-90",
        pink: "bg-[#f9b2d7] text-white shadow-[0px_8px_24px_rgba(249,178,215,0.4)] hover:opacity-90",
        outline: "border border-solid bg-transparent hover:opacity-80",
        ghost: "bg-transparent hover:opacity-80",
      },
      size: {
        default: "h-[56px] px-8 text-[18px]",
        sm: "h-[40px] px-4 text-[14px] rounded-xl",
        lg: "h-[64px] px-12 text-[22px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = forwardRef(function Button({ className, variant, size, asChild = false, ...props }, ref) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[2px] border px-2.5 py-0.5 text-[11px] uppercase tracking-wide font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:outline-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-[#EDE8DC] border-[#D4C9B0] text-[#6B5744]",
        secondary: "bg-[#FAF7F2] border-[#D4C9B0] text-[#6B5744]",
        destructive: "bg-[rgba(196,30,58,0.08)] border-[rgba(196,30,58,0.3)] text-[#C41E3A]",
        outline: "border-[#D4C9B0] text-[#6B5744] bg-transparent",
        success: "bg-[rgba(74,124,89,0.08)] border-[rgba(74,124,89,0.3)] text-[#2D5A3D]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

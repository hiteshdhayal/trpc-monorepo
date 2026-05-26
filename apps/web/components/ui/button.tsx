import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[3px] text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive hover:-translate-y-[1px] disabled:hover:translate-y-0",
  {
    variants: {
      variant: {
        default: "bg-[#C41E3A] text-[#FAF7F2] hover:bg-[#8B1A2A] border-none shadow-none font-medium",
        destructive:
          "bg-[#8B1A2A] text-[#FAF7F2] hover:bg-[#8B1A2A]/90 focus-visible:ring-destructive/20 border-none shadow-none font-medium",
        outline:
          "border-[1.5px] border-[#C41E3A] bg-transparent text-[#C41E3A] hover:bg-[rgba(196,30,58,0.08)] shadow-none font-medium",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium",
        ghost:
          "text-[#6B5744] hover:text-[#C41E3A] hover:bg-transparent bg-transparent shadow-none border-none font-medium hover:translate-y-0",
        link: "text-[#C41E3A] underline-offset-4 hover:underline border-none bg-transparent hover:translate-y-0",
      },
      size: {
        default: "h-10 px-6 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-[3px] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-[3px] px-8 has-[>svg]:px-6",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

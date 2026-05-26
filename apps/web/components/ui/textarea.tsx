import * as React from "react"

import { cn } from "~/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full bg-[#FAF7F2] border border-[#D4C9B0] rounded-[3px] p-[10px_14px] text-sm text-[#1A1008] transition-all outline-none min-h-16 placeholder:text-[#A89880] focus-visible:outline-none focus-visible:border-[#C41E3A] focus-visible:ring-[3px] focus-visible:ring-[#C41E3A]/10 aria-invalid:border-[#C41E3A] aria-invalid:bg-[rgba(196,30,58,0.04)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

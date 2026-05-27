import * as React from "react";

import { cn } from "~/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full bg-[#FAF7F2] border border-[#D4C9B0] rounded-[3px] p-[10px_14px] text-sm text-[#1A1008] transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 h-auto placeholder:text-[#A89880] focus-visible:outline-none focus-visible:border-[#C41E3A] focus-visible:ring-[3px] focus-visible:ring-[#C41E3A]/10 aria-invalid:border-[#C41E3A] aria-invalid:bg-[rgba(196,30,58,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

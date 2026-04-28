import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-ui rounded-[var(--radius-pill)]",
    "transition-[background-color,box-shadow,color] duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:shadow-focus",
    "aria-invalid:shadow-[0_0_0_2px_color-mix(in_oklab,var(--danger)_45%,transparent)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--ink)] text-[color:var(--primary-fg)] shadow-card hover:brightness-110",
        destructive:
          "bg-transparent text-[color:var(--danger)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--danger)_30%,transparent)] hover:bg-[color:var(--danger-soft)]",
        outline:
          "bg-transparent text-foreground shadow-outline-ring hover:bg-[color:var(--surface-muted)]/60",
        secondary:
          "bg-[color:var(--surface)] text-foreground shadow-card hover:bg-[color:var(--surface-muted)]/40",
        ghost:
          "bg-transparent text-foreground hover:bg-[color:var(--surface-muted)]/60",
        link:
          "text-[color:var(--primary)] underline-offset-4 hover:underline rounded-none shadow-none",
        featured: [
          "bg-[color:var(--surface-stone)] text-foreground",
          "rounded-[30px] shadow-warm-lift shadow-outline-ring",
          "hover:bg-[color:var(--surface-muted)]",
        ].join(" "),
        knowledge:
          "bg-transparent text-[color:var(--knowledge)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--knowledge)_25%,transparent)] hover:bg-[color:var(--knowledge-soft)]",
        primary:
          "bg-[color:var(--primary)] !text-[#ffffff] [&_svg]:!text-[#ffffff] shadow-card hover:brightness-110",
        "destructive-outline":
          "bg-transparent text-[color:var(--danger)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--danger)_25%,transparent)] hover:bg-[color:var(--danger-soft)] hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--danger)_40%,transparent)]",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-7 px-3 text-ui-sm gap-1.5",
        lg: "h-11 px-6",
        icon: "size-9 px-0",
        "icon-sm": "size-7 px-0",
        "icon-lg": "size-11 px-0",
      },
    },
    compoundVariants: [
      { variant: "featured", size: "default", class: "px-5 py-3 pl-[14px]" },
      { variant: "featured", size: "lg", class: "px-6 py-3.5 pl-4" },
    ],
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
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
// Created by Swapnil Bapat © 2026

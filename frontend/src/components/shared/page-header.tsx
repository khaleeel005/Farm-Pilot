"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PageHeaderProps {
  /** Small label above the title */
  eyebrow?: string
  /** Page title */
  title: string
  /** Page description */
  description?: string
  /** Action buttons or controls to display on the right */
  actions?: ReactNode
  /** Additional CSS classes */
  className?: string
}

export function PageHeader({
  eyebrow = "Operations",
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card/70 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-40 bg-gradient-to-l from-primary/10 to-transparent sm:block" />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
          {eyebrow}
        </p>
        <h2 className="display-heading mt-1 text-2xl leading-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="relative z-10 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

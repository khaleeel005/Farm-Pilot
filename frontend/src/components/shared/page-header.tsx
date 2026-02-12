"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PageHeaderProps {
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
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        className
      )}
    >
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

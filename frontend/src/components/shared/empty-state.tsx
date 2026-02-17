"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Package,
  Users,
  FileText,
  Home,
  ShoppingCart,
  Clipboard,
  DollarSign,
  type LucideIcon,
} from "lucide-react"

type EmptyStateVariant =
  | "default"
  | "feed"
  | "sales"
  | "customers"
  | "houses"
  | "workers"
  | "staff"
  | "reports"
  | "logs"
  | "costs"

interface EmptyStateProps {
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Icon variant or custom icon */
  variant?: EmptyStateVariant
  /** Custom icon component */
  icon?: LucideIcon
  /** Action button text */
  actionLabel?: string
  /** Action button callback */
  onAction?: () => void
  /** Whether the action is disabled */
  actionDisabled?: boolean
  /** Additional CSS classes */
  className?: string
}

const variantIcons: Record<EmptyStateVariant, LucideIcon> = {
  default: FileText,
  feed: Package,
  sales: ShoppingCart,
  customers: Users,
  houses: Home,
  workers: Users,
  staff: Users,
  reports: FileText,
  logs: Clipboard,
  costs: DollarSign,
}

const variantColors: Record<EmptyStateVariant, string> = {
  default: "text-muted-foreground",
  feed: "text-amber-500",
  sales: "text-green-500",
  customers: "text-blue-500",
  houses: "text-emerald-500",
  workers: "text-cyan-500",
  staff: "text-teal-500",
  reports: "text-indigo-500",
  logs: "text-orange-500",
  costs: "text-rose-500",
}

export function EmptyState({
  title,
  description,
  variant = "default",
  icon,
  actionLabel,
  onAction,
  actionDisabled = false,
  className,
}: EmptyStateProps) {
  const Icon = icon || variantIcons[variant]
  const iconColor = variantColors[variant]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/45 px-4 py-12 text-center",
        className
      )}
    >
      <div className={cn("mb-4 rounded-2xl bg-muted/70 p-4", iconColor)}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="display-heading mb-1 text-2xl text-foreground">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} disabled={actionDisabled} className="rounded-xl">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

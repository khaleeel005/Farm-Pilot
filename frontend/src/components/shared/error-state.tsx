"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, ShieldX } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type ErrorVariant = "default" | "network" | "server" | "forbidden" | "notFound"

interface ErrorStateProps {
  /** Error title */
  title?: string
  /** Error message or description */
  message?: string
  /** Error variant for different icon/styling */
  variant?: ErrorVariant
  /** Custom icon */
  icon?: LucideIcon
  /** Retry button callback */
  onRetry?: () => void
  /** Whether retry is in progress */
  retrying?: boolean
  /** Additional CSS classes */
  className?: string
}

const variantConfig: Record<
  ErrorVariant,
  { icon: LucideIcon; title: string; message: string; iconColor: string }
> = {
  default: {
    icon: AlertCircle,
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    iconColor: "text-destructive",
  },
  network: {
    icon: WifiOff,
    title: "Connection error",
    message: "Unable to connect. Please check your internet connection.",
    iconColor: "text-amber-500",
  },
  server: {
    icon: ServerCrash,
    title: "Server error",
    message: "The server encountered an error. Please try again later.",
    iconColor: "text-destructive",
  },
  forbidden: {
    icon: ShieldX,
    title: "Access denied",
    message: "You don't have permission to view this content.",
    iconColor: "text-amber-500",
  },
  notFound: {
    icon: AlertCircle,
    title: "Not found",
    message: "The requested resource could not be found.",
    iconColor: "text-muted-foreground",
  },
}

export function ErrorState({
  title,
  message,
  variant = "default",
  icon,
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  const config = variantConfig[variant]
  const Icon = icon || config.icon
  const displayTitle = title || config.title
  const displayMessage = message || config.message

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className={cn("rounded-full bg-muted p-4 mb-4", config.iconColor)}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{displayTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{displayMessage}</p>
      {onRetry && (
        <Button onClick={onRetry} disabled={retrying} variant="outline">
          <RefreshCw className={cn("h-4 w-4 mr-2", retrying && "animate-spin")} />
          {retrying ? "Retrying..." : "Try again"}
        </Button>
      )}
    </div>
  )
}

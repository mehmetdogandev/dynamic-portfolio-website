import * as React from "react"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react"

export type AdminBadgeVariant = "success" | "error" | "warning" | "info" | "pending"

export interface AdminBadgeProps extends Omit<BadgeProps, "variant"> {
  variant?: AdminBadgeVariant
  showIcon?: boolean
}

const variantConfig: Record<
  AdminBadgeVariant,
  { badgeVariant: BadgeProps["variant"]; icon?: React.ReactNode; className?: string }
> = {
  success: {
    badgeVariant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400 dark:bg-green-500/10",
  },
  error: {
    badgeVariant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  warning: {
    badgeVariant: "secondary",
    icon: <AlertCircle className="h-3 w-3" />,
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400 dark:bg-yellow-500/10",
  },
  info: {
    badgeVariant: "secondary",
    icon: <AlertCircle className="h-3 w-3" />,
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/10",
  },
  pending: {
    badgeVariant: "outline",
    icon: <Clock className="h-3 w-3" />,
  },
}

const AdminBadge = React.forwardRef<HTMLDivElement, AdminBadgeProps>(
  ({ variant = "info", showIcon = true, className, children, ...props }, ref) => {
    const config = variantConfig[variant]

    return (
      <Badge
        ref={ref}
        variant={config.badgeVariant}
        className={cn(
          "gap-1.5",
          config.className,
          className
        )}
        {...props}
      >
        {showIcon && config.icon && <span>{config.icon}</span>}
        {children}
      </Badge>
    )
  }
)
AdminBadge.displayName = "AdminBadge"

export { AdminBadge }

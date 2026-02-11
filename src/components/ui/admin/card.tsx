import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface AdminCardProps extends CardProps {
  title?: string
  description?: string
  footer?: React.ReactNode
  headerActions?: React.ReactNode
}

const AdminCard = React.forwardRef<HTMLDivElement, AdminCardProps>(
  ({ title, description, footer, headerActions, children, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        {(title || description || headerActions) && (
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
            </div>
          </CardHeader>
        )}
        {children && <CardContent>{children}</CardContent>}
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    )
  }
)
AdminCard.displayName = "AdminCard"

export { AdminCard }

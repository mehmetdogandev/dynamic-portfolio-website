import * as React from "react"
import { Pencil, Trash2, Save, Eye } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AdminButtonVariant = "edit" | "delete" | "update" | "view"

export interface AdminButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: AdminButtonVariant
}

const variantConfig: Record<
  AdminButtonVariant,
  { buttonVariant: ButtonProps["variant"]; icon: React.ReactNode }
> = {
  edit: {
    buttonVariant: "outline",
    icon: <Pencil className="h-4 w-4" />,
  },
  delete: {
    buttonVariant: "destructive",
    icon: <Trash2 className="h-4 w-4" />,
  },
  update: {
    buttonVariant: "default",
    icon: <Save className="h-4 w-4" />,
  },
  view: {
    buttonVariant: "ghost",
    icon: <Eye className="h-4 w-4" />,
  },
}

const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ variant = "edit", className, children, ...props }, ref) => {
    const config = variantConfig[variant]

    return (
      <Button
        ref={ref}
        variant={config.buttonVariant}
        className={cn("gap-2", className)}
        {...props}
      >
        {config.icon}
        {children}
      </Button>
    )
  }
)
AdminButton.displayName = "AdminButton"

export { AdminButton }

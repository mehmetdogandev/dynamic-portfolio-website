import { cn } from '@/lib/utils/index'

type ResponsiveTableShellProps = {
  children: React.ReactNode
  className?: string
  /** Applied to inner scroll area (e.g. `min-w-[640px]` on the table element). */
  minTableWidth?: string
}

export function ResponsiveTableShell({
  children,
  className,
  minTableWidth,
}: ResponsiveTableShellProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0 overflow-x-auto rounded-md border',
        className
      )}
    >
      <div
        className={cn(minTableWidth ? 'min-w-max' : 'w-full', minTableWidth)}
      >
        {children}
      </div>
    </div>
  )
}

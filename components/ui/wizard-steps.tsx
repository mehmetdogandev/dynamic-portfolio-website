'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WizardStep = {
  id: string
  label: string
  optional?: boolean
}

type WizardStepsProps = {
  steps: readonly WizardStep[]
  currentStepIndex: number
  className?: string
  onStepClick?: (index: number) => void
}

/**
 * Horizontal stepper indicator. Displays past steps as completed (check icon),
 * the current step as highlighted, and future steps as muted.
 */
export function WizardSteps({
  steps,
  currentStepIndex,
  className,
  onStepClick,
}: WizardStepsProps) {
  return (
    <ol
      role="list"
      className={cn(
        'flex w-full flex-wrap items-start gap-x-2 gap-y-3 sm:flex-nowrap',
        className
      )}
    >
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex
        const isCompleted = index < currentStepIndex
        const isClickable = Boolean(onStepClick && index <= currentStepIndex)

        return (
          <li
            key={step.id}
            className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
          >
            <button
              type="button"
              onClick={isClickable ? () => onStepClick?.(index) : undefined}
              disabled={!isClickable}
              className={cn(
                'group flex flex-1 items-center gap-2 rounded-md p-1.5 text-left transition-colors',
                isClickable && 'hover:bg-muted/60',
                !isClickable && 'cursor-default'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  isCompleted &&
                    'border-primary bg-primary text-primary-foreground',
                  isActive && !isCompleted && 'border-primary text-primary',
                  !isActive &&
                    !isCompleted &&
                    'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </span>
              <span className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    'truncate text-sm font-medium',
                    isActive && 'text-foreground',
                    !isActive && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
                {step.optional ? (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    İsteğe bağlı
                  </span>
                ) : null}
              </span>
            </button>
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  'hidden h-px flex-1 sm:block',
                  index < currentStepIndex
                    ? 'bg-primary/60'
                    : 'bg-muted-foreground/20'
                )}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

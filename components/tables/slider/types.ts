import type { RouterOutputs } from '@/lib/trpc/types'

export type AdminSliderGroupRow =
  RouterOutputs['slider']['listGroups']['data'][number]
export type AdminSliderSlideRow = AdminSliderGroupRow['slides'][number]

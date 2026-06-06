import type { VisibilityState } from '@tanstack/react-table'

/** Admin sidebar + main padding (approx.) subtracted from viewport width. */
const LAYOUT_CHROME_PX = 320

/** Responsive defaults for the Japon customer list (no horizontal scroll). */
export function buildResponsiveCustomerColumnVisibility(
  viewportWidth: number
): VisibilityState {
  const contentWidth = Math.max(0, viewportWidth - LAYOUT_CHROME_PX)

  const core: VisibilityState = {
    fullName: true,
    serviceStatus: true,
    actions: true,
  }

  if (contentWidth >= 1500) {
    return {
      ...core,
      vehicleType: true,
      plate: true,
      phone: true,
      address: true,
      carCount: true,
      jobCount: true,
      lastVisitAt: true,
      createdAt: true,
    }
  }

  if (contentWidth >= 1100) {
    return {
      ...core,
      vehicleType: true,
      plate: true,
      phone: true,
      lastVisitAt: true,
      jobCount: true,
    }
  }

  if (contentWidth >= 880) {
    return {
      ...core,
      vehicleType: true,
      plate: true,
      phone: true,
    }
  }

  if (contentWidth >= 640) {
    return {
      ...core,
      phone: true,
    }
  }

  return core
}

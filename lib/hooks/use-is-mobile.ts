import { useMobileContext } from './use-is-mobile-context'

/**
 * Hook to get mobile detection state from the MobileContext
 * @returns Object containing mobile, tablet, desktop states and dimensions
 */
export function useIsMobile() {
  return useMobileContext()
}

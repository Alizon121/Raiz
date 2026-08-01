// Single choke point deciding whether banners should render. Always true
// for now — once the $0.99/mo ad-removal tier has real purchase/entitlement
// state wired in, that check replaces the `true` below and every AdBanner
// call site picks it up automatically.
export function useAdsEnabled(): boolean {
  return true;
}

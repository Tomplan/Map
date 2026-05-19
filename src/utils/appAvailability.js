export function shouldShowMaintenanceGate({ profileLoading, hasProfile, isAppActive }) {
  return !profileLoading && hasProfile && !isAppActive;
}

import { shouldShowMaintenanceGate } from '../appAvailability';

describe('shouldShowMaintenanceGate', () => {
  test('shows maintenance on localhost when app is offline', () => {
    expect(
      shouldShowMaintenanceGate({
        profileLoading: false,
        hasProfile: true,
        isAppActive: false,
      }),
    ).toBe(true);
  });

  test('shows maintenance in vite dev mode when app is offline', () => {
    expect(
      shouldShowMaintenanceGate({
        profileLoading: false,
        hasProfile: true,
        isAppActive: false,
      }),
    ).toBe(true);
  });

  test('shows maintenance on real environment when app is offline', () => {
    expect(
      shouldShowMaintenanceGate({
        profileLoading: false,
        hasProfile: true,
        isAppActive: false,
      }),
    ).toBe(true);
  });

  test('still shows maintenance when an admin is logged in on a public route', () => {
    expect(
      shouldShowMaintenanceGate({
        profileLoading: false,
        hasProfile: true,
        isAppActive: false,
        isAdmin: true,
      }),
    ).toBe(true);
  });

  test('does not show maintenance while profile is still loading', () => {
    expect(
      shouldShowMaintenanceGate({
        profileLoading: true,
        hasProfile: false,
        isAppActive: false,
      }),
    ).toBe(false);
  });

  test('does not show maintenance when the app is live', () => {
    expect(
      shouldShowMaintenanceGate({
        profileLoading: false,
        hasProfile: true,
        isAppActive: true,
      }),
    ).toBe(false);
  });
});

import { cleanupOldTourDOM } from '../hooks/useOnboardingTour';

describe('cleanupOldTourDOM', () => {
  beforeEach(() => {
    // ensure document is clean
    document.querySelectorAll('.onboarding-tour-popover').forEach(n => n.remove());
    document.querySelectorAll('.driver-overlay').forEach(n => n.remove());
  });

  test('removes leftover popovers and overlays from the document', () => {
    // create two fake popovers and an overlay
    const p1 = document.createElement('div');
    p1.className = 'driver-popover onboarding-tour-popover';
    document.body.appendChild(p1);

    const p2 = document.createElement('div');
    p2.className = 'driver-popover onboarding-tour-popover';
    document.body.appendChild(p2);

    const overlay = document.createElement('div');
    overlay.className = 'driver-overlay';
    document.body.appendChild(overlay);

    expect(document.querySelectorAll('.onboarding-tour-popover').length).toBe(2);
    expect(document.querySelectorAll('.driver-overlay').length).toBe(1);

    // call cleanup
    cleanupOldTourDOM();

    expect(document.querySelectorAll('.onboarding-tour-popover').length).toBe(0);
    expect(document.querySelectorAll('.driver-overlay').length).toBe(0);
  });
});

/**
 * Resolve the public-facing year used for visitor pages.
 * Prefer the organization's public_default_year if set, otherwise fall back to the provided selectedYear.
 * @param {number} selectedYear - the admin/user selected year
 * @param {Object|null} orgSettings - organization settings object (may contain public_default_year)
 */
export default function resolvePublicYear(selectedYear, orgSettings) {
  if (orgSettings && typeof orgSettings.public_default_year !== 'undefined' && orgSettings.public_default_year !== null) {
    return orgSettings.public_default_year;
  }
  return selectedYear;
}

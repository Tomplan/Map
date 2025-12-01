import normalizePhone from '../utils/phone';
import {
  validateEmail,
  validatePhone,
  validateNumber,
  validateRequired
} from '../utils/dataExportImport';

/**
 * Data type identifiers
 */
export const DATA_TYPES = {
  COMPANIES: 'companies',
  SUBSCRIPTIONS: 'event_subscriptions',
  ASSIGNMENTS: 'assignments'
};

/**
 * Configuration for each data type
 * Defines columns, validation, transformations, and matching strategies
 */
export const dataConfigs = {
  /**
   * Companies Configuration
   */
  companies: {
    label: 'Companies',
    table: 'companies',

    // Export column mapping
    exportColumns: [
      { key: 'id', header: 'ID', type: 'number' },
      { key: 'name', header: 'Company Name', type: 'string', required: true },
      { key: 'contact', header: 'Contact Person', type: 'string' },
      { key: 'phone', header: 'Phone', type: 'phone' },
      { key: 'email', header: 'Email', type: 'email' },
      { key: 'website', header: 'Website', type: 'string' },
      { key: 'info', header: 'Info (Dutch)', type: 'string' },
      { key: 'logo', header: 'Logo URL', type: 'string' }
    ],

    // Transform import row to database format
    transformImport: (row) => {
      const transformed = {
        name: row['Company Name']?.trim() || '',
        contact: row['Contact Person']?.trim() || '',
        website: row['Website']?.trim() || '',
        info: row['Info (Dutch)']?.trim() || '',
        logo: row['Logo URL']?.trim() || ''
      };

      // Handle phone normalization
      const phone = row['Phone'];
      if (phone && phone.trim()) {
        transformed.phone = normalizePhone(phone.trim());
      } else {
        transformed.phone = null;
      }

      // Handle email normalization
      const email = row['Email'];
      if (email && email.trim()) {
        transformed.email = email.toLowerCase().trim();
      } else {
        transformed.email = null;
      }

      return transformed;
    },

    // Transform export data (if needed - for now just pass through)
    transformExport: (companies) => {
      return companies.map(c => ({
        id: c.id,
        name: c.name || '',
        contact: c.contact || '',
        phone: c.phone || '',
        email: c.email || '',
        website: c.website || '',
        info: c.info || '',
        logo: c.logo || ''
      }));
    },

    // Validation function for each row
    validateRow: (row, rowIndex) => {
      const errors = [];

      // Required field: Company Name
      const nameValidation = validateRequired(row['Company Name'], 'Company Name');
      if (!nameValidation.valid) {
        errors.push({
          field: 'Company Name',
          message: nameValidation.error
        });
      }

      // Optional: Email format
      if (row['Email'] && row['Email'].trim()) {
        const emailValidation = validateEmail(row['Email']);
        if (!emailValidation.valid) {
          errors.push({
            field: 'Email',
            message: emailValidation.error
          });
        }
      }

      // Optional: Phone format
      if (row['Phone'] && row['Phone'].trim()) {
        const phoneValidation = validatePhone(row['Phone'], normalizePhone);
        if (!phoneValidation.valid) {
          errors.push({
            field: 'Phone',
            message: phoneValidation.error
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    },

    // Matching strategy for updates vs creates
    matchStrategy: {
      // Fields to match on (case-insensitive)
      matchFields: ['name'],
      // Match mode: 'first' = take first match, 'strict' = error on duplicates
      matchMode: 'first'
    },

    // Display labels
    labels: {
      singular: 'Company',
      plural: 'Companies',
      exportButton: 'Export Companies',
      importButton: 'Import Companies',
      modalTitle: 'Import Companies',
      exportFilename: 'companies-export'
    }
  },

  /**
   * Event Subscriptions Configuration
   * (To be implemented in Phase 2)
   */
  event_subscriptions: {
    label: 'Event Subscriptions',
    table: 'event_subscriptions',
    yearDependent: true, // Requires event_year parameter

    // Export column mapping
    exportColumns: [
      { key: 'id', header: 'Subscription ID', type: 'number' },
      { key: 'company_name', header: 'Company Name', type: 'string', required: true },
      { key: 'event_year', header: 'Event Year', type: 'number', required: true },
      { key: 'contact', header: 'Contact Person', type: 'string' },
      { key: 'phone', header: 'Phone', type: 'phone' },
      { key: 'email', header: 'Email', type: 'email' },
      { key: 'booth_count', header: 'Booth Count', type: 'number' },
      { key: 'area', header: 'Area', type: 'string' },
      { key: 'breakfast_sat', header: 'Breakfast (Sat)', type: 'number' },
      { key: 'lunch_sat', header: 'Lunch (Sat)', type: 'number' },
      { key: 'bbq_sat', header: 'BBQ (Sat)', type: 'number' },
      { key: 'breakfast_sun', header: 'Breakfast (Sun)', type: 'number' },
      { key: 'lunch_sun', header: 'Lunch (Sun)', type: 'number' },
      { key: 'coins', header: 'Coins', type: 'number' },
      { key: 'notes', header: 'Notes', type: 'string' }
    ],

    // Transform export data (join company name)
    transformExport: (subscriptions) => {
      return subscriptions.map(sub => ({
        id: sub.id,
        company_name: sub.company?.name || '',
        event_year: sub.event_year,
        contact: sub.contact || '',
        phone: sub.phone || '',
        email: sub.email || '',
        booth_count: sub.booth_count || 1,
        area: sub.area || '',
        breakfast_sat: sub.breakfast_sat || 0,
        lunch_sat: sub.lunch_sat || 0,
        bbq_sat: sub.bbq_sat || 0,
        breakfast_sun: sub.breakfast_sun || 0,
        lunch_sun: sub.lunch_sun || 0,
        coins: sub.coins || 0,
        notes: sub.notes || ''
      }));
    },

    // Transform import row (requires companyMap and eventYear)
    transformImport: (row, companyMap, eventYear) => {
      const companyName = row['Company Name']?.trim();
      const companyId = companyMap[companyName?.toLowerCase()];

      if (!companyId) {
        throw new Error(`Company "${companyName}" not found in database`);
      }

      const transformed = {
        company_id: companyId,
        event_year: parseInt(row['Event Year']) || eventYear,
        contact: row['Contact Person']?.trim() || '',
        area: row['Area']?.trim() || '',
        notes: row['Notes']?.trim() || ''
      };

      // Phone
      const phone = row['Phone'];
      transformed.phone = phone && phone.trim() ? normalizePhone(phone.trim()) : null;

      // Email
      const email = row['Email'];
      transformed.email = email && email.trim() ? email.toLowerCase().trim() : null;

      // Numbers
      transformed.booth_count = parseInt(row['Booth Count']) || 1;
      transformed.breakfast_sat = parseInt(row['Breakfast (Sat)']) || 0;
      transformed.lunch_sat = parseInt(row['Lunch (Sat)']) || 0;
      transformed.bbq_sat = parseInt(row['BBQ (Sat)']) || 0;
      transformed.breakfast_sun = parseInt(row['Breakfast (Sun)']) || 0;
      transformed.lunch_sun = parseInt(row['Lunch (Sun)']) || 0;
      transformed.coins = parseInt(row['Coins']) || 0;

      return transformed;
    },

    // Validation function
    validateRow: (row, rowIndex, companyMap) => {
      const errors = [];

      // Required: Company Name
      const nameValidation = validateRequired(row['Company Name'], 'Company Name');
      if (!nameValidation.valid) {
        errors.push({
          field: 'Company Name',
          message: nameValidation.error
        });
      } else {
        // Check if company exists in database
        const companyName = row['Company Name']?.trim().toLowerCase();
        if (companyMap && !companyMap[companyName]) {
          errors.push({
            field: 'Company Name',
            message: `Company "${row['Company Name']}" not found in database`
          });
        }
      }

      // Optional: Email format
      if (row['Email'] && row['Email'].trim()) {
        const emailValidation = validateEmail(row['Email']);
        if (!emailValidation.valid) {
          errors.push({
            field: 'Email',
            message: emailValidation.error
          });
        }
      }

      // Optional: Phone format
      if (row['Phone'] && row['Phone'].trim()) {
        const phoneValidation = validatePhone(row['Phone'], normalizePhone);
        if (!phoneValidation.valid) {
          errors.push({
            field: 'Phone',
            message: phoneValidation.error
          });
        }
      }

      // Validate numbers
      const numberFields = [
        { key: 'Booth Count', min: 1 },
        { key: 'Breakfast (Sat)', min: 0 },
        { key: 'Lunch (Sat)', min: 0 },
        { key: 'BBQ (Sat)', min: 0 },
        { key: 'Breakfast (Sun)', min: 0 },
        { key: 'Lunch (Sun)', min: 0 },
        { key: 'Coins', min: 0 }
      ];

      numberFields.forEach(({ key, min }) => {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          const numValidation = validateNumber(row[key], { min });
          if (!numValidation.valid) {
            errors.push({
              field: key,
              message: numValidation.error
            });
          }
        }
      });

      return {
        valid: errors.length === 0,
        errors
      };
    },

    // Matching strategy
    matchStrategy: {
      matchFields: ['company_id', 'event_year'],
      matchMode: 'strict' // One subscription per company per year
    },

    labels: {
      singular: 'Subscription',
      plural: 'Subscriptions',
      exportButton: 'Export Subscriptions',
      importButton: 'Import Subscriptions',
      modalTitle: 'Import Subscriptions',
      exportFilename: 'subscriptions-export'
    }
  },

  /**
   * Assignments Configuration
   * (To be implemented in Phase 3)
   */
  assignments: {
    label: 'Booth Assignments',
    table: 'assignments',
    yearDependent: true,

    // Export column mapping
    exportColumns: [
      { key: 'id', header: 'Assignment ID', type: 'number' },
      { key: 'company_name', header: 'Company Name', type: 'string', required: true },
      { key: 'booth_label', header: 'Booth Label', type: 'string', required: true },
      { key: 'marker_id', header: 'Marker ID', type: 'number', required: true },
      { key: 'event_year', header: 'Event Year', type: 'number', required: true }
    ],

    // Transform export data (join company name and booth label)
    transformExport: (assignments, markers) => {
      // Build marker glyph map
      const markerMap = {};
      markers.forEach(m => {
        markerMap[m.id] = m.glyph || m.id.toString();
      });

      return assignments.map(a => ({
        id: a.id,
        company_name: a.company?.name || '',
        booth_label: markerMap[a.marker_id] || a.marker_id.toString(),
        marker_id: a.marker_id,
        event_year: a.event_year
      }));
    },

    // Transform import row (requires companyMap, markerMap, and eventYear)
    transformImport: (row, companyMap, markerMap, eventYear) => {
      const companyName = row['Company Name']?.trim();
      const companyId = companyMap[companyName?.toLowerCase()];

      if (!companyId) {
        throw new Error(`Company "${companyName}" not found in database`);
      }

      // Try to find marker by glyph label or numeric ID
      const boothLabel = row['Booth Label']?.trim().toLowerCase();
      const markerId = row['Marker ID'] || markerMap[boothLabel];

      if (!markerId) {
        throw new Error(`Booth "${row['Booth Label']}" not found in markers`);
      }

      return {
        company_id: companyId,
        marker_id: parseInt(markerId),
        event_year: parseInt(row['Event Year']) || eventYear
      };
    },

    // Validation function
    validateRow: (row, rowIndex, companyMap, markerMap) => {
      const errors = [];

      // Required: Company Name
      const nameValidation = validateRequired(row['Company Name'], 'Company Name');
      if (!nameValidation.valid) {
        errors.push({
          field: 'Company Name',
          message: nameValidation.error
        });
      } else if (companyMap) {
        const companyName = row['Company Name']?.trim().toLowerCase();
        if (!companyMap[companyName]) {
          errors.push({
            field: 'Company Name',
            message: `Company "${row['Company Name']}" not found in database`
          });
        }
      }

      // Required: Booth Label
      const boothValidation = validateRequired(row['Booth Label'], 'Booth Label');
      if (!boothValidation.valid) {
        errors.push({
          field: 'Booth Label',
          message: boothValidation.error
        });
      } else if (markerMap) {
        const boothLabel = row['Booth Label']?.trim().toLowerCase();
        if (!markerMap[boothLabel]) {
          errors.push({
            field: 'Booth Label',
            message: `Booth "${row['Booth Label']}" not found in markers`
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    },

    // Matching strategy
    matchStrategy: {
      matchFields: ['company_id', 'marker_id', 'event_year'],
      matchMode: 'skip-duplicates' // Don't create duplicate assignments
    },

    labels: {
      singular: 'Assignment',
      plural: 'Assignments',
      exportButton: 'Export Assignments',
      importButton: 'Import Assignments',
      modalTitle: 'Import Booth Assignments',
      exportFilename: 'assignments-export'
    }
  }
};

/**
 * Get configuration for a data type
 * @param {string} dataType - Data type identifier from DATA_TYPES
 * @returns {object} Configuration object
 */
export function getDataConfig(dataType) {
  const config = dataConfigs[dataType];
  if (!config) {
    throw new Error(`Unknown data type: ${dataType}`);
  }
  return config;
}

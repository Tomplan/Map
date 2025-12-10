import normalizePhone from '../utils/phone';
import {
  validateEmail,
  validatePhone,
  validateNumber,
  validateRequired,
} from '../utils/dataExportImport';

/**
 * Data type identifiers
 */
export const DATA_TYPES = {
  COMPANIES: 'companies',
  SUBSCRIPTIONS: 'event_subscriptions',
  ASSIGNMENTS: 'assignments',
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
      { key: 'categories', header: 'Categories', type: 'string' },
      { key: 'contact', header: 'Contact Person', type: 'string' },
      { key: 'phone', header: 'Phone', type: 'phone' },
      { key: 'email', header: 'Email', type: 'email' },
      { key: 'website', header: 'Website', type: 'string' },
      { key: 'info_nl', header: 'Info (Nederlands)', type: 'string', wrapText: true },
      { key: 'info_en', header: 'Info (English)', type: 'string', wrapText: true },
      { key: 'info_de', header: 'Info (Deutsch)', type: 'string', wrapText: true },
      { key: 'logo', header: 'Logo URL', type: 'string' },
    ],

    // Transform import row to database format
    transformImport: (row) => {
      const transformed = {
        name: row['Company Name']?.trim() || '',
        contact: row['Contact Person']?.trim() || '',
        website: row['Website']?.trim() || '',
        logo: row['Logo URL']?.trim() || '',
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

      // Extract translation data (stored separately for import handler to use)
      const translations = {
        nl: row['Info (Nederlands)']?.trim() || '',
        en: row['Info (English)']?.trim() || '',
        de: row['Info (Deutsch)']?.trim() || '',
      };

      // Extract categories (comma-separated slugs)
      const categoriesStr = row['Categories']?.trim() || '';
      const categorySlugs = categoriesStr
        ? categoriesStr
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : [];

      // Attach translations and categories to company data for import handler to use
      transformed._translations = translations;
      transformed._categorySlugs = categorySlugs;

      return transformed;
    },

    // Transform export data - fetch and include all translations and categories
    transformExport: async (companies, additionalData) => {
      const { supabase } = additionalData || {};

      if (!supabase || companies.length === 0) {
        // Fallback if supabase not provided
        return companies.map((c) => ({
          id: c.id,
          name: c.name || '',
          categories: '',
          contact: c.contact || '',
          phone: c.phone || '',
          email: c.email || '',
          website: c.website || '',
          info_nl: c.info || '', // Legacy fallback
          info_en: '',
          info_de: '',
          logo: c.logo || '',
        }));
      }

      const companyIds = companies.map((c) => c.id);

      // Fetch all translations for all companies in one query
      const { data: translations, error: translationsError } = await supabase
        .from('company_translations')
        .select('company_id, language_code, info')
        .in('company_id', companyIds);

      if (translationsError) {
        console.error('Error fetching translations:', translationsError);
      }

      // Fetch all categories for all companies in one query
      const { data: companyCategories, error: categoriesError } = await supabase
        .from('company_categories')
        .select(
          `
          company_id,
          categories(slug)
        `,
        )
        .in('company_id', companyIds);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      }

      // Build a map of translations: { companyId: { nl: '...', en: '...', de: '...' } }
      const translationMap = {};
      if (translations) {
        translations.forEach((t) => {
          if (!translationMap[t.company_id]) {
            translationMap[t.company_id] = {};
          }
          translationMap[t.company_id][t.language_code] = t.info || '';
        });
      }

      // Build a map of categories: { companyId: ['slug1', 'slug2', ...] }
      const categoryMap = {};
      if (companyCategories) {
        companyCategories.forEach((cc) => {
          if (!categoryMap[cc.company_id]) {
            categoryMap[cc.company_id] = [];
          }
          if (cc.categories?.slug) {
            categoryMap[cc.company_id].push(cc.categories.slug);
          }
        });
      }

      // Map companies with translations and categories
      return companies.map((c) => {
        const companyTranslations = translationMap[c.id] || {};
        const companyCategorySlugs = categoryMap[c.id] || [];
        return {
          id: c.id,
          name: c.name || '',
          categories: companyCategorySlugs.join(', '), // Comma-separated slugs
          contact: c.contact || '',
          phone: c.phone || '',
          email: c.email || '',
          website: c.website || '',
          info_nl: companyTranslations.nl || c.info || '', // Fallback to legacy info
          info_en: companyTranslations.en || '',
          info_de: companyTranslations.de || '',
          logo: c.logo || '',
        };
      });
    },

    // Validation function for each row
    validateRow: (row, rowIndex) => {
      const errors = [];

      // Required field: Company Name
      const nameValidation = validateRequired(row['Company Name'], 'Company Name');
      if (!nameValidation.valid) {
        errors.push({
          field: 'Company Name',
          message: nameValidation.error,
        });
      }

      // Optional: Email format
      if (row['Email'] && row['Email'].trim()) {
        const emailValidation = validateEmail(row['Email']);
        if (!emailValidation.valid) {
          errors.push({
            field: 'Email',
            message: emailValidation.error,
          });
        }
      }

      // Optional: Phone format
      if (row['Phone'] && row['Phone'].trim()) {
        const phoneValidation = validatePhone(row['Phone'], normalizePhone);
        if (!phoneValidation.valid) {
          errors.push({
            field: 'Phone',
            message: phoneValidation.error,
          });
        }
      }

      // Validate category columns (per-category boolean columns)
      Object.keys(row).forEach((key) => {
        // Check if this is a category column (header contains category indicators)
        const isCategoryColumn =
          key.toLowerCase().includes('category') ||
          key.toLowerCase().includes('cat:') ||
          // Check if the key starts with category: pattern (for metadata)
          key.startsWith('category:');

        if (isCategoryColumn && row[key]) {
          const value = String(row[key]).trim().toUpperCase();
          const validCategoryValues = ['TRUE', 'FALSE', '+', '-', 'X', '✓', '1', '0', 'YES', 'NO'];

          if (!validCategoryValues.includes(value)) {
            errors.push({
              field: key,
              message: `Invalid category value "${row[key]}". Use +, -, TRUE, FALSE, X, or ✓`,
            });
          }
        }
      });

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    // Matching strategy for updates vs creates
    matchStrategy: {
      // Fields to match on (case-insensitive)
      matchFields: ['name'],
      // Match mode: 'first' = take first match, 'strict' = error on duplicates
      matchMode: 'first',
    },

    // Display labels
    labels: {
      singular: 'Company',
      plural: 'Companies',
      exportButton: 'Export Companies',
      importButton: 'Import Companies',
      modalTitle: 'Import Companies',
      exportFilename: 'companies-export',
    },
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
      { key: 'booth_labels', header: 'Booth Labels', type: 'string', wrapText: true },
      { key: 'area', header: 'Area', type: 'string', wrapText: true },
      { key: 'breakfast_sat', header: 'Breakfast (Sat)', type: 'number' },
      { key: 'lunch_sat', header: 'Lunch (Sat)', type: 'number' },
      { key: 'bbq_sat', header: 'BBQ (Sat)', type: 'number' },
      { key: 'breakfast_sun', header: 'Breakfast (Sun)', type: 'number' },
      { key: 'lunch_sun', header: 'Lunch (Sun)', type: 'number' },
      { key: 'coins', header: 'Coins', type: 'number' },
      { key: 'notes', header: 'Notes', type: 'string', wrapText: true },
    ],

    // Transform export data (join company name and booth labels)
    transformExport: async (subscriptions, additionalData) => {
      const { supabase, eventYear } = additionalData || {};

      // If no supabase or event year, return basic export
      if (!supabase || !eventYear) {
        return subscriptions.map((sub) => ({
          id: sub.id,
          company_name: sub.company?.name || '',
          event_year: sub.event_year,
          contact: sub.contact || '',
          phone: sub.phone || '',
          email: sub.email || '',
          booth_count: sub.booth_count || 1,
          booth_labels: '', // Empty without database access
          area: sub.area || '',
          breakfast_sat: sub.breakfast_sat || 0,
          lunch_sat: sub.lunch_sat || 0,
          bbq_sat: sub.bbq_sat || 0,
          breakfast_sun: sub.breakfast_sun || 0,
          lunch_sun: sub.lunch_sun || 0,
          coins: sub.coins || 0,
          notes: sub.notes || '',
        }));
      }

      try {
        // Fetch glyph text from markers_appearance (the actual booth labels)
        const { data: markerAppearances, error: appearanceError } = await supabase
          .from('markers_appearance')
          .select('id, glyph')
          .eq('event_year', eventYear);

        if (appearanceError) {
          console.error('Error fetching marker appearances:', appearanceError);
          // Return basic export without booth labels
          return subscriptions.map((sub) => ({
            id: sub.id,
            company_name: sub.company?.name || '',
            event_year: sub.event_year,
            contact: sub.contact || '',
            phone: sub.phone || '',
            email: sub.email || '',
            booth_count: sub.booth_count || 1,
            booth_labels: '',
            area: sub.area || '',
            breakfast_sat: sub.breakfast_sat || 0,
            lunch_sat: sub.lunch_sat || 0,
            bbq_sat: sub.bbq_sat || 0,
            breakfast_sun: sub.breakfast_sun || 0,
            lunch_sun: sub.lunch_sun || 0,
            coins: sub.coins || 0,
            notes: sub.notes || '',
          }));
        }

        // Build marker ID to glyph map from appearance data
        const markerGlyphMap = {};
        markerAppearances?.forEach((appearance) => {
          markerGlyphMap[appearance.id] = appearance.glyph || appearance.id.toString();
        });

        // Get company IDs to fetch their assignments
        const companyIds = subscriptions.map((s) => s.company_id).filter(Boolean);

        if (companyIds.length === 0) {
          // No companies to process, return basic export
          return subscriptions.map((sub) => ({
            id: sub.id,
            company_name: sub.company?.name || '',
            event_year: sub.event_year,
            contact: sub.contact || '',
            phone: sub.phone || '',
            email: sub.email || '',
            booth_count: sub.booth_count || 1,
            booth_labels: '',
            area: sub.area || '',
            breakfast_sat: sub.breakfast_sat || 0,
            lunch_sat: sub.lunch_sat || 0,
            bbq_sat: sub.bbq_sat || 0,
            breakfast_sun: sub.breakfast_sun || 0,
            lunch_sun: sub.lunch_sun || 0,
            coins: sub.coins || 0,
            notes: sub.notes || '',
          }));
        }

        // Fetch assignments for all companies in this year
        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select('company_id, marker_id')
          .eq('event_year', eventYear)
          .in('company_id', companyIds);

        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
          // Return basic export without booth labels
          return subscriptions.map((sub) => ({
            id: sub.id,
            company_name: sub.company?.name || '',
            event_year: sub.event_year,
            contact: sub.contact || '',
            phone: sub.phone || '',
            email: sub.email || '',
            booth_count: sub.booth_count || 1,
            booth_labels: '',
            area: sub.area || '',
            breakfast_sat: sub.breakfast_sat || 0,
            lunch_sat: sub.lunch_sat || 0,
            bbq_sat: sub.bbq_sat || 0,
            breakfast_sun: sub.breakfast_sun || 0,
            lunch_sun: sub.lunch_sun || 0,
            coins: sub.coins || 0,
            notes: sub.notes || '',
          }));
        }

        // Build company ID to booth labels map
        const companyBoothMap = {};
        assignments?.forEach((assignment) => {
          const glyph = markerGlyphMap[assignment.marker_id];
          if (glyph) {
            if (!companyBoothMap[assignment.company_id]) {
              companyBoothMap[assignment.company_id] = [];
            }
            companyBoothMap[assignment.company_id].push(glyph);
          }
        });

        // Sort booth labels for each company
        Object.keys(companyBoothMap).forEach((companyId) => {
          companyBoothMap[companyId].sort();
        });

        // Enhanced export with company details and assignment info
        return subscriptions.map((sub) => {
          const boothLabels = companyBoothMap[sub.company_id]?.join(', ') || '';

          return {
            id: sub.id,
            company_name: sub.company?.name || '',
            event_year: sub.event_year,
            contact: sub.contact || '',
            phone: sub.phone || '',
            email: sub.email || '',
            booth_count: sub.booth_count || 1,
            booth_labels: boothLabels, // Enhanced field with actual booth labels
            area: sub.area || '',
            breakfast_sat: sub.breakfast_sat || 0,
            lunch_sat: sub.lunch_sat || 0,
            bbq_sat: sub.bbq_sat || 0,
            breakfast_sun: sub.breakfast_sun || 0,
            lunch_sun: sub.lunch_sun || 0,
            coins: sub.coins || 0,
            notes: sub.notes || '',
          };
        });
      } catch (error) {
        console.error('Error in transformExport:', error);
        // Return basic export on any error
        return subscriptions.map((sub) => ({
          id: sub.id,
          company_name: sub.company?.name || '',
          event_year: sub.event_year,
          contact: sub.contact || '',
          phone: sub.phone || '',
          email: sub.email || '',
          booth_count: sub.booth_count || 1,
          booth_labels: '',
          area: sub.area || '',
          breakfast_sat: sub.breakfast_sat || 0,
          lunch_sat: sub.lunch_sat || 0,
          bbq_sat: sub.bbq_sat || 0,
          breakfast_sun: sub.breakfast_sun || 0,
          lunch_sun: sub.lunch_sun || 0,
          coins: sub.coins || 0,
          notes: sub.notes || '',
        }));
      }
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
        notes: row['Notes']?.trim() || '',
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

    // Validation function with comprehensive field validation
    validateRow: (row, rowIndex, companyMap) => {
      const errors = [];

      // Required: Company Name
      const nameValidation = validateRequired(row['Company Name'], 'Company Name');
      if (!nameValidation.valid) {
        errors.push({
          field: 'Company Name',
          message: nameValidation.error,
        });
      } else {
        // Check if company exists in database
        const companyName = row['Company Name']?.trim().toLowerCase();
        if (companyMap && !companyMap[companyName]) {
          errors.push({
            field: 'Company Name',
            message: `Company "${row['Company Name']}" not found in database`,
          });
        }
      }

      // Event year validation
      const eventYear = parseInt(row['Event Year']);
      if (row['Event Year'] && (isNaN(eventYear) || eventYear < 2020 || eventYear > 2100)) {
        errors.push({
          field: 'Event Year',
          message: 'Event Year must be a valid year between 2020-2100',
        });
      }

      // Booth count validation
      const boothCount = parseInt(row['Booth Count']);
      if (row['Booth Count'] && (isNaN(boothCount) || boothCount < 1)) {
        errors.push({
          field: 'Booth Count',
          message: 'Booth Count must be at least 1',
        });
      }

      // Meal count validation (0 or positive integers)
      const mealFields = [
        'Breakfast (Sat)',
        'Lunch (Sat)',
        'BBQ (Sat)',
        'Breakfast (Sun)',
        'Lunch (Sun)',
      ];
      mealFields.forEach((field) => {
        const value = parseInt(row[field]);
        if (row[field] && (isNaN(value) || value < 0)) {
          errors.push({
            field: field,
            message: `${field} must be 0 or a positive integer`,
          });
        }
      });

      // Coins validation
      const coins = parseInt(row['Coins']);
      if (row['Coins'] && (isNaN(coins) || coins < 0)) {
        errors.push({
          field: 'Coins',
          message: 'Coins must be 0 or a positive integer',
        });
      }

      // Optional: Email format validation
      if (row['Email'] && row['Email'].trim()) {
        const emailValidation = validateEmail(row['Email']);
        if (!emailValidation.valid) {
          errors.push({
            field: 'Email',
            message: emailValidation.error,
          });
        }
      }

      // Optional: Phone format validation
      if (row['Phone'] && row['Phone'].trim()) {
        const phoneValidation = validatePhone(row['Phone'], normalizePhone);
        if (!phoneValidation.valid) {
          errors.push({
            field: 'Phone',
            message: phoneValidation.error,
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    // Matching strategy
    matchStrategy: {
      matchFields: ['company_id', 'event_year'],
      matchMode: 'strict', // One subscription per company per year
    },

    labels: {
      singular: 'Subscription',
      plural: 'Subscriptions',
      exportButton: 'Export Subscriptions',
      importButton: 'Import Subscriptions',
      modalTitle: 'Import Subscriptions',
      exportFilename: 'subscriptions-export',
    },
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
      { key: 'event_year', header: 'Event Year', type: 'number', required: true },
    ],

    // Transform export data (join company name and booth label)
    transformExport: (assignments, markers) => {
      // Build marker glyph map
      const markerMap = {};
      markers.forEach((m) => {
        markerMap[m.id] = m.glyph || m.id.toString();
      });

      return assignments.map((a) => ({
        id: a.id,
        company_name: a.company?.name || '',
        booth_label: markerMap[a.marker_id] || a.marker_id.toString(),
        marker_id: a.marker_id,
        event_year: a.event_year,
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
        event_year: parseInt(row['Event Year']) || eventYear,
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
          message: nameValidation.error,
        });
      } else if (companyMap) {
        const companyName = row['Company Name']?.trim().toLowerCase();
        if (!companyMap[companyName]) {
          errors.push({
            field: 'Company Name',
            message: `Company "${row['Company Name']}" not found in database`,
          });
        }
      }

      // Required: Booth Label
      const boothValidation = validateRequired(row['Booth Label'], 'Booth Label');
      if (!boothValidation.valid) {
        errors.push({
          field: 'Booth Label',
          message: boothValidation.error,
        });
      } else if (markerMap) {
        const boothLabel = row['Booth Label']?.trim().toLowerCase();
        if (!markerMap[boothLabel]) {
          errors.push({
            field: 'Booth Label',
            message: `Booth "${row['Booth Label']}" not found in markers`,
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    // Matching strategy
    matchStrategy: {
      matchFields: ['company_id', 'marker_id', 'event_year'],
      matchMode: 'skip-duplicates', // Don't create duplicate assignments
    },

    labels: {
      singular: 'Assignment',
      plural: 'Assignments',
      exportButton: 'Export Assignments',
      importButton: 'Import Assignments',
      modalTitle: 'Import Booth Assignments',
      exportFilename: 'assignments-export',
    },
  },
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

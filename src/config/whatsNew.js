/**
 * What's New - Recent Changes
 * 
 * Informal change log for managers to see recent updates.
 * Add new items at the top of the array.
 * 
 * Format:
 * - date: Update date (YYYY-MM-DD)
 * - changes: Array of change descriptions
 * - type: 'feature' | 'fix' | 'improvement' (for styling)
 */

export const whatsNew = [
  {
    date: "2025-11-22",
    changes: [
      {
        text: "Program Management: Manage event schedule with database-driven activities",
        type: "feature"
      },
      {
        text: "Drag-to-reorder activities within Saturday/Sunday schedules",
        type: "feature"
      },
      {
        text: "Bilingual activity content (NL/EN) with exhibitor linking",
        type: "feature"
      },
      {
        text: "Optional location type badges for highlighting special activities",
        type: "feature"
      },
      {
        text: "Content Editor role added for program management access",
        type: "improvement"
      }
    ]
  },
  {
    date: "2025-11-21",
    changes: [
      {
        text: "Added in-app help system with contextual guidance",
        type: "feature"
      },
      {
        text: "New tooltips on complex controls for easier navigation",
        type: "feature"
      },
      {
        text: "Created versioning strategy document for future releases",
        type: "improvement"
      }
    ]
  },
  {
    date: "2025-11-15",
    changes: [
      {
        text: "Enhanced logo uploader with drag-and-drop support",
        type: "feature"
      },
      {
        text: "Improved import validation with better error messages",
        type: "improvement"
      },
      {
        text: "Fixed CSV import encoding issues",
        type: "fix"
      }
    ]
  },
  {
    date: "2025-11-10",
    changes: [
      {
        text: "Added event subscriptions management tab",
        type: "feature"
      },
      {
        text: "New assignments tab for linking companies to map locations",
        type: "feature"
      },
      {
        text: "Improved marker drag performance on map",
        type: "improvement"
      }
    ]
  },
  {
    date: "2025-11-05",
    changes: [
      {
        text: "Map marker rotation with interactive handles",
        type: "feature"
      },
      {
        text: "Role-based navigation (Super Admin, System Manager, Event Manager)",
        type: "feature"
      },
      {
        text: "Fixed marker popup display on mobile devices",
        type: "fix"
      }
    ]
  },
  {
    date: "2025-11-01",
    changes: [
      {
        text: "Initial admin dashboard launch",
        type: "feature"
      },
      {
        text: "Companies management with CRUD operations",
        type: "feature"
      },
      {
        text: "Year selector for multi-year event management",
        type: "feature"
      }
    ]
  }
  // Add new items above this line
];

/**
 * Get recent changes (last N items)
 * @param {number} limit - Number of recent items to return
 * @returns {array} Array of recent change objects
 */
export function getRecentChanges(limit = 5) {
  return whatsNew.slice(0, limit);
}

/**
 * Get all changes as flat list
 * @returns {array} Flat array of all changes with dates
 */
export function getAllChanges() {
  return whatsNew.flatMap(item => 
    item.changes.map(change => ({
      ...change,
      date: item.date
    }))
  );
}

/**
 * Get changes by type
 * @param {string} type - Change type ('feature', 'fix', 'improvement')
 * @returns {array} Filtered changes
 */
export function getChangesByType(type) {
  return getAllChanges().filter(change => change.type === type);
}

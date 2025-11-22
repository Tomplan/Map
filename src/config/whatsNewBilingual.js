/**
 * What's New - Recent Changes (Bilingual EN/NL)
 * 
 * Informal change log for managers to see recent updates.
 * Add new items at the top of the array.
 * 
 * Format:
 * - date: Update date (YYYY-MM-DD)
 * - changes: Array of change descriptions with bilingual text
 * - type: 'feature' | 'fix' | 'improvement' (for styling)
 */

export const whatsNewBilingual = [
  {
    date: "2025-11-22",
    changes: [
      {
        text: {
          en: "Program Management: Manage event schedule with database-driven activities",
          nl: "Programma Beheer: Beheer event schema met database-gedreven activiteiten"
        },
        type: "feature"
      },
      {
        text: {
          en: "Drag-to-reorder activities within Saturday/Sunday schedules",
          nl: "Sleep-om-te-herschikken activiteiten binnen zaterdag/zondag schema's"
        },
        type: "feature"
      },
      {
        text: {
          en: "Bilingual activity content (NL/EN) with exhibitor linking",
          nl: "Tweetalige activiteit content (NL/EN) met standhouder koppeling"
        },
        type: "feature"
      },
      {
        text: {
          en: "Optional location type badges for highlighting special activities",
          nl: "Optionele locatietype badges voor het benadrukken van speciale activiteiten"
        },
        type: "feature"
      },
      {
        text: {
          en: "Content Editor role added for program management access",
          nl: "Content Editor rol toegevoegd voor programma beheer toegang"
        },
        type: "improvement"
      },
      {
        text: {
          en: "Complete help system now available in English and Dutch",
          nl: "Compleet helpsysteem nu beschikbaar in Engels en Nederlands"
        },
        type: "improvement"
      }
    ]
  },
  {
    date: "2025-11-21",
    changes: [
      {
        text: {
          en: "Added in-app help system with contextual guidance",
          nl: "In-app helpsysteem toegevoegd met contextuele begeleiding"
        },
        type: "feature"
      },
      {
        text: {
          en: "New tooltips on complex controls for easier navigation",
          nl: "Nieuwe tooltips op complexe bedieningselementen voor eenvoudigere navigatie"
        },
        type: "feature"
      },
      {
        text: {
          en: "Created versioning strategy document for future releases",
          nl: "Versiebeheerstrategie document gemaakt voor toekomstige releases"
        },
        type: "improvement"
      }
    ]
  },
  {
    date: "2025-11-15",
    changes: [
      {
        text: {
          en: "Enhanced logo uploader with drag-and-drop support",
          nl: "Verbeterde logo uploader met drag-and-drop ondersteuning"
        },
        type: "feature"
      },
      {
        text: {
          en: "Improved import validation with better error messages",
          nl: "Verbeterde import validatie met betere foutmeldingen"
        },
        type: "improvement"
      },
      {
        text: {
          en: "Fixed CSV import encoding issues",
          nl: "CSV import encoding problemen opgelost"
        },
        type: "fix"
      }
    ]
  },
  {
    date: "2025-11-10",
    changes: [
      {
        text: {
          en: "Added event subscriptions management tab",
          nl: "Event inschrijvingen beheer tab toegevoegd"
        },
        type: "feature"
      },
      {
        text: {
          en: "New assignments tab for linking companies to map locations",
          nl: "Nieuw toewijzingen tab voor koppelen van bedrijven aan kaartlocaties"
        },
        type: "feature"
      },
      {
        text: {
          en: "Improved marker drag performance on map",
          nl: "Verbeterde marker sleep prestaties op kaart"
        },
        type: "improvement"
      }
    ]
  },
  {
    date: "2025-11-05",
    changes: [
      {
        text: {
          en: "Map marker rotation with interactive handles",
          nl: "Kaart marker rotatie met interactieve handgrepen"
        },
        type: "feature"
      },
      {
        text: {
          en: "Role-based navigation (Super Admin, System Manager, Event Manager)",
          nl: "Rol-gebaseerde navigatie (Super Admin, Systeembeheerder, Eventbeheerder)"
        },
        type: "feature"
      },
      {
        text: {
          en: "Fixed marker lock state persisting correctly",
          nl: "Marker vergrendelstatus wordt nu correct opgeslagen"
        },
        type: "fix"
      }
    ]
  },
  {
    date: "2025-10-30",
    changes: [
      {
        text: {
          en: "Initial admin dashboard with key metrics",
          nl: "Initieel admin dashboard met belangrijkste statistieken"
        },
        type: "feature"
      },
      {
        text: {
          en: "Companies management with import/export",
          nl: "Bedrijvenbeheer met import/export"
        },
        type: "feature"
      },
      {
        text: {
          en: "Map Management page with marker placement",
          nl: "Kaartbeheer pagina met marker plaatsing"
        },
        type: "feature"
      }
    ]
  }
];

/**
 * Get recent changes with localized text
 * @param {number} limit - Maximum number of recent items to return
 * @param {string} language - Language code ('en' or 'nl')
 * @returns {Array} Array of recent change objects with localized text
 */
export function getRecentChanges(limit = 5, language = 'en') {
  return whatsNewBilingual.slice(0, limit).map(item => ({
    date: item.date,
    changes: item.changes.map(change => ({
      text: change.text[language] || change.text.en,
      type: change.type
    }))
  }));
}

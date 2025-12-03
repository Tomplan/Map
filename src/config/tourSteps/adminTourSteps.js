/**
 * Admin View Tour Configurations
 *
 * Tours for admin panel features with role-based access
 */

export const adminDashboardTour = {
  id: 'admin-dashboard',
  autoStart: true,
  roles: ['super_admin', 'system_manager', 'event_manager', 'content_editor'],
  steps: [
    {
      element: 'body',
      popover: {
        title: {
          en: 'Welcome to the Admin Panel!',
          nl: 'Welkom bij het Admin Paneel!'
        },
        description: {
          en: 'Let\'s take a quick tour of the admin dashboard. We\'ll show you the key features and help you get started managing your event.',
          nl: 'Laten we een korte rondleiding maken door het admin dashboard. We tonen je de belangrijkste functies en helpen je op weg met het beheren van je evenement.'
        },
        side: 'center',
        align: 'center',
      },
    },
    {
      element: '.year-selector',
      popover: {
        title: {
          en: 'Year Selector - Important!',
          nl: 'Jaarkeuze - Belangrijk!'
        },
        description: {
          en: 'This controls which event year you\'re managing. Subscriptions and assignments are year-specific, while companies and map markers are shared across all years.',
          nl: 'Dit bepaalt welk eventjaar je beheert. Inschrijvingen en toewijzingen zijn jaar-specifiek, terwijl bedrijven en kaartmarkers worden gedeeld over alle jaren.'
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.stats-grid',
      popover: {
        title: {
          en: 'Real-Time Metrics',
          nl: 'Real-Time Statistieken'
        },
        description: {
          en: 'These cards show live statistics for the selected year: total booths, companies, subscriptions, and assignments. They update automatically.',
          nl: 'Deze kaarten tonen live statistieken voor het geselecteerde jaar: totaal stands, bedrijven, inschrijvingen en toewijzingen. Ze updaten automatisch.'
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.event-totals',
      popover: {
        title: {
          en: 'Event Totals',
          nl: 'Evenement Totalen'
        },
        description: {
          en: 'View detailed meal counts (breakfast, lunch, BBQ) per day and total coins distributed across all subscriptions.',
          nl: 'Bekijk gedetailleerde maaltijdtelling (ontbijt, lunch, BBQ) per dag en totaal uitgedeelde munten over alle inschrijvingen.'
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.quick-actions',
      popover: {
        title: {
          en: 'Quick Actions',
          nl: 'Snelle Acties'
        },
        description: {
          en: 'Jump directly to common management tasks: add companies, manage subscriptions, or configure settings.',
          nl: 'Ga direct naar veel voorkomende beheertaken: bedrijven toevoegen, inschrijvingen beheren of instellingen configureren.'
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.admin-sidebar',
      popover: {
        title: {
          en: 'Navigation Sidebar',
          nl: 'Navigatie Zijbalk'
        },
        description: {
          en: 'Access different management sections from this sidebar. Available options depend on your role and permissions.',
          nl: 'Toegang tot verschillende beheersecties vanuit deze zijbalk. Beschikbare opties hangen af van je rol en rechten.'
        },
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '.help-button',
      popover: {
        title: {
          en: 'Help & Tours',
          nl: 'Hulp & Rondleidingen'
        },
        description: {
          en: 'Access contextual help for any page, view recent changes, and restart tours anytime from the help panel.',
          nl: 'Toegang tot contextuele hulp voor elke pagina, recente wijzigingen bekijken en rondleidingen op elk moment herstarten vanuit het hulppaneel.'
        },
        side: 'left',
        align: 'start',
      },
    },
  ],
};

export const adminMapManagementTour = {
  id: 'admin-map-management',
  autoStart: false,
  roles: ['super_admin', 'system_manager'],
  steps: [
    {
      element: '.map-management-container',
      popover: {
        title: {
          en: 'Map Management',
          nl: 'Kaartbeheer'
        },
        description: {
          en: 'This is where you manage all map markers and booth locations. Markers are shared across all event years.',
          nl: 'Hier beheer je alle kaartmarkers en standlocaties. Markers worden gedeeld over alle eventjaren.'
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.add-marker-button',
      popover: {
        title: {
          en: 'Add New Markers',
          nl: 'Nieuwe Markers Toevoegen'
        },
        description: {
          en: 'Click here to add a new booth or amenity marker to the map. You can then drag it to the exact location.',
          nl: 'Klik hier om een nieuwe stand- of voorzieningen marker aan de kaart toe te voegen. Je kunt deze vervolgens naar de exacte locatie slepen.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.marker-types-selector',
      popover: {
        title: {
          en: 'Marker Types',
          nl: 'Marker Types'
        },
        description: {
          en: 'Choose between booth markers (for exhibitors) and amenity markers (toilets, food, parking, etc.). Each type has different styling options.',
          nl: 'Kies tussen stand markers (voor exposanten) en voorzieningen markers (toiletten, eten, parkeren, etc.). Elk type heeft verschillende stijlopties.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.marker-properties-panel',
      popover: {
        title: {
          en: 'Marker Properties',
          nl: 'Marker Eigenschappen'
        },
        description: {
          en: 'Edit marker details: name, booth number, type, icon, color, rotation, and zoom visibility levels.',
          nl: 'Bewerk marker details: naam, standnummer, type, icoon, kleur, rotatie en zoom zichtbaarheidsniveaus.'
        },
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '.copy-from-year-button',
      popover: {
        title: {
          en: 'Copy From Previous Year',
          nl: 'Kopiëren Van Vorig Jaar'
        },
        description: {
          en: 'Quickly duplicate markers from a previous event year to save time. You can then adjust individual markers as needed.',
          nl: 'Dupliceer snel markers van een vorig eventjaar om tijd te besparen. Je kunt vervolgens individuele markers aanpassen indien nodig.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.preview-mode-toggle',
      popover: {
        title: {
          en: 'Preview Mode',
          nl: 'Voorbeeldmodus'
        },
        description: {
          en: 'Switch to preview mode to see how the map looks to visitors. This helps verify everything is positioned correctly.',
          nl: 'Schakel naar voorbeeldmodus om te zien hoe de kaart er voor bezoekers uitziet. Dit helpt te verifiëren dat alles correct gepositioneerd is.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
  ],
};

export const adminDataManagementTour = {
  id: 'admin-data-management',
  autoStart: false,
  roles: ['super_admin', 'event_manager'],
  steps: [
    {
      element: '.companies-tab',
      popover: {
        title: {
          en: 'Companies Management',
          nl: 'Bedrijvenbeheer'
        },
        description: {
          en: 'Manage exhibitor company profiles here. Companies are global and shared across all event years.',
          nl: 'Beheer exposant bedrijfsprofielen hier. Bedrijven zijn globaal en gedeeld over alle eventjaren.'
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.add-company-button',
      popover: {
        title: {
          en: 'Add New Company',
          nl: 'Nieuw Bedrijf Toevoegen'
        },
        description: {
          en: 'Create a new exhibitor company profile with bilingual content (EN/NL), logo, contact info, and category.',
          nl: 'Maak een nieuw exposant bedrijfsprofiel met tweetalige content (EN/NL), logo, contactinfo en categorie.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.subscriptions-tab',
      popover: {
        title: {
          en: 'Event Subscriptions',
          nl: 'Evenement Inschrijvingen'
        },
        description: {
          en: 'Manage year-specific company registrations. Track meal bookings, booth assignments, and coin distribution.',
          nl: 'Beheer jaar-specifieke bedrijfsinschrijvingen. Volg maaltijdboekingen, standtoewijzingen en muntverdeling.'
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.import-export-buttons',
      popover: {
        title: {
          en: 'Import & Export',
          nl: 'Importeren & Exporteren'
        },
        description: {
          en: 'Bulk import companies or subscriptions from Excel/CSV files. Export current data for backup or external processing.',
          nl: 'Bulk importeer bedrijven of inschrijvingen van Excel/CSV bestanden. Exporteer huidige data voor backup of externe verwerking.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.assignments-tab',
      popover: {
        title: {
          en: 'Booth Assignments',
          nl: 'Stand Toewijzingen'
        },
        description: {
          en: 'Assign companies to specific booth locations for the selected year. Each year can have different booth assignments.',
          nl: 'Wijs bedrijven toe aan specifieke standlocaties voor het geselecteerde jaar. Elk jaar kan verschillende standtoewijzingen hebben.'
        },
        side: 'top',
        align: 'center',
      },
    },
  ],
};

/**
 * Get all admin tours
 */
export function getAllAdminTours() {
  return [
    adminDashboardTour,
    adminMapManagementTour,
    adminDataManagementTour,
  ];
}

/**
 * Get tours filtered by user role
 */
export function getToursByRole(userRole) {
  const allTours = getAllAdminTours();

  return allTours.filter(tour => {
    if (!tour.roles) return true; // No role restriction
    if (userRole === 'super_admin') return true; // Super admin sees all
    return tour.roles.includes(userRole);
  });
}

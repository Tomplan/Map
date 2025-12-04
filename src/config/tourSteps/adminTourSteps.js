/**
 * Admin View Tour Configurations
 *
 * Tours for admin panel features with role-based access
 */

export const adminDashboardTour = {
  scope: 'admin',
  id: 'admin-dashboard',
  path: '/admin',
  autoStart: true,
  roles: ['super_admin', 'system_manager', 'event_manager', 'content_editor'],
  title: {
    en: 'Dashboard',
    nl: 'Dashboard',
  },
  description: {
    en: 'Overview of the admin panel and key statistics',
    nl: 'Overzicht van het admin panel en belangrijke statistieken',
  },
  steps: [
    {
      element: 'body',
      popover: {
        title: {
          en: 'Welcome to the Admin Panel!',
          nl: 'Welkom bij het Admin Paneel!',
        },
        description: {
          en: "Let's take a quick tour of the admin dashboard. We'll show you the key features and help you get started managing your event.",
          nl: 'Laten we een korte rondleiding maken door het admin dashboard. We tonen je de belangrijkste functies en helpen je op weg met het beheren van je evenement.',
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
          nl: 'Jaarkeuze - Belangrijk!',
        },
        description: {
          en: "This controls which event year you're managing. Subscriptions and assignments are year-specific, while companies and map markers are shared across all years.",
          nl: 'Dit bepaalt welk eventjaar je beheert. Inschrijvingen en toewijzingen zijn jaar-specifiek, terwijl bedrijven en kaartmarkers worden gedeeld over alle jaren.',
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
          nl: 'Real-Time Statistieken',
        },
        description: {
          en: 'These cards show live statistics for the selected year: total booths, companies, subscriptions, and assignments. They update automatically.',
          nl: 'Deze kaarten tonen live statistieken voor het geselecteerde jaar: totaal stands, bedrijven, inschrijvingen en toewijzingen. Ze updaten automatisch.',
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
          nl: 'Evenement Totalen',
        },
        description: {
          en: 'View detailed meal counts (breakfast, lunch, BBQ) per day and total coins distributed across all subscriptions.',
          nl: 'Bekijk gedetailleerde maaltijdtelling (ontbijt, lunch, BBQ) per dag en totaal uitgedeelde munten over alle inschrijvingen.',
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
          nl: 'Snelle Acties',
        },
        description: {
          en: 'Jump directly to common management tasks: add companies, manage subscriptions, or configure settings.',
          nl: 'Ga direct naar veel voorkomende beheertaken: bedrijven toevoegen, inschrijvingen beheren of instellingen configureren.',
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
          nl: 'Navigatie Zijbalk',
        },
        description: {
          en: 'Access different management sections from this sidebar. Available options depend on your role and permissions.',
          nl: 'Toegang tot verschillende beheersecties vanuit deze zijbalk. Beschikbare opties hangen af van je rol en rechten.',
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
          nl: 'Hulp & Rondleidingen',
        },
        description: {
          en: 'Access contextual help for any page, view recent changes, and restart tours anytime from the help panel.',
          nl: 'Toegang tot contextuele hulp voor elke pagina, recente wijzigingen bekijken en rondleidingen op elk moment herstarten vanuit het hulppaneel.',
        },
        side: 'left',
        align: 'start',
      },
    },
  ],
};

export const adminMapManagementTour = {
  scope: 'admin',
  id: 'admin-map-management',
  path: '/admin/map',
  autoStart: false,
  roles: ['super_admin', 'system_manager'],
  title: {
    en: 'Map Management',
    nl: 'Kaartbeheer',
  },
  description: {
    en: 'Manage map markers and booth locations',
    nl: 'Beheer kaartmarkers en standlocaties',
  },
  steps: [
    {
      element: '[data-testid="map-management-container"]',
      popover: {
        title: {
          en: 'Map Management',
          nl: 'Kaartbeheer',
        },
        description: {
          en: 'This is where you manage all map markers and booth locations for each event year.',
          nl: 'Hier beheer je alle kaartmarkers en standlocaties voor elk eventjaar.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="add-marker-button"]',
      popover: {
        title: {
          en: 'Add New Markers',
          nl: 'Nieuwe Markers Toevoegen',
        },
        description: {
          en: 'Click this button on the map to add a new marker. Enter the marker ID and click on the map to place it.',
          nl: 'Klik op deze knop op de kaart om een nieuwe marker toe te voegen. Voer het marker-ID in en klik op de kaart om deze te plaatsen.',
        },
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-testid="copy-from-year-button"]',
      popover: {
        title: {
          en: 'Copy From Previous Year',
          nl: 'Kopiëren Van Vorig Jaar',
        },
        description: {
          en: 'Quickly duplicate all markers from the previous event year to save time. You can then adjust individual markers as needed.',
          nl: 'Dupliceer snel alle markers van het vorige eventjaar om tijd te besparen. Je kunt vervolgens individuele markers aanpassen indien nodig.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="marker-properties-panel"]',
      popover: {
        title: {
          en: 'Marker Properties',
          nl: 'Marker Eigenschappen',
        },
        description: {
          en: 'Select a marker from the list or map to edit its details: name, booth number, icon, color, rotation, and zoom visibility levels.',
          nl: 'Selecteer een marker uit de lijst of kaart om de details te bewerken: naam, standnummer, icoon, kleur, rotatie en zoom zichtbaarheidsniveaus.',
        },
        side: 'left',
        align: 'start',
      },
    },
  ],
};

export const adminDataManagementTour = {
  scope: 'admin',
  id: 'admin-data-management',
  path: '/admin/companies',
  autoStart: false,
  roles: ['super_admin', 'event_manager'],
  title: {
    en: 'Companies',
    nl: 'Bedrijven',
  },
  description: {
    en: 'Manage company information and data',
    nl: 'Beheer bedrijfsinformatie en -gegevens',
  },
  steps: [
    {
      element: '[data-testid="companies-container"]',
      popover: {
        title: {
          en: 'Companies Management',
          nl: 'Bedrijvenbeheer',
        },
        description: {
          en: 'Manage exhibitor company profiles here. Companies are global and shared across all event years.',
          nl: 'Beheer exposant bedrijfsprofielen hier. Bedrijven zijn globaal en gedeeld over alle eventjaren.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="add-company-button"]',
      popover: {
        title: {
          en: 'Add New Company',
          nl: 'Nieuw Bedrijf Toevoegen',
        },
        description: {
          en: 'Create a new exhibitor company profile with bilingual content (EN/NL), logo, contact info, and category tags.',
          nl: 'Maak een nieuw exposant bedrijfsprofiel met tweetalige content (EN/NL), logo, contactinfo en categorie tags.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="import-export-buttons"]',
      popover: {
        title: {
          en: 'Import & Export',
          nl: 'Importeren & Exporteren',
        },
        description: {
          en: 'Bulk import companies from Excel/CSV files or export current data for backup and external processing.',
          nl: 'Bulk importeer bedrijven van Excel/CSV bestanden of exporteer huidige data voor backup en externe verwerking.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="public-info-tab"]',
      popover: {
        title: {
          en: 'Public vs Private Information',
          nl: 'Publieke vs Privé Informatie',
        },
        description: {
          en: 'Switch between Public Info (visible to visitors) and Private Info (internal contact details for event managers).',
          nl: 'Schakel tussen Publieke Info (zichtbaar voor bezoekers) en Privé Info (interne contactgegevens voor eventmanagers).',
        },
        side: 'bottom',
        align: 'start',
      },
    },
  ],
};

/**
 * Admin Subscriptions Tour
 * Guides admins through managing event subscriptions
 */
export const adminSubscriptionsTour = {
  scope: 'admin',
  id: 'admin-subscriptions',
  path: '/admin/subscriptions',
  autoStart: false,
  roles: ['super_admin', 'event_manager'],
  title: {
    en: 'Subscriptions',
    nl: 'Inschrijvingen',
  },
  description: {
    en: 'Manage company subscriptions for events',
    nl: 'Beheer bedrijfsinschrijvingen voor evenementen',
  },
  steps: [
    {
      element: '[data-testid="subscriptions-container"]',
      popover: {
        title: {
          en: 'Event Subscriptions',
          nl: 'Evenement Inschrijvingen',
        },
        description: {
          en: 'This is where you manage which companies are subscribed to participate in the event for the selected year.',
          nl: 'Hier beheer je welke bedrijven ingeschreven zijn om deel te nemen aan het evenement voor het geselecteerde jaar.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="subscriptions-search"]',
      popover: {
        title: {
          en: 'Search Subscriptions',
          nl: 'Zoek Inschrijvingen',
        },
        description: {
          en: 'Quickly find companies by name to view or edit their subscription details.',
          nl: 'Zoek snel bedrijven op naam om hun inschrijvingsdetails te bekijken of te bewerken.',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="import-export-buttons"]',
      popover: {
        title: {
          en: 'Import/Export Data',
          nl: 'Importeer/Exporteer Gegevens',
        },
        description: {
          en: 'Import subscription data from CSV/Excel files or export the current subscriptions for external use.',
          nl: 'Importeer inschrijvingsgegevens uit CSV/Excel-bestanden of exporteer de huidige inschrijvingen voor extern gebruik.',
        },
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-testid="copy-from-previous-year-button"]',
      popover: {
        title: {
          en: 'Copy From Previous Year',
          nl: 'Kopiëren Vanaf Vorig Jaar',
        },
        description: {
          en: 'Quickly set up subscriptions by copying all subscriptions from the previous event year as a starting point.',
          nl: 'Stel snel inschrijvingen in door alle inschrijvingen van het vorige eventjaar te kopiëren als uitgangspunt.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="archive-year-button"]',
      popover: {
        title: {
          en: 'Archive Year',
          nl: 'Archiveer Jaar',
        },
        description: {
          en: 'Archive all subscriptions for this year once the event is complete. Archived data can still be viewed but not edited.',
          nl: 'Archiveer alle inschrijvingen voor dit jaar zodra het evenement voltooid is. Gearchiveerde gegevens kunnen nog worden bekeken maar niet bewerkt.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="subscribe-company-button"]',
      popover: {
        title: {
          en: 'Subscribe Company',
          nl: 'Bedrijf Inschrijven',
        },
        description: {
          en: 'Add a new company subscription for this event year. You can select the company and configure their participation details.',
          nl: 'Voeg een nieuwe bedrijfsinschrijving toe voor dit eventjaar. Je kunt het bedrijf selecteren en hun deelnamedetails configureren.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="subscriptions-table"]',
      popover: {
        title: {
          en: 'Subscriptions Table',
          nl: 'Inschrijvingstabel',
        },
        description: {
          en: 'View all subscribed companies with their details. Click on a row to edit the subscription or manage their booth assignments.',
          nl: 'Bekijk alle ingeschreven bedrijven met hun details. Klik op een rij om de inschrijving te bewerken of hun standtoewijzingen te beheren.',
        },
        side: 'top',
        align: 'center',
      },
    },
  ],
};

/**
 * Admin Assignments Tour
 * Guides admins through the booth assignment matrix
 */
export const adminAssignmentsTour = {
  scope: 'admin',
  id: 'admin-assignments',
  path: '/admin/assignments',
  autoStart: false,
  roles: ['super_admin', 'event_manager'],
  title: {
    en: 'Assignments',
    nl: 'Toewijzingen',
  },
  description: {
    en: 'Assign companies to booth locations',
    nl: 'Wijs bedrijven toe aan standlocaties',
  },
  steps: [
    {
      element: '[data-testid="assignments-container"]',
      popover: {
        title: {
          en: 'Booth Assignments',
          nl: 'Standtoewijzingen',
        },
        description: {
          en: 'This is the assignments matrix where you assign subscribed companies to specific booth locations on the map.',
          nl: 'Dit is de toewijzingsmatrix waar je ingeschreven bedrijven toewijst aan specifieke standlocaties op de kaart.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="assignments-search"]',
      popover: {
        title: {
          en: 'Search Companies',
          nl: 'Zoek Bedrijven',
        },
        description: {
          en: 'Search for specific companies to quickly find their assignment rows in the matrix.',
          nl: 'Zoek naar specifieke bedrijven om snel hun toewijzingsrijen in de matrix te vinden.',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="view-archived-button"]',
      popover: {
        title: {
          en: 'View Archived',
          nl: 'Bekijk Gearchiveerd',
        },
        description: {
          en: 'Toggle to view assignments from archived years for reference or comparison.',
          nl: 'Schakel om toewijzingen van gearchiveerde jaren te bekijken ter referentie of vergelijking.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="archive-assignments-button"]',
      popover: {
        title: {
          en: 'Archive Assignments',
          nl: 'Archiveer Toewijzingen',
        },
        description: {
          en: 'Archive all booth assignments for this year when the event is complete.',
          nl: 'Archiveer alle standtoewijzingen voor dit jaar wanneer het evenement voltooid is.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="sort-companies-dropdown"]',
      popover: {
        title: {
          en: 'Sort Companies',
          nl: 'Sorteer Bedrijven',
        },
        description: {
          en: 'Choose how to sort the company rows: alphabetically, by category, by subscription order, or manually.',
          nl: 'Kies hoe de bedrijfsrijen te sorteren: alfabetisch, per categorie, per inschrijvingsvolgorde of handmatig.',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="sort-markers-dropdown"]',
      popover: {
        title: {
          en: 'Sort Markers',
          nl: 'Sorteer Markers',
        },
        description: {
          en: 'Choose how to sort the booth/marker columns: by position on map, by marker number, or by type.',
          nl: 'Kies hoe de stand/marker kolommen te sorteren: op positie op kaart, op markernummer of op type.',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="assignments-matrix"]',
      popover: {
        title: {
          en: 'Assignment Matrix',
          nl: 'Toewijzingsmatrix',
        },
        description: {
          en: 'The main matrix grid. Rows are companies, columns are booth locations. Click cells to assign/unassign companies to booths.',
          nl: 'Het hoofdmatrixraster. Rijen zijn bedrijven, kolommen zijn standlocaties. Klik op cellen om bedrijven toe te wijzen/verwijderen aan stands.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="assignments-legend"]',
      popover: {
        title: {
          en: 'Assignment Legend',
          nl: 'Toewijzingslegenda',
        },
        description: {
          en: 'The legend explains the color coding: assigned cells, unassigned cells, and any special status indicators.',
          nl: 'De legenda legt de kleurcodering uit: toegewezen cellen, niet-toegewezen cellen en eventuele speciale statusindicatoren.',
        },
        side: 'top',
        align: 'center',
      },
    },
  ],
};

/**
 * Admin Program Management Tour
 * Guides admins through managing the event schedule/program
 */
export const adminProgramManagementTour = {
  scope: 'admin',
  id: 'admin-program-management',
  path: '/admin/program',
  autoStart: false,
  roles: ['super_admin', 'event_manager'],
  title: {
    en: 'Program Management',
    nl: 'Programmabeheer',
  },
  description: {
    en: 'Manage the event schedule and activities',
    nl: 'Beheer het evenementprogramma en activiteiten',
  },
  steps: [
    {
      element: '[data-testid="program-management-container"]',
      popover: {
        title: {
          en: 'Program Management',
          nl: 'Programma Beheer',
        },
        description: {
          en: 'This is where you manage the event program: all activities, workshops, and scheduled events for visitors.',
          nl: 'Hier beheer je het eventprogramma: alle activiteiten, workshops en geplande evenementen voor bezoekers.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="copy-from-previous-year-button"]',
      popover: {
        title: {
          en: 'Copy From Previous Year',
          nl: 'Kopiëren Vanaf Vorig Jaar',
        },
        description: {
          en: 'Quickly set up the program by copying all activities from the previous year as a starting template.',
          nl: 'Stel snel het programma in door alle activiteiten van het vorige jaar te kopiëren als startsjabloon.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="archive-year-button"]',
      popover: {
        title: {
          en: 'Archive Year',
          nl: 'Archiveer Jaar',
        },
        description: {
          en: 'Archive the entire program for this year once the event is complete.',
          nl: 'Archiveer het volledige programma voor dit jaar zodra het evenement voltooid is.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="paste-activity-button"]',
      popover: {
        title: {
          en: 'Paste Activity',
          nl: 'Activiteit Plakken',
        },
        description: {
          en: 'Paste a previously copied activity. This is useful for duplicating similar activities with different times.',
          nl: 'Plak een eerder gekopieerde activiteit. Dit is handig voor het dupliceren van vergelijkbare activiteiten met verschillende tijden.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="add-activity-button"]',
      popover: {
        title: {
          en: 'Add Activity',
          nl: 'Activiteit Toevoegen',
        },
        description: {
          en: 'Create a new program activity with details like title, time, location, and description.',
          nl: 'Maak een nieuwe programma-activiteit aan met details zoals titel, tijd, locatie en beschrijving.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="saturday-tab"]',
      popover: {
        title: {
          en: 'Day Tabs',
          nl: 'Dagtabbladen',
        },
        description: {
          en: 'Switch between Saturday and Sunday to view and manage the program for each day of the event.',
          nl: 'Schakel tussen zaterdag en zondag om het programma voor elke dag van het evenement te bekijken en te beheren.',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="activities-list"]',
      popover: {
        title: {
          en: 'Activities List',
          nl: 'Activiteitenlijst',
        },
        description: {
          en: 'View all scheduled activities for the selected day. Activities are displayed with their time, title, and location.',
          nl: 'Bekijk alle geplande activiteiten voor de geselecteerde dag. Activiteiten worden weergegeven met hun tijd, titel en locatie.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="copy-activity-button"]',
      popover: {
        title: {
          en: 'Copy Activity',
          nl: 'Kopieer Activiteit',
        },
        description: {
          en: 'Copy an activity to the clipboard. You can then paste it to create a duplicate with modified details.',
          nl: 'Kopieer een activiteit naar het klembord. Je kunt deze vervolgens plakken om een duplicaat te maken met aangepaste details.',
        },
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '[data-testid="program-stats"]',
      popover: {
        title: {
          en: 'Program Statistics',
          nl: 'Programma Statistieken',
        },
        description: {
          en: 'View summary statistics: total activities, active activities, and inactive activities for the selected day.',
          nl: 'Bekijk samenvattende statistieken: totaal aantal activiteiten, actieve activiteiten en inactieve activiteiten voor de geselecteerde dag.',
        },
        side: 'top',
        align: 'center',
      },
    },
  ],
};

/**
 * Admin Settings Tour
 * Guides admins through the settings page and configuration options
 */
export const adminSettingsTour = {
  scope: 'admin',
  id: 'admin-settings',
  path: '/admin/settings',
  autoStart: false,
  roles: ['super_admin', 'system_manager', 'event_manager'],
  title: {
    en: 'Settings',
    nl: 'Instellingen',
  },
  description: {
    en: 'Manage system settings and personalize your experience',
    nl: 'Beheer systeeminstellingen en personaliseer je ervaring',
  },
  steps: [
    {
      element: '[data-testid="settings-container"]',
      popover: {
        title: {
          en: 'Settings Overview',
          nl: 'Instellingen Overzicht',
        },
        description: {
          en: 'This is the central hub for all system configuration and personal preferences. Settings are organized into personal and organization-wide sections.',
          nl: 'Dit is het centrale punt voor alle systeemconfiguratie en persoonlijke voorkeuren. Instellingen zijn georganiseerd in persoonlijke en organisatiebrede secties.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="settings-header"]',
      popover: {
        title: {
          en: 'Your Role Badge',
          nl: 'Jouw Rol Badge',
        },
        description: {
          en: 'Your current role is displayed here. Available settings sections depend on your role and permissions (Super Admin, System Manager, or Event Manager).',
          nl: 'Je huidige rol wordt hier weergegeven. Beschikbare instellingensecties hangen af van je rol en rechten (Super Admin, Systeembeheerder of Evenementbeheerder).',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="settings-sidebar"]',
      popover: {
        title: {
          en: 'Settings Navigation',
          nl: 'Instellingen Navigatie',
        },
        description: {
          en: 'Use this sidebar to navigate between different settings categories. Each section is clearly labeled with an icon and brief description.',
          nl: 'Gebruik deze zijbalk om te navigeren tussen verschillende instellingencategorieën. Elke sectie is duidelijk gelabeld met een icoon en korte beschrijving.',
        },
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-testid="personal-settings-group"]',
      popover: {
        title: {
          en: 'Personal Settings',
          nl: 'Persoonlijke Instellingen',
        },
        description: {
          en: 'These settings affect only you and your experience with the admin panel, such as your preferred UI language.',
          nl: 'Deze instellingen zijn alleen van invloed op jou en je ervaring met het admin panel, zoals je voorkeurstaal voor de interface.',
        },
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-testid="organization-settings-group"]',
      popover: {
        title: {
          en: 'Organization Settings',
          nl: 'Organisatie Instellingen',
        },
        description: {
          en: 'These settings affect all users and visitors: user management, branding, map defaults, categories, and event configuration.',
          nl: 'Deze instellingen zijn van invloed op alle gebruikers en bezoekers: gebruikersbeheer, branding, kaartstandaarden, categorieën en evenementconfiguratie.',
        },
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-testid="settings-section-ui-language"]',
      popover: {
        title: {
          en: 'UI Language Setting',
          nl: 'UI Taal Instelling',
        },
        description: {
          en: 'Click any section to view and edit its settings. For example, UI Language lets you choose between English and Dutch for the admin interface.',
          nl: 'Klik op een sectie om de instellingen te bekijken en te bewerken. Bijvoorbeeld, UI Taal laat je kiezen tussen Engels en Nederlands voor de admin interface.',
        },
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-testid="settings-section-branding"]',
      popover: {
        title: {
          en: 'Branding Settings',
          nl: 'Branding Instellingen',
        },
        description: {
          en: "Customize your organization's visual identity: logo, app name, theme colors, and fonts. These changes affect all users.",
          nl: 'Pas de visuele identiteit van je organisatie aan: logo, app-naam, themakleuren en lettertypen. Deze wijzigingen zijn van invloed op alle gebruikers.',
        },
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-testid="settings-section-user-management"]',
      popover: {
        title: {
          en: 'User Management',
          nl: 'Gebruikersbeheer',
        },
        description: {
          en: 'Invite new admin users, assign roles, and manage permissions. Only Super Admins and System Managers have access to this section.',
          nl: 'Nodig nieuwe admin gebruikers uit, wijs rollen toe en beheer rechten. Alleen Super Admins en Systeembeheerders hebben toegang tot deze sectie.',
        },
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-testid="settings-content"]',
      popover: {
        title: {
          en: 'Settings Content Area',
          nl: 'Instellingen Inhoudsgebied',
        },
        description: {
          en: 'The selected settings panel appears here. Make your changes and save - most settings take effect immediately.',
          nl: 'Het geselecteerde instellingenpaneel verschijnt hier. Maak je wijzigingen en sla op - de meeste instellingen zijn onmiddellijk van kracht.',
        },
        side: 'left',
        align: 'start',
      },
    },
  ],
};

/**
 * Admin Feedback Requests Tour
 * Guides admins through the feedback and feature request system
 */
export const adminFeedbackRequestsTour = {
  scope: 'admin',
  id: 'admin-feedback-requests',
  path: '/admin/feedback',
  autoStart: false,
  roles: ['super_admin', 'system_manager', 'event_manager'],
  title: {
    en: 'Feedback & Feature Requests',
    nl: 'Feedback & Functieverzoeken',
  },
  description: {
    en: 'Learn how to submit issues, request features, and track progress',
    nl: 'Leer hoe je problemen meldt, functies aanvraagt en voortgang volgt',
  },
  steps: [
    {
      element: '[data-testid="feedback-requests-container"]',
      popover: {
        title: {
          en: 'Feedback System',
          nl: 'Feedbacksysteem',
        },
        description: {
          en: 'This is your hub for reporting issues, requesting new features, and tracking development progress. Your input helps shape the platform!',
          nl: 'Dit is je hub voor het melden van problemen, het aanvragen van nieuwe functies en het volgen van ontwikkelingsvoortgang. Jouw input helpt het platform vorm te geven!',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="feedback-tabs"]',
      popover: {
        title: {
          en: 'Navigation Tabs',
          nl: 'Navigatietabbladen',
        },
        description: {
          en: 'Switch between "All Requests" to see everything, "My Requests" to view your submissions, or "Submit New" to create a request.',
          nl: 'Schakel tussen "Alle Verzoeken" om alles te zien, "Mijn Verzoeken" om je inzendingen te bekijken, of "Nieuwe Indienen" om een verzoek te maken.',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="feedback-filters"]',
      popover: {
        title: {
          en: 'Search & Filters',
          nl: 'Zoeken & Filters',
        },
        description: {
          en: 'Narrow down requests by searching keywords, filtering by type (Issue/Feature), and filtering by status (Open, In Progress, Completed, Archived).',
          nl: 'Beperk verzoeken door te zoeken op trefwoorden, te filteren op type (Probleem/Functie) en te filteren op status (Open, In Behandeling, Voltooid, Gearchiveerd).',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="feedback-search"]',
      popover: {
        title: {
          en: 'Search Requests',
          nl: 'Zoek Verzoeken',
        },
        description: {
          en: 'Search by title, description, or submitter email to quickly find specific requests.',
          nl: 'Zoek op titel, beschrijving of e-mail van de indiener om snel specifieke verzoeken te vinden.',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="feedback-type-filter"]',
      popover: {
        title: {
          en: 'Filter by Type',
          nl: 'Filter op Type',
        },
        description: {
          en: 'Filter requests by type: Issues (bugs or problems) or Feature Requests (new functionality). You can select multiple types.',
          nl: 'Filter verzoeken op type: Problemen (bugs of issues) of Functieverzoeken (nieuwe functionaliteit). Je kunt meerdere types selecteren.',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="feedback-status-filter"]',
      popover: {
        title: {
          en: 'Filter by Status',
          nl: 'Filter op Status',
        },
        description: {
          en: 'Filter by development status: Open (new), In Progress (being worked on), Completed (deployed), or Archived (closed without action).',
          nl: 'Filter op ontwikkelingsstatus: Open (nieuw), In Behandeling (wordt aan gewerkt), Voltooid (uitgerold), of Gearchiveerd (gesloten zonder actie).',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="feedback-tab-submit"]',
      popover: {
        title: {
          en: 'Submit New Request',
          nl: 'Nieuw Verzoek Indienen',
        },
        description: {
          en: "Click this tab to submit a new issue or feature request. Let's see how it works!",
          nl: 'Klik op dit tabblad om een nieuw probleem of functieverzoek in te dienen. Laten we kijken hoe het werkt!',
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-testid="feedback-submit-form"]',
      popover: {
        title: {
          en: 'Submission Form',
          nl: 'Indieningsformulier',
        },
        description: {
          en: 'Fill out this form to submit your request. Choose the type (Issue or Feature), provide a clear title, and add detailed description.',
          nl: 'Vul dit formulier in om je verzoek in te dienen. Kies het type (Probleem of Functie), geef een duidelijke titel en voeg een gedetailleerde beschrijving toe.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="feedback-submit-type"]',
      popover: {
        title: {
          en: 'Request Type',
          nl: 'Verzoektype',
        },
        description: {
          en: 'Choose "Issue" for bugs or problems, and "Feature Request" for new functionality you\'d like to see added.',
          nl: 'Kies "Probleem" voor bugs of problemen, en "Functieverzoek" voor nieuwe functionaliteit die je graag toegevoegd zou willen zien.',
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-testid="feedback-submit-button"]',
      popover: {
        title: {
          en: 'Submit Your Request',
          nl: 'Dien Je Verzoek In',
        },
        description: {
          en: 'After filling the form, click here to submit. Your request will be visible to all users who can vote and comment on it.',
          nl: 'Na het invullen van het formulier, klik hier om in te dienen. Je verzoek wordt zichtbaar voor alle gebruikers die erop kunnen stemmen en reageren.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="feedback-requests-list"]',
      popover: {
        title: {
          en: 'Requests List',
          nl: 'Verzoeken Lijst',
        },
        description: {
          en: 'Browse all submitted requests. Each card shows the type, status, title, description preview, and vote/comment counts. Click any request to view details.',
          nl: 'Blader door alle ingediende verzoeken. Elke kaart toont het type, status, titel, beschrijvingsvoorbeeld en stem/reactie tellingen. Klik op een verzoek om details te bekijken.',
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-testid="feedback-vote-button"]',
      popover: {
        title: {
          en: 'Vote for Requests',
          nl: 'Stem op Verzoeken',
        },
        description: {
          en: 'Upvote requests you want prioritized! The number shows total votes. Click to add or remove your vote.',
          nl: 'Stem op verzoeken die je wilt prioriteren! Het nummer toont het totaal aantal stemmen. Klik om je stem toe te voegen of te verwijderen.',
        },
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '[data-testid="feedback-comments-count"]',
      popover: {
        title: {
          en: 'Comments & Discussion',
          nl: 'Reacties & Discussie',
        },
        description: {
          en: 'See how many comments a request has. Click the request card to read comments, add your thoughts, and join the discussion!',
          nl: 'Zie hoeveel reacties een verzoek heeft. Klik op de verzoekkaart om reacties te lezen, je gedachten toe te voegen en deel te nemen aan de discussie!',
        },
        side: 'left',
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
    adminDataManagementTour,
    adminSubscriptionsTour,
    adminAssignmentsTour,
    adminProgramManagementTour,
    adminMapManagementTour,
    adminSettingsTour,
    adminFeedbackRequestsTour,
  ];
}

/**
 * Get tours filtered by user role
 */
export function getToursByRole(userRole) {
  const allTours = getAllAdminTours();

  return allTours.filter((tour) => {
    if (!tour.roles) return true; // No role restriction
    if (userRole === 'super_admin') return true; // Super admin sees all
    return tour.roles.includes(userRole);
  });
}

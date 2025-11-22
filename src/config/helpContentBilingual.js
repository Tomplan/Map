/**
 * Bilingual Help Content Configuration (EN/NL)
 * 
 * Complete help content for all admin pages in both English and Dutch.
 * Structure: Each section has title, content, updated date, and tips in both languages.
 */

export const helpContentBilingual = {
  dashboard: {
    title: {
      en: "Dashboard Overview",
      nl: "Dashboard Overzicht"
    },
    content: {
      en: `
The dashboard provides a quick overview of your event data:

**Key Metrics:**
- **Total Markers**: All map locations (booths, parking, facilities)
- **Companies**: Registered exhibitor companies
- **Subscriptions**: Companies registered for the selected year
- **Assignments**: Companies assigned to map locations

**Event Stats:**
- View meal counts (breakfast, lunch, BBQ) for Saturday and Sunday
- Track total coins distributed
- All stats update in real-time as you make changes

**Year Selector:**
Use the year dropdown in the top navigation to switch between event years.
      `.trim(),
      nl: `
Het dashboard biedt een snel overzicht van je event data:

**Belangrijkste Cijfers:**
- **Totaal Markers**: Alle kaartlocaties (stands, parkeren, faciliteiten)
- **Bedrijven**: Geregistreerde exposanten
- **Inschrijvingen**: Bedrijven ingeschreven voor het geselecteerde jaar
- **Toewijzingen**: Bedrijven toegewezen aan kaartlocaties

**Event Statistieken:**
- Bekijk maaltijdaantallen (ontbijt, lunch, BBQ) voor zaterdag en zondag
- Volg totaal uitgedeelde munten
- Alle statistieken updaten real-time bij wijzigingen

**Jaarselector:**
Gebruik de jaarkeuze in de topnavigatie om tussen evenementjaren te wisselen.
      `.trim()
    },
    updated: "2025-11-22",
    tips: {
      en: [
        "Use the year selector to view past or future events",
        "Stats update automatically when you make changes",
        "Dashboard is read-only - go to specific tabs to edit data"
      ],
      nl: [
        "Gebruik de jaarselector om verleden of toekomstige events te bekijken",
        "Statistieken updaten automatisch bij wijzigingen",
        "Dashboard is alleen-lezen - ga naar specifieke tabbladen om data te bewerken"
      ]
    }
  },

  mapManagement: {
    title: {
      en: "Map Management",
      nl: "Kaartbeheer"
    },
    content: {
      en: `
The Map Management page lets you place and configure map markers.

**Placing Markers:**
1. Click "Add Marker" or right-click on the map
2. Drag the marker to the desired position
3. Set marker properties (name, type, icon, visibility)
4. Click "Save" to persist changes

**Marker Properties:**
- **Type**: Booth, Parking, Food, Event, etc.
- **Icon & Color**: Visual appearance on map
- **Min/Max Zoom**: Control when marker appears based on zoom level
- **Rotation**: Adjust booth rectangle angle (booths only)
- **Lock**: Prevent accidental moves during event

**Tips:**
- Lock markers before event day to prevent accidental changes
- Use zoom visibility to keep map clean at different zoom levels
- Rectangles (6m x 6m) show booth outlines - only visible in admin view
      `.trim(),
      nl: `
De Kaartbeheer pagina laat je kaartmarkers plaatsen en configureren.

**Markers Plaatsen:**
1. Klik "Marker Toevoegen" of rechts-klik op de kaart
2. Sleep de marker naar de gewenste positie
3. Stel marker eigenschappen in (naam, type, icoon, zichtbaarheid)
4. Klik "Opslaan" om wijzigingen vast te leggen

**Marker Eigenschappen:**
- **Type**: Stand, Parkeren, Eten, Event, etc.
- **Icoon & Kleur**: Visuele weergave op kaart
- **Min/Max Zoom**: Bepaal wanneer marker verschijnt op basis van zoomniveau
- **Rotatie**: Pas standhoek aan (alleen stands)
- **Vergrendel**: Voorkom onbedoelde verplaatsingen tijdens event

**Tips:**
- Vergrendel markers voor de eventdag om ongelukken te voorkomen
- Gebruik zoomzichtbaarheid om kaart overzichtelijk te houden
- Rechthoeken (6m x 6m) tonen standcontouren - alleen zichtbaar in admin weergave
      `.trim()
    },
    updated: "2025-11-22",
    tips: {
      en: [
        "Right-click on map for quick marker creation",
        "Lock markers before going live to prevent accidents",
        "Adjust min/max zoom to control marker visibility",
        "Use rectangles to visualize booth layouts"
      ],
      nl: [
        "Rechts-klik op kaart voor snelle marker creatie",
        "Vergrendel markers voor go-live om ongelukken te voorkomen",
        "Pas min/max zoom aan om marker zichtbaarheid te regelen",
        "Gebruik rechthoeken om standindelingen te visualiseren"
      ]
    }
  },

  companies: {
    title: {
      en: "Companies Management",
      nl: "Bedrijvenbeheer"
    },
    content: {
      en: `
Manage exhibitor companies and their contact information.

**Adding Companies:**
1. Click "Add Company" button
2. Fill in company details (name, contact, phone, email)
3. Click "Save"

**Company Information:**
- **Company Name**: Primary identifier (must be unique)
- **Contact Person**: Main point of contact
- **Phone**: Contact phone number
- **Email**: Contact email address

**Editing Companies:**
- Click on any row to edit company details
- Changes save automatically
- Company data persists across event years
      `.trim(),
      nl: `
Beheer exposanten en hun contactinformatie.

**Bedrijven Toevoegen:**
1. Klik "Bedrijf Toevoegen" knop
2. Vul bedrijfsgegevens in (naam, contact, telefoon, email)
3. Klik "Opslaan"

**Bedrijfsinformatie:**
- **Bedrijfsnaam**: Primaire identificatie (moet uniek zijn)
- **Contactpersoon**: Hoofdcontact
- **Telefoon**: Contacttelefoonnummer
- **Email**: Contact emailadres

**Bedrijven Bewerken:**
- Klik op een rij om bedrijfsgegevens te bewerken
- Wijzigingen worden automatisch opgeslagen
- Bedrijfsdata blijft behouden over evenementjaren
      `.trim()
    },
    updated: "2025-11-22",
    tips: {
      en: [
        "Company names must be unique",
        "Use import for bulk company uploads",
        "Contact info is optional but recommended"
      ],
      nl: [
        "Bedrijfsnamen moeten uniek zijn",
        "Gebruik import voor bulk bedrijfsuploads",
        "Contactinfo is optioneel maar aangeraden"
      ]
    }
  },

  subscriptions: {
    title: {
      en: "Event Subscriptions",
      nl: "Event Inschrijvingen"
    },
    content: {
      en: `
Track company registrations and meal preferences for each event year.

**Managing Subscriptions:**
- View all companies registered for selected year
- See meal selections (breakfast, lunch, BBQ) separately for Saturday and Sunday
- Track coin distribution
- Edit preferences as needed

**Saturday Options:**
- Breakfast, Lunch, BBQ available

**Sunday Options:**
- Breakfast and Lunch (no BBQ on Sunday)

**Importing Subscriptions:**
Use CSV/Excel import for efficient bulk uploads from registration system.
      `.trim(),
      nl: `
Volg bedrijfsregistraties en maaltijdvoorkeuren per evenementjaar.

**Inschrijvingen Beheren:**
- Bekijk alle bedrijven ingeschreven voor geselecteerd jaar
- Zie maaltijdkeuzes (ontbijt, lunch, BBQ) apart voor zaterdag en zondag
- Volg muntendistributie
- Bewerk voorkeuren indien nodig

**Zaterdag Opties:**
- Ontbijt, Lunch, BBQ beschikbaar

**Zondag Opties:**
- Ontbijt en Lunch (geen BBQ op zondag)

**Inschrijvingen Importeren:**
Gebruik CSV/Excel import voor efficiënte bulk uploads vanuit registratiesysteem.
      `.trim()
    },
    updated: "2025-11-22",
    tips: {
      en: [
        "Import subscriptions at start of event planning",
        "Saturday and Sunday have different meal options",
        "Changes sync to dashboard statistics automatically"
      ],
      nl: [
        "Importeer inschrijvingen aan start van eventplanning",
        "Zaterdag en zondag hebben verschillende maaltijdopties",
        "Wijzigingen synchroniseren automatisch naar dashboard statistieken"
      ]
    }
  },

  assignments: {
    title: {
      en: "Booth Assignments",
      nl: "Standtoewijzingen"
    },
    content: {
      en: `
Assign companies to specific map locations (booth markers).

**Creating Assignments:**
1. Select event year
2. Choose company from dropdown
3. Select marker (booth) location
4. Click "Assign"

**Assignment Details:**
- Links company to physical booth location
- Displays in public map view
- Can reassign to different location if needed
- One company per booth per year

**Bulk Assignment:**
Import assignments via CSV for efficient setup.
      `.trim(),
      nl: `
Wijs bedrijven toe aan specifieke kaartlocaties (standmarkers).

**Toewijzingen Maken:**
1. Selecteer evenementjaar
2. Kies bedrijf uit dropdown
3. Selecteer marker (stand) locatie
4. Klik "Toewijzen"

**Toewijzingsdetails:**
- Koppelt bedrijf aan fysieke standlocatie
- Toont in publieke kaartweergave
- Kan hertoegewezen worden naar andere locatie indien nodig
- Eén bedrijf per stand per jaar

**Bulk Toewijzing:**
Importeer toewijzingen via CSV voor efficiënte setup.
      `.trim()
    },
    updated: "2025-11-22",
    tips: {
      en: [
        "One booth can only be assigned to one company per year",
        "Assignments are year-specific",
        "Use import for efficient bulk assignment"
      ],
      nl: [
        "Eén stand kan maar aan één bedrijf per jaar toegewezen worden",
        "Toewijzingen zijn jaar-specifiek",
        "Gebruik import voor efficiënte bulk toewijzing"
      ]
    }
  },

  settings: {
    title: {
      en: "System Settings",
      nl: "Systeeminstellingen"
    },
    content: {
      en: `
Configure system-wide settings and preferences.

**Available Settings:**
- **Organization Profile**: Logo, name, branding
- **Map Defaults**: Default layers, zoom levels
- **User Management**: Admin roles and permissions
- **Marker Defaults**: Default icons, colors, sizes
- **Event Defaults**: Saturday/Sunday meal options
- **Branding**: Colors, logo, organization name
- **Program Management**: Event schedule and activities

**Organization Logo:**
Upload your organization logo to appear:
- On map cluster markers
- In admin dashboard header
- In public map branding

**User Roles:**
- **Super Admin**: Full access to all features
- **System Manager**: Dashboard + Map Management
- **Event Manager**: Dashboard + Companies + Subscriptions + Assignments
- **Content Editor**: Program management access

**Important:**
Only Super Admins can access settings. Changes affect all users.
      `.trim(),
      nl: `
Configureer systeembrede instellingen en voorkeuren.

**Beschikbare Instellingen:**
- **Organisatieprofiel**: Logo, naam, huisstijl
- **Kaart Standaarden**: Standaardlagen, zoomniveaus
- **Gebruikersbeheer**: Admin rollen en rechten
- **Marker Standaarden**: Standaard iconen, kleuren, groottes
- **Event Standaarden**: Zaterdag/zondag maaltijdopties
- **Branding**: Kleuren, logo, organisatienaam
- **Programma Beheer**: Event schema en activiteiten

**Organisatie Logo:**
Upload je organisatie logo om te verschijnen:
- Op kaart cluster markers
- In admin dashboard header
- In publieke kaart branding

**Gebruikersrollen:**
- **Super Admin**: Volledige toegang tot alle features
- **Systeembeheerder**: Dashboard + Kaartbeheer
- **Eventbeheerder**: Dashboard + Bedrijven + Inschrijvingen + Toewijzingen
- **Content Editor**: Programma beheer toegang

**Belangrijk:**
Alleen Super Admins hebben toegang tot instellingen. Wijzigingen beïnvloeden alle gebruikers.
      `.trim()
    },
    updated: "2025-11-22",
    tips: {
      en: [
        "Only Super Admins see this section",
        "Test logo uploads in staging first",
        "Changes affect all admin users",
        "Keep user count to 5-10 for best performance"
      ],
      nl: [
        "Alleen Super Admins zien deze sectie",
        "Test logo uploads eerst in staging",
        "Wijzigingen beïnvloeden alle admin gebruikers",
        "Houd gebruikersaantal op 5-10 voor beste performance"
      ]
    }
  },

  programManagement: {
    title: {
      en: "Program Management",
      nl: "Programma Beheer"
    },
    content: {
      en: `
Manage your event schedule and activities dynamically.

**Managing Activities:**
- **Add Activity**: Click "Add Activity" to create new schedule item
- **Edit**: Click pencil icon to modify existing activity
- **Delete**: Click trash icon with confirmation
- **Reorder**: Drag activities by the ⋮⋮ handle to change order

**Activity Properties:**
- **Title & Description**: Bilingual content (NL/EN)
- **Time**: Start and end time for the activity
- **Location Type**: 
  - **Exhibitor**: Links to company booth
  - **Venue**: Static location text
- **Badge**: Optional label (e.g., "FREE ENTRY!", "Members only")
- **Display Order**: Controls sort order in schedule
- **Active Status**: Hide/show activity from public view
- **Location Badge**: Optional exhibitor/venue indicator

**Day Tabs:**
Switch between Saturday and Sunday to manage each day separately.

**Tips:**
- Drag-to-reorder updates display_order automatically
- Exhibitor activities show company name
- Venue activities use custom location text
- Inactive activities hidden from public schedule
- Location badges help highlight special activities
      `.trim(),
      nl: `
Beheer je event schema en activiteiten dynamisch.

**Activiteiten Beheren:**
- **Activiteit Toevoegen**: Klik "Activiteit Toevoegen" om nieuw schema-item te creëren
- **Bewerken**: Klik potlood icoon om bestaande activiteit te wijzigen
- **Verwijderen**: Klik prullenbak icoon met bevestiging
- **Herschikken**: Sleep activiteiten aan ⋮⋮ handvat om volgorde te wijzigen

**Activiteit Eigenschappen:**
- **Titel & Beschrijving**: Tweetalige content (NL/EN)
- **Tijd**: Start- en eindtijd voor de activiteit
- **Locatietype**: 
  - **Standhouder**: Koppelt aan bedrijfsstand
  - **Locatie**: Statische locatietekst
- **Badge**: Optioneel label (bijv. "GRATIS ENTREE!", "Alleen leden")
- **Weergavevolgorde**: Bepaalt sorteervolgorde in schema
- **Actieve Status**: Verberg/toon activiteit in publieke weergave
- **Locatie Badge**: Optionele standhouder/locatie indicator

**Dag Tabbladen:**
Wissel tussen zaterdag en zondag om elke dag apart te beheren.

**Tips:**
- Sleep-om-te-herschikken update weergavevolgorde automatisch
- Standhouder activiteiten tonen bedrijfsnaam
- Locatie activiteiten gebruiken aangepaste locatietekst
- Inactieve activiteiten verborgen in publiek schema
- Locatie badges helpen speciale activiteiten te benadrukken
      `.trim()
    },
    updated: "2025-11-22",
    tips: {
      en: [
        "Drag activities to reorder them visually",
        "Link exhibitor activities to show booth locations",
        "Use badges to highlight special activities",
        "Set activities inactive to hide from public",
        "Location badges optional - usually not needed"
      ],
      nl: [
        "Sleep activiteiten om ze visueel te herschikken",
        "Koppel standhouder activiteiten om standlocaties te tonen",
        "Gebruik badges om speciale activiteiten te benadrukken",
        "Zet activiteiten inactief om te verbergen voor publiek",
        "Locatie badges optioneel - meestal niet nodig"
      ]
    }
  },

  general: {
    title: {
      en: "Getting Started",
      nl: "Aan de Slag"
    },
    content: {
      en: `
Welcome to the Event Map Admin Panel!

**Your Role Determines Access:**
- **Super Admin**: Full access to everything
- **System Manager**: Map editing and dashboard
- **Event Manager**: Company and subscription management
- **Content Editor**: Program management access

**Common Workflows:**

**1. Setting Up a New Event Year:**
- Add/update companies in Companies tab
- Import subscriptions for new year
- Assign companies to map locations
- Update event schedule in Program Management

**2. Managing Map:**
- Place markers for booths, parking, facilities
- Adjust visibility by zoom level
- Lock markers before event goes live

**3. Managing Event Program:**
- Add/edit activities in Settings → Program Management
- Link exhibitor activities to company booths
- Drag-to-reorder for easy scheduling
- Set activities active/inactive to control visibility

**4. Day-of-Event:**
- Lock all markers to prevent accidents
- Monitor assignments in real-time
- Public map and schedule update automatically

**Need Help?**
- Hover over (?) icons for quick tips
- Check "What's New" for recent changes
- Contact system administrator for access issues
      `.trim(),
      nl: `
Welkom bij het Event Kaart Admin Paneel!

**Je Rol Bepaalt Toegang:**
- **Super Admin**: Volledige toegang tot alles
- **Systeembeheerder**: Kaartbewerking en dashboard
- **Eventbeheerder**: Bedrijven- en inschrijvingsbeheer
- **Content Editor**: Programma beheer toegang

**Veelvoorkomende Workflows:**

**1. Nieuw Evenementjaar Instellen:**
- Voeg bedrijven toe/update in Bedrijven tab
- Importeer inschrijvingen voor nieuw jaar
- Wijs bedrijven toe aan kaartlocaties
- Update event schema in Programma Beheer

**2. Kaart Beheren:**
- Plaats markers voor stands, parkeren, faciliteiten
- Pas zichtbaarheid aan per zoomniveau
- Vergrendel markers voor event go-live

**3. Event Programma Beheren:**
- Voeg activiteiten toe/bewerk in Instellingen → Programma Beheer
- Koppel standhouder activiteiten aan bedrijfsstands
- Sleep-om-te-herschikken voor eenvoudig plannen
- Zet activiteiten actief/inactief om zichtbaarheid te regelen

**4. Dag-van-Event:**
- Vergrendel alle markers om ongelukken te voorkomen
- Monitor toewijzingen real-time
- Publieke kaart en schema updaten automatisch

**Hulp Nodig?**
- Hover over (?) iconen voor snelle tips
- Check "Wat is Nieuw" voor recente wijzigingen
- Neem contact op met systeembeheerder voor toegangsproblemen
      `.trim()
    },
    updated: "2025-11-22",
    tips: {
      en: [
        "Start with dashboard to understand current status",
        "Use year selector to switch between events",
        "Lock markers before going live",
        "Import data saves time vs manual entry",
        "Program management updates public schedule instantly"
      ],
      nl: [
        "Start met dashboard om huidige status te begrijpen",
        "Gebruik jaarselector om tussen events te wisselen",
        "Vergrendel markers voor go-live",
        "Data importeren bespaart tijd vs handmatige invoer",
        "Programma beheer update publiek schema instant"
      ]
    }
  }
};

/**
 * Get help content for a specific page
 * @param {string} page - Page identifier (dashboard, mapManagement, etc.)
 * @param {string} language - Language code ('en' or 'nl')
 * @returns {object} Help content object with localized strings
 */
export function getHelpContent(page, language = 'en') {
  const content = helpContentBilingual[page] || helpContentBilingual.general;
  
  return {
    title: content.title[language] || content.title.en,
    content: content.content[language] || content.content.en,
    updated: content.updated,
    tips: content.tips[language] || content.tips.en
  };
}

/**
 * Get help content based on current route
 * @param {string} pathname - Current route pathname
 * @param {string} language - Language code ('en' or 'nl')
 * @returns {object} Help content object with localized strings
 */
export function getHelpContentByRoute(pathname, language = 'en') {
  const routeMap = {
    '/admin': 'dashboard',
    '/admin/map': 'mapManagement',
    '/admin/companies': 'companies',
    '/admin/subscriptions': 'subscriptions',
    '/admin/assignments': 'assignments',
    '/admin/settings': 'settings',
    '/admin/settings/program': 'programManagement',
  };

  const page = routeMap[pathname] || 'general';
  return getHelpContent(page, language);
}

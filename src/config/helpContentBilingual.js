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
Manage your permanent exhibitor company database. Companies are reusable across all event years, making setup faster for recurring events.

**Two-Tab Interface:**
The Companies page features a dual-view design for organizing information:

**Public Info Tab** (Blue) 🔓 *All Roles*
View public-facing information visible to event attendees:
- Company Name
- Logo (image display)
- Website (clickable link)
- Info (multi-language descriptions with language indicators)
- Categories (color-coded tags)

**Private Info Tab** (Green) 🔓 *All Roles*
View manager-only contact information (not public):
- Company Name
- Contact Person
- Phone (with flag indicator)
- Email

Toggle between tabs to see different aspects of company data. Both tabs show the same companies, just different fields.

**Search & Filtering** 🔓 *All Roles*
Quickly find specific companies:
- **Search Bar**: Type company name to filter list in real-time
- **Result Count**: Shows "X of Y" companies matching search
- **Case-Insensitive**: Search works with any capitalization
- **Organization Profile**: Always included in list (dark gray row)

**Multi-Language Info Field** 🔑 *Event Manager+*
Companies support rich descriptions in three languages:
- **Supported Languages**: Nederlands (NL), English (EN), Deutsch (DE)
- **Language Tabs**: Switch between languages when editing
- **Auto-Save**: Translations save automatically on blur (no save button needed)
- **Language Indicator**: Small badges show which languages have content (visible in table)
- **Fallback Logic**: If user's language not available, falls back to Dutch

**How to Add Translations:**
1. Click "Edit" on a company row
2. In the Public Info section, find "Info (Multi-language)"
3. Click NL, EN, or DE tab
4. Enter description text for that language
5. Click away from textarea to auto-save
6. Switch to another language tab and repeat

**Language Indicator Badges:**
Small colored badges appear next to company info in the table:
- NL flag for Dutch content
- EN flag for English content
- DE flag for German content
Multiple badges indicate content available in multiple languages.

**Category Assignment** 🔑 *Event Manager+*
Organize companies into categories for filtering and organization:
- **Assign Categories**: Check/uncheck categories when editing company
- **Multiple Categories**: Companies can belong to multiple categories
- **Color-Coded Tags**: Each category has a unique color and optional icon
- **Table Display**: Categories shown as small colored badges in the table
- **Filtering**: Use categories to filter company lists (future feature)

**How to Assign Categories:**
1. Click "Edit" on a company row
2. Scroll to "Categories" section in Public Info
3. Check boxes for applicable categories (e.g., "Food & Beverage", "Technology")
4. Categories show colored backgrounds based on selection
5. Click "Save" to apply category assignments

**Note**: Categories must first be created in Settings > Category Settings (System Manager+ only).

**Logo Management** 🔑 *Event Manager+*
Upload company logos for public display:
- **Upload Method**: Click "Upload Logo" to select file from computer
- **Manual URL**: Alternatively, paste logo URL in text field below uploader
- **Preview**: See logo preview immediately after upload
- **Delete**: Remove logo to fall back to organization default logo
- **Supported Formats**: PNG (recommended for transparency), JPG, SVG
- **Display Locations**: Company info cards, map markers, public booth view
- **Fallback**: Companies without logos use organization default logo

**Logo Best Practices:**
- Use square logos (200x200px or larger) for best results
- Transparent backgrounds (PNG) work best for map markers
- Keep file sizes under 500KB for fast loading
- Consistent style across all company logos improves professional appearance

**Phone Number Formatting** 🔑 *Event Manager+*
Phone numbers are automatically formatted and validated:
- **International Format**: Enter with country code (e.g., +31612345678)
- **Flag Display**: Country flag emoji automatically shown based on code
- **Validation**: Invalid formats highlighted in red
- **Formatting**: Numbers formatted for readability (e.g., +31 6 12345678)
- **Use in Subscriptions**: Company phone used as default for new subscriptions

**Email Standardization** 🔑 *Event Manager+*
Email addresses are automatically normalized:
- **Lowercase**: All emails converted to lowercase on save
- **Validation**: Basic format validation before saving
- **Use in Subscriptions**: Company email used as default for new subscriptions

**Adding New Companies** 🔑 *Event Manager+*
Create new exhibitor entries:
1. Click "Add Company" button (top-right, blue with + icon)
2. Fill in Public Info section:
   - Company Name (required, must be unique)
   - Upload or paste logo URL
   - Enter website URL
   - Add info description (initial language only, translate later)
3. Fill in Manager-Only Info section:
   - Contact Person name
   - Phone number with country code
   - Email address
4. Click "Create" to save new company

**Note**: When creating, you can only enter one language for info. Edit the company after creation to add additional language translations.

**Editing Companies** 🔑 *Event Manager+*
Modify existing company information:
1. Click "Edit" button (blue pencil icon) on any company row
2. Update fields in modal dialog (same structure as adding)
3. Edit multi-language info by switching language tabs
4. Assign/unassign categories via checkboxes
5. Upload new logo or update URL
6. Click "Save" to apply changes (auto-closes modal)

**Changes save immediately** to the database and sync across all admin users in real-time.

**Deleting Companies** 🔑 *Event Manager+*
Remove companies no longer participating:
1. Click "Delete" button (red trash icon) on company row
2. Confirm deletion in dialog prompt
3. Company removed from database permanently
4. **Warning**: This also deletes all subscriptions and assignments for this company across all years

**Safety Check**: System prompts for confirmation before deleting. Consider if company might return in future years before deleting.

**Organization Profile** 🔑 *Event Manager+*
The first row (dark gray background) represents your organization:
- **Always Displayed**: Cannot be hidden or deleted
- **Editable**: Click "Edit" to update organization info
- **No Categories**: Organization profile doesn't use category system (N/A shown)
- **Public Logo**: Organization logo used for companies without their own logos
- **Public Info**: Used in branding throughout the application

**Import & Export** 🔑 *Event Manager+*
Efficiently manage bulk company data:

**Exporting Companies:**
1. Click "Export" button (green with download icon)
2. Downloads Excel file with all companies
3. Includes: Name, Logo URL, Website, Info, Contact, Phone, Email
4. Use for backups, reporting, or external processing

**Importing Companies:**
1. Click "Import" button (blue with upload icon)
2. Select Excel (.xlsx) or CSV file with company data
3. **Preview Step**: Review parsed data before importing
4. **Match Existing**: System matches by company name to update existing companies
5. **Create New**: Non-matching companies added as new entries
6. Select which rows to import (check/uncheck)
7. Click "Import Selected" to process

**Import File Format:**
- Column headers must match export format exactly
- Company Name required (used for matching)
- Phone numbers: Use international format with country code
- Logos: Provide full URLs or upload separately after import
- Multi-language info: Initial import uses one language (translate in UI later)

**Best Practices:**

**Data Hygiene:**
- Keep company names consistent across years
- Update contact information regularly (especially phone/email)
- Add translations for all active exhibitors to improve attendee experience
- Assign categories to enable future filtering features
- Use high-quality logos for professional appearance

**Workflow Recommendations:**
- Import companies at start of event planning season
- Add multi-language info during quieter periods (improves public map experience)
- Export regularly for backup purposes
- Use search when list grows beyond 50+ companies
- Review and clean up inactive companies annually

**Common Scenarios:**

**Scenario 1: Setting Up for New Event (Recurring Exhibitors)**
1. Export companies from previous year as backup
2. Review company list for accuracy (names, contacts)
3. Update contact information for any known changes
4. Add new participating companies via "Add Company"
5. Assign categories to all companies for organization
6. Add/update multi-language info for international attendees

**Scenario 2: Bulk Company Import (New Event or Migration)**
1. Prepare Excel file with columns: Name, Website, Contact, Phone, Email
2. Use international phone format (+31612345678)
3. Click "Import" and select file
4. Review preview to verify parsing
5. Select all rows (or uncheck any with errors)
6. Click "Import Selected"
7. After import, edit companies individually to add logos and multi-language info

**Scenario 3: Updating Company Information Mid-Event**
1. Navigate to Companies tab
2. Switch to appropriate tab (Public or Private info)
3. Search for company if needed
4. Click "Edit" on company row
5. Update changed information
6. Click "Save" (syncs immediately to all users)
      `.trim(),
      nl: `
Beheer je permanente exposanten database. Bedrijven zijn herbruikbaar over alle evenementjaren, wat setup sneller maakt voor terugkerende events.

**Twee-Tabblad Interface:**
De Bedrijven pagina heeft een duaal-view ontwerp voor het organiseren van informatie:

**Publieke Info Tabblad** (Blauw) 🔓 *Alle Rollen*
Bekijk publieke informatie zichtbaar voor evenementbezoekers:
- Bedrijfsnaam
- Logo (afbeelding weergave)
- Website (klikbare link)
- Info (meertalige beschrijvingen met taal indicatoren)
- Categorieën (kleurgecodeerde tags)

**Privé Info Tabblad** (Groen) 🔓 *Alle Rollen*
Bekijk alleen-beheerder contactinformatie (niet publiek):
- Bedrijfsnaam
- Contactpersoon
- Telefoon (met vlag indicator)
- Email

Schakel tussen tabbladen om verschillende aspecten van bedrijfsdata te zien. Beide tabbladen tonen dezelfde bedrijven, alleen verschillende velden.

**Zoeken & Filteren** 🔓 *Alle Rollen*
Vind specifieke bedrijven snel:
- **Zoekbalk**: Type bedrijfsnaam om lijst real-time te filteren
- **Resultaat Telling**: Toont "X van Y" bedrijven die matchen met zoekopdracht
- **Hoofdletterongevoelig**: Zoeken werkt met elke hoofdlettergebruik
- **Organisatieprofiel**: Altijd opgenomen in lijst (donkergrijze rij)

**Meertalig Info Veld** 🔑 *Event Manager+*
Bedrijven ondersteunen rijke beschrijvingen in drie talen:
- **Ondersteunde Talen**: Nederlands (NL), English (EN), Deutsch (DE)
- **Taal Tabbladen**: Schakel tussen talen tijdens bewerken
- **Auto-Opslaan**: Vertalingen slaan automatisch op bij blur (geen opslaan knop nodig)
- **Taal Indicator**: Kleine badges tonen welke talen content hebben (zichtbaar in tabel)
- **Fallback Logica**: Als gebruikerstaal niet beschikbaar is, valt terug op Nederlands

**Hoe Vertalingen Toevoegen:**
1. Klik "Bewerken" op een bedrijfsrij
2. Zoek in de Publieke Info sectie "Info (Meertalig)"
3. Klik NL, EN of DE tabblad
4. Voer beschrijvingstekst in voor die taal
5. Klik weg van textarea om auto op te slaan
6. Schakel naar ander taal tabblad en herhaal

**Taal Indicator Badges:**
Kleine gekleurde badges verschijnen naast bedrijfsinfo in de tabel:
- NL vlag voor Nederlandse content
- EN vlag voor Engelse content
- DE vlag voor Duitse content
Meerdere badges geven aan dat content in meerdere talen beschikbaar is.

**Categorie Toewijzing** 🔑 *Event Manager+*
Organiseer bedrijven in categorieën voor filtering en organisatie:
- **Wijs Categorieën Toe**: Vink categorieën aan/uit tijdens bewerken bedrijf
- **Meerdere Categorieën**: Bedrijven kunnen tot meerdere categorieën behoren
- **Kleurgecodeerde Tags**: Elke categorie heeft unieke kleur en optioneel icoon
- **Tabel Weergave**: Categorieën getoond als kleine gekleurde badges in tabel
- **Filtering**: Gebruik categorieën om bedrijfslijsten te filteren (toekomstige feature)

**Hoe Categorieën Toewijzen:**
1. Klik "Bewerken" op een bedrijfsrij
2. Scroll naar "Categorieën" sectie in Publieke Info
3. Vink vakjes aan voor toepasselijke categorieën (bijv. "Food & Beverage", "Technologie")
4. Categorieën tonen gekleurde achtergronden gebaseerd op selectie
5. Klik "Opslaan" om categorie toewijzingen toe te passen

**Opmerking**: Categorieën moeten eerst gemaakt worden in Instellingen > Categorie Instellingen (alleen System Manager+).

**Logo Beheer** 🔑 *Event Manager+*
Upload bedrijfslogo's voor publieke weergave:
- **Upload Methode**: Klik "Upload Logo" om bestand van computer te selecteren
- **Handmatige URL**: Alternatief, plak logo URL in tekstveld onder uploader
- **Voorbeeld**: Zie logo voorbeeld direct na upload
- **Verwijderen**: Verwijder logo om terug te vallen op organisatie standaard logo
- **Ondersteunde Formaten**: PNG (aanbevolen voor transparantie), JPG, SVG
- **Weergave Locaties**: Bedrijfsinfo kaarten, kaart markers, publieke standweergave
- **Fallback**: Bedrijven zonder logo's gebruiken organisatie standaard logo

**Logo Best Practices:**
- Gebruik vierkante logo's (200x200px of groter) voor beste resultaten
- Transparante achtergronden (PNG) werken best voor kaart markers
- Houd bestandsgroottes onder 500KB voor snelle laadtijd
- Consistente stijl over alle bedrijfslogo's verbetert professionele uitstraling

**Telefoonnummer Formatting** 🔑 *Event Manager+*
Telefoonnummers worden automatisch geformatteerd en gevalideerd:
- **Internationaal Formaat**: Voer in met landcode (bijv. +31612345678)
- **Vlag Weergave**: Land vlag emoji automatisch getoond gebaseerd op code
- **Validatie**: Ongeldige formaten gemarkeerd in rood
- **Formatting**: Nummers geformatteerd voor leesbaarheid (bijv. +31 6 12345678)
- **Gebruik in Inschrijvingen**: Bedrijfstelefoon gebruikt als standaard voor nieuwe inschrijvingen

**Email Standaardisatie** 🔑 *Event Manager+*
Email adressen worden automatisch genormaliseerd:
- **Kleine Letters**: Alle emails omgezet naar kleine letters bij opslaan
- **Validatie**: Basis formaat validatie voor opslaan
- **Gebruik in Inschrijvingen**: Bedrijfsemail gebruikt als standaard voor nieuwe inschrijvingen

**Nieuwe Bedrijven Toevoegen** 🔑 *Event Manager+*
Creëer nieuwe exposant entries:
1. Klik "Bedrijf Toevoegen" knop (rechts-boven, blauw met + icoon)
2. Vul Publieke Info sectie in:
   - Bedrijfsnaam (verplicht, moet uniek zijn)
   - Upload of plak logo URL
   - Voer website URL in
   - Voeg info beschrijving toe (initiële taal alleen, vertaal later)
3. Vul Alleen-Beheerder Info sectie in:
   - Contactpersoon naam
   - Telefoonnummer met landcode
   - Email adres
4. Klik "Creëer" om nieuw bedrijf op te slaan

**Opmerking**: Bij creëren kun je slechts één taal invoeren voor info. Bewerk het bedrijf na creatie om extra taal vertalingen toe te voegen.

**Bedrijven Bewerken** 🔑 *Event Manager+*
Wijzig bestaande bedrijfsinformatie:
1. Klik "Bewerken" knop (blauw potlood icoon) op bedrijfsrij
2. Update velden in modal dialoog (zelfde structuur als toevoegen)
3. Bewerk meertalige info door taal tabbladen te wisselen
4. Wijs categorieën toe/ongedaan via checkboxes
5. Upload nieuw logo of update URL
6. Klik "Opslaan" om wijzigingen toe te passen (sluit automatisch modal)

**Wijzigingen slaan direct op** naar de database en synchroniseren over alle admin gebruikers in real-time.

**Bedrijven Verwijderen** 🔑 *Event Manager+*
Verwijder bedrijven die niet langer deelnemen:
1. Klik "Verwijderen" knop (rode prullenbak icoon) op bedrijfsrij
2. Bevestig verwijdering in dialoog prompt
3. Bedrijf permanent verwijderd uit database
4. **Waarschuwing**: Dit verwijdert ook alle inschrijvingen en toewijzingen voor dit bedrijf over alle jaren

**Veiligheidscheck**: Systeem vraagt om bevestiging voor verwijderen. Overweeg of bedrijf mogelijk terugkeert in toekomstige jaren voordat je verwijdert.

**Organisatieprofiel** 🔑 *Event Manager+*
De eerste rij (donkergrijze achtergrond) representeert je organisatie:
- **Altijd Weergegeven**: Kan niet verborgen of verwijderd worden
- **Bewerkbaar**: Klik "Bewerken" om organisatie info bij te werken
- **Geen Categorieën**: Organisatieprofiel gebruikt geen categoriesysteem (N/A getoond)
- **Publiek Logo**: Organisatie logo gebruikt voor bedrijven zonder eigen logo's
- **Publieke Info**: Gebruikt in branding door de hele applicatie

**Import & Export** 🔑 *Event Manager+*
Beheer efficiënt bulk bedrijfsdata:

**Bedrijven Exporteren:**
1. Klik "Exporteren" knop (groen met download icoon)
2. Download Excel bestand met alle bedrijven
3. Bevat: Naam, Logo URL, Website, Info, Contact, Telefoon, Email
4. Gebruik voor backups, rapportage of externe verwerking

**Bedrijven Importeren:**
1. Klik "Importeren" knop (blauw met upload icoon)
2. Selecteer Excel (.xlsx) of CSV bestand met bedrijfsdata
3. **Voorbeeld Stap**: Review geparsete data voor importeren
4. **Match Bestaande**: Systeem matcht op bedrijfsnaam om bestaande bedrijven bij te werken
5. **Creëer Nieuwe**: Niet-matchende bedrijven toegevoegd als nieuwe entries
6. Selecteer welke rijen te importeren (aan/uitvinken)
7. Klik "Importeer Geselecteerde" om te verwerken

**Import Bestand Formaat:**
- Kolom headers moeten exact matchen met export formaat
- Bedrijfsnaam verplicht (gebruikt voor matching)
- Telefoonnummers: Gebruik internationaal formaat met landcode
- Logo's: Geef volledige URLs of upload apart na import
- Meertalige info: Initiële import gebruikt één taal (vertaal in UI later)

**Best Practices:**

**Data Hygiëne:**
- Houd bedrijfsnamen consistent over jaren
- Update contactinformatie regelmatig (vooral telefoon/email)
- Voeg vertalingen toe voor alle actieve exposanten om bezoeker ervaring te verbeteren
- Wijs categorieën toe om toekomstige filter features mogelijk te maken
- Gebruik hoge kwaliteit logo's voor professionele uitstraling

**Workflow Aanbevelingen:**
- Importeer bedrijven aan begin van event planning seizoen
- Voeg meertalige info toe tijdens rustigere periodes (verbetert publieke kaart ervaring)
- Exporteer regelmatig voor backup doeleinden
- Gebruik zoeken wanneer lijst groeit boven 50+ bedrijven
- Review en ruim inactieve bedrijven jaarlijks op

**Veelvoorkomende Scenario's:**

**Scenario 1: Opzetten voor Nieuw Event (Terugkerende Exposanten)**
1. Exporteer bedrijven van vorig jaar als backup
2. Review bedrijvenlijst voor accuraatheid (namen, contacten)
3. Update contactinformatie voor bekende wijzigingen
4. Voeg nieuwe deelnemende bedrijven toe via "Bedrijf Toevoegen"
5. Wijs categorieën toe aan alle bedrijven voor organisatie
6. Voeg meertalige info toe/update voor internationale bezoekers

**Scenario 2: Bulk Bedrijven Import (Nieuw Event of Migratie)**
1. Bereid Excel bestand voor met kolommen: Naam, Website, Contact, Telefoon, Email
2. Gebruik internationaal telefoonformaat (+31612345678)
3. Klik "Importeren" en selecteer bestand
4. Review voorbeeld om parsing te verifiëren
5. Selecteer alle rijen (of vink rijen met fouten uit)
6. Klik "Importeer Geselecteerde"
7. Na import, bewerk bedrijven individueel om logo's en meertalige info toe te voegen

**Scenario 3: Bedrijfsinformatie Bijwerken Midden-Event**
1. Navigeer naar Bedrijven tabblad
2. Schakel naar passend tabblad (Publieke of Privé info)
3. Zoek bedrijf indien nodig
4. Klik "Bewerken" op bedrijfsrij
5. Update gewijzigde informatie
6. Klik "Opslaan" (synchroniseert direct naar alle gebruikers)
      `.trim()
    },
    updated: "2025-12-02",
    tips: {
      en: [
        "Add multi-language info to improve attendee experience for international visitors",
        "Use categories consistently to enable future filtering features",
        "Upload square transparent PNG logos for best map marker display",
        "Phone numbers auto-format but must include country code (+31...)",
        "Export companies regularly as backup before major changes"
      ],
      nl: [
        "Voeg meertalige info toe om bezoeker ervaring te verbeteren voor internationale bezoekers",
        "Gebruik categorieën consistent om toekomstige filter features mogelijk te maken",
        "Upload vierkante transparante PNG logo's voor beste kaart marker weergave",
        "Telefoonnummers auto-formatteren maar moeten landcode bevatten (+31...)",
        "Exporteer bedrijven regelmatig als backup voor grote wijzigingen"
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
Track company registrations, meal preferences, and booth assignments for each event year.

**Viewing Subscriptions** 🔓 *All Roles*
- See all companies registered for the selected year
- View booth assignments directly in the subscriptions table
- Track meal counts for Saturday and Sunday separately
- Monitor coin distribution across companies
- Use search to filter companies by name

**Booth Display** 🔓 *All Roles*
Each subscription row shows the assigned booth location(s):
- Displays actual booth labels (e.g., "A1, A2, A3")
- Shows "-" for companies not yet assigned to booths
- Updates automatically when booth assignments change
- Click to quickly navigate to assignments tab for reassignment

**Sorting & Filtering** 🔓 *All Roles*
Organize your view with powerful sorting options:
- **Sort by Company Name**: Alphabetical A-Z or Z-A
- **Sort by Booth Requirements**: Group by booth count
- **Search Bar**: Filter companies by name in real-time
- Sort preferences persist across sessions

**Managing Meal Preferences:**
Track catering requirements separately for each day:

**Saturday Options:**
- Breakfast, Lunch, BBQ available
- Common for main event day activities

**Sunday Options:**
- Breakfast and Lunch (no BBQ on Sunday)
- Typically lower attendance

**Adding/Editing Subscriptions** 🔑 *Event Manager+*
1. Click "Subscribe Company" to add new registration
2. Select company from available list
3. Click existing row to open edit modal
4. Modify meal counts, booth requirements, contact info
5. Changes save automatically to database

**Archive Current Year** 🔒 *Super Admin Only*
When an event year is complete:
1. Click "Archive [Year]" button
2. Confirm the archive operation
3. All subscriptions moved to archive table
4. Booth assignments also archived
5. Historical data preserved for reference

**Copy From Previous Year** 🔑 *Event Manager+*
Quickly setup recurring events:
1. Click "Copy from [Previous Year]" button
2. System copies all company subscriptions from prior year
3. Meal counts reset to organization defaults
4. Contact information carried over
5. Booth assignments must be reassigned manually

**Import & Export** 🔑 *Event Manager+*
Efficiently manage bulk data:

**Exporting:**
- Click "Export" to download all subscriptions as Excel
- File includes: Company, Booths, Saturday meals, Sunday meals, Contact info
- Useful for meal planning and logistics

**Importing:**
- Click "Import" to upload Excel/CSV file
- System validates data and shows preview
- Select rows to import (create new or update existing)
- Preview shows booth assignments for context

**Best Practices:**
- Import subscriptions at start of event planning
- Update meal counts as registrations change
- Use "Copy from Previous Year" for recurring events with same exhibitors
- Archive completed years to keep system organized
- Export regularly for backup and reporting
      `.trim(),
      nl: `
Volg bedrijfsregistraties, maaltijdvoorkeuren en standtoewijzingen per evenementjaar.

**Inschrijvingen Bekijken** 🔓 *Alle Rollen*
- Zie alle bedrijven ingeschreven voor het geselecteerde jaar
- Bekijk standtoewijzingen direct in de inschrijvingstabel
- Volg maaltijdaantallen voor zaterdag en zondag apart
- Monitor muntendistributie over bedrijven
- Gebruik zoeken om bedrijven op naam te filteren

**Stand Weergave** 🔓 *Alle Rollen*
Elke inschrijvingsrij toont de toegewezen standlocatie(s):
- Toont werkelijke standlabels (bijv. "A1, A2, A3")
- Toont "-" voor bedrijven nog niet toegewezen aan stands
- Update automatisch wanneer standtoewijzingen wijzigen
- Klik om snel naar toewijzingen tab te navigeren voor hertoewijzing

**Sorteren & Filteren** 🔓 *Alle Rollen*
Organiseer je weergave met krachtige sorteeropties:
- **Sorteer op Bedrijfsnaam**: Alfabetisch A-Z of Z-A
- **Sorteer op Standvereisten**: Groepeer op aantal stands
- **Zoekbalk**: Filter bedrijven op naam in real-time
- Sorteervoorkeuren blijven behouden over sessies

**Maaltijdvoorkeuren Beheren:**
Volg catering vereisten apart voor elke dag:

**Zaterdag Opties:**
- Ontbijt, Lunch, BBQ beschikbaar
- Gebruikelijk voor hoofdeventdag activiteiten

**Zondag Opties:**
- Ontbijt en Lunch (geen BBQ op zondag)
- Typisch lagere opkomst

**Inschrijvingen Toevoegen/Bewerken** 🔑 *Event Manager+*
1. Klik "Bedrijf Inschrijven" om nieuwe registratie toe te voegen
2. Selecteer bedrijf uit beschikbare lijst
3. Klik bestaande rij om bewerkingsmodal te openen
4. Wijzig maaltijdaantallen, standvereisten, contactinfo
5. Wijzigingen slaan automatisch op naar database

**Huidig Jaar Archiveren** 🔒 *Alleen Super Admin*
Wanneer een evenementjaar compleet is:
1. Klik "Archiveer [Jaar]" knop
2. Bevestig de archiveringsoperatie
3. Alle inschrijvingen verplaatst naar archieftabel
4. Standtoewijzingen ook gearchiveerd
5. Historische data behouden voor referentie

**Kopiëren van Vorig Jaar** 🔑 *Event Manager+*
Stel snel terugkerende events in:
1. Klik "Kopiëren van [Vorig Jaar]" knop
2. Systeem kopieert alle bedrijfsinschrijvingen van vorig jaar
3. Maaltijdaantallen resetten naar organisatiestandaarden
4. Contactinformatie wordt overgenomen
5. Standtoewijzingen moeten handmatig opnieuw toegewezen worden

**Importeren & Exporteren** 🔑 *Event Manager+*
Beheer efficiënt bulkdata:

**Exporteren:**
- Klik "Exporteren" om alle inschrijvingen als Excel te downloaden
- Bestand bevat: Bedrijf, Stands, Zaterdag maaltijden, Zondag maaltijden, Contactinfo
- Handig voor maaltijdplanning en logistiek

**Importeren:**
- Klik "Importeren" om Excel/CSV bestand te uploaden
- Systeem valideert data en toont voorbeeld
- Selecteer rijen om te importeren (nieuw aanmaken of bestaande bijwerken)
- Voorbeeld toont standtoewijzingen voor context

**Aanbevolen Werkwijze:**
- Importeer inschrijvingen aan start van eventplanning
- Update maaltijdaantallen wanneer registraties wijzigen
- Gebruik "Kopiëren van Vorig Jaar" voor terugkerende events met dezelfde exposanten
- Archiveer voltooide jaren om systeem georganiseerd te houden
- Exporteer regelmatig voor backup en rapportage
      `.trim()
    },
    updated: "2025-12-02",
    tips: {
      en: [
        "Booth display updates automatically when assignments change",
        "Sort by booth requirements to identify unassigned companies",
        "Use Copy from Previous Year for events with recurring exhibitors",
        "Archive completed years to keep active data manageable",
        "Export before making bulk changes as backup"
      ],
      nl: [
        "Standweergave update automatisch wanneer toewijzingen wijzigen",
        "Sorteer op standvereisten om niet-toegewezen bedrijven te identificeren",
        "Gebruik Kopiëren van Vorig Jaar voor events met terugkerende exposanten",
        "Archiveer voltooide jaren om actieve data beheersbaar te houden",
        "Exporteer voor bulkwijzigingen als backup"
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
Manage booth-to-company assignments using a powerful matrix grid interface.

**Matrix Grid Layout** 🔓 *All Roles*
The assignments page displays a grid for easy visualization:
- **Rows**: Subscribed companies for the selected year
- **Columns**: Booth markers (excludes parking and facilities)
- **Cells**: Checkboxes showing assignment status
- **Assignment Badges**: Shows total booths assigned per company
- Green checkmarks = Assigned, Empty = Available

**Company Sorting (Rows)** 🔓 *All Roles*
Organize companies with three powerful sort options:

1. **Alphabetic**: Sort by company name A-Z or Z-A
   - Standard alphabetical sorting
   - Easy to find specific companies

2. **By Marker**: Sort by lowest booth number assigned
   - Groups companies by their booth locations
   - Unassigned companies appear last
   - Useful for physical floor planning

3. **Unassigned First**: Prioritize companies without booths
   - Unassigned companies at top of list
   - Perfect for completing assignments efficiently
   - Assigned companies sorted by booth number below

**Column Sorting (Booths)** 🔓 *All Roles*
Control how booth columns are organized:

- **Marker ID**: Sort by internal marker ID (numerical)
- **Glyph Text**: Sort by booth label text (e.g., A1, A2, B1)
- **Direction**: Ascending or descending order
- Useful for different floor layouts and numbering schemes

**Preference Persistence** 🔓 *All Roles*
Your sort preferences automatically save:
- Stored in database per user account
- Syncs across all your admin sessions
- Falls back to browser localStorage if needed
- Changes persist when switching years

**Creating Assignments** 🔑 *Event Manager+*
Assign companies to booths efficiently:
1. Locate company row (use search if needed)
2. Click checkbox in desired booth column
3. Green checkmark appears - assignment complete
4. Displays immediately in subscriptions tab

**Reassigning Booths** 🔑 *Event Manager+*
Change booth assignments easily:
1. Uncheck current booth (removes assignment)
2. Check new booth (creates new assignment)
3. Or use bulk import to reassign many at once

**Search & Filter** 🔓 *All Roles*
- Type company name to filter rows
- Reduces visual clutter with many companies
- Search persists while navigating grid

**Assignment Rules:**
- One company per booth per year (enforced)
- Company must be subscribed to year first
- Unassign by unchecking the box
- Bulk operations via import/export

**Archive & Restore** 🔒 *Super Admin Only*
Preserve completed event assignments:

**Archiving:**
1. Click "Archive [Year]" button
2. Confirm the archive operation
3. All assignments for year moved to archive
4. Creates historical record for reference
5. Clears active assignments for fresh start

**Viewing Archived:**
1. Click "View Archived Assignments"
2. Select year from archive list
3. View read-only assignments from past events
4. Useful for planning recurring events

**Import & Export** 🔑 *Event Manager+*
Bulk assignment management:

**Exporting:**
- Downloads current assignments as Excel
- Includes: Company Name, Booth Label, Marker ID
- Useful for floor plans and logistics

**Importing:**
- Upload Excel/CSV with assignments
- System validates company and marker existence
- Preview before committing changes
- Efficient for initial setup or bulk changes

**Best Practices:**
- Start with "Unassigned First" sort to complete all assignments
- Use "By Marker" sort for floor planning and layout verification
- Search for specific companies in large events
- Export before making bulk changes (backup)
- Archive completed years annually to keep system organized
      `.trim(),
      nl: `
Beheer stand-naar-bedrijf toewijzingen met een krachtige matrix grid interface.

**Matrix Grid Layout** 🔓 *Alle Rollen*
De toewijzingenpagina toont een grid voor eenvoudige visualisatie:
- **Rijen**: Ingeschreven bedrijven voor het geselecteerde jaar
- **Kolommen**: Standmarkers (parkeren en faciliteiten uitgesloten)
- **Cellen**: Selectievakjes die toewijzingsstatus tonen
- **Toewijzingsbadges**: Toont totaal toegewezen stands per bedrijf
- Groene vinkjes = Toegewezen, Leeg = Beschikbaar

**Bedrijven Sorteren (Rijen)** 🔓 *Alle Rollen*
Organiseer bedrijven met drie krachtige sorteeropties:

1. **Alfabetisch**: Sorteer op bedrijfsnaam A-Z of Z-A
   - Standaard alfabetische sortering
   - Makkelijk specifieke bedrijven vinden

2. **Op Marker**: Sorteer op laagste toegewezen standnummer
   - Groepeert bedrijven per standlocatie
   - Niet-toegewezen bedrijven verschijnen laatst
   - Handig voor fysieke plattegrondplanning

3. **Niet-toegewezen Eerst**: Prioriteer bedrijven zonder stands
   - Niet-toegewezen bedrijven bovenaan lijst
   - Perfect voor efficiënt voltooien van toewijzingen
   - Toegewezen bedrijven gesorteerd op standnummer eronder

**Kolom Sorteren (Stands)** 🔓 *Alle Rollen*
Bepaal hoe standkolommen georganiseerd zijn:

- **Marker ID**: Sorteer op interne marker ID (numeriek)
- **Glyph Tekst**: Sorteer op standlabel tekst (bijv. A1, A2, B1)
- **Richting**: Oplopend of aflopend
- Handig voor verschillende plattegrondindelingen en nummeringssystemen

**Voorkeur Persistentie** 🔓 *Alle Rollen*
Je sorteervoorkeuren slaan automatisch op:
- Opgeslagen in database per gebruikersaccount
- Synchroniseert over al je admin sessies
- Valt terug op browser localStorage indien nodig
- Wijzigingen blijven behouden bij wisselen van jaren

**Toewijzingen Maken** 🔑 *Event Manager+*
Wijs bedrijven efficiënt toe aan stands:
1. Zoek bedrijfsrij (gebruik zoeken indien nodig)
2. Klik selectievakje in gewenste standkolom
3. Groen vinkje verschijnt - toewijzing voltooid
4. Toont onmiddellijk in inschrijvingen tab

**Stands Hertoewijzen** 🔑 *Event Manager+*
Wijzig standtoewijzingen eenvoudig:
1. Deselecteer huidige stand (verwijdert toewijzing)
2. Selecteer nieuwe stand (maakt nieuwe toewijzing)
3. Of gebruik bulk import om veel in één keer te hertoewijzen

**Zoeken & Filteren** 🔓 *Alle Rollen*
- Typ bedrijfsnaam om rijen te filteren
- Vermindert visuele rommel bij veel bedrijven
- Zoekopdracht blijft behouden tijdens navigeren in grid

**Toewijzingsregels:**
- Eén bedrijf per stand per jaar (afgedwongen)
- Bedrijf moet eerst ingeschreven zijn voor jaar
- Verwijder toewijzing door vakje te deselecteren
- Bulkoperaties via import/export

**Archiveren & Herstellen** 🔒 *Alleen Super Admin*
Bewaar voltooide eventtoewijzingen:

**Archiveren:**
1. Klik "Archiveer [Jaar]" knop
2. Bevestig de archiveringsoperatie
3. Alle toewijzingen voor jaar verplaatst naar archief
4. Creëert historisch record voor referentie
5. Maakt actieve toewijzingen vrij voor nieuwe start

**Gearchiveerde Bekijken:**
1. Klik "Bekijk Gearchiveerde Toewijzingen"
2. Selecteer jaar uit archieflijst
3. Bekijk alleen-lezen toewijzingen van vorige events
4. Handig voor plannen van terugkerende events

**Importeren & Exporteren** 🔑 *Event Manager+*
Bulk toewijzingsbeheer:

**Exporteren:**
- Downloadt huidige toewijzingen als Excel
- Bevat: Bedrijfsnaam, Standlabel, Marker ID
- Handig voor plattegronden en logistiek

**Importeren:**
- Upload Excel/CSV met toewijzingen
- Systeem valideert bedrijf en marker bestaan
- Voorbeeld voor wijzigingen doorvoeren
- Efficiënt voor initiële setup of bulkwijzigingen

**Aanbevolen Werkwijze:**
- Start met "Niet-toegewezen Eerst" sortering om alle toewijzingen te voltooien
- Gebruik "Op Marker" sortering voor plattegrondplanning en indelingsverificatie
- Zoek specifieke bedrijven bij grote events
- Exporteer voor bulkwijzigingen (backup)
- Archiveer voltooide jaren jaarlijks om systeem georganiseerd te houden
      `.trim()
    },
    updated: "2025-12-02",
    tips: {
      en: [
        "Use 'Unassigned First' sort to quickly complete all assignments",
        "Sort preferences save automatically across sessions",
        "Search filters rows - useful with many companies",
        "One booth per company per year rule is enforced",
        "Archive completed years to preserve historical data"
      ],
      nl: [
        "Gebruik 'Niet-toegewezen Eerst' sortering om snel alle toewijzingen te voltooien",
        "Sorteervoorkeuren slaan automatisch op over sessies",
        "Zoeken filtert rijen - handig bij veel bedrijven",
        "Eén stand per bedrijf per jaar regel is afgedwongen",
        "Archiveer voltooide jaren om historische data te bewaren"
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
Configure organization-wide and personal settings. The Settings page is organized into two groups: Personal Settings (affect only you) and Organization Settings (affect all users).

**Settings Navigation:**
The Settings page uses a sidebar navigation with clearly labeled sections. Each admin role sees different settings based on their permissions. Your current role badge is displayed at the top of the page.

**Personal Settings Group:**

**1. UI Language** 🔓 *All Roles*
Choose your personal interface language preference:
- **Language Options**: English, Nederlands (Dutch)
- **Scope**: Affects only your admin interface
- **Persistence**: Saved to your user account
- **Default**: Organization default language

This setting controls the language of all admin interface elements including menus, buttons, labels, and help content. It does not affect public-facing content or company information.

**Organization Settings Group:**

**2. User Management** 🗝️ *System Manager+*
Manage admin user accounts and role assignments:
- **View Users**: See all admin users with their roles
- **Add Users**: Invite new admins by email
- **Edit Roles**: Assign roles (Super Admin, System Manager, Event Manager, Content Editor)
- **Remove Users**: Revoke admin access
- **Role Requirements**:
  - Super Admins can manage all users
  - System Managers can manage Event Managers and Content Editors

**Important**: User Management affects security and access control. Always verify role assignments before saving.

**3. Category Settings** 🗝️ *System Manager+*
Create and manage company categories for organization-wide filtering:
- **Create Categories**: Add new category names and descriptions
- **Edit Categories**: Update existing category information
- **Delete Categories**: Remove unused categories (with safety check)
- **Category Usage**: Categories appear in Companies tab for filtering
- **Scope**: Available to all admin users across all years

Categories help organize exhibitors by type (e.g., "Food & Beverage", "Technology", "Arts & Crafts"). Companies can be assigned multiple categories in the Companies tab.

**4. Branding Settings** 🗝️ *System Manager+*
Customize the application appearance and identity:
- **Organization Logo**: Upload logo image (PNG, JPG, SVG)
- **Organization Name**: Display name throughout the app
- **Primary Color**: Main theme color for UI elements
- **Logo Display**: Appears in admin header, map clusters, public map
- **Scope**: Affects all admin and public interfaces

**Logo Requirements:**
- Recommended size: 200x200px or larger
- Transparent background preferred for clusters
- Supported formats: PNG (recommended), JPG, SVG
- Maximum file size: 2MB

**5. Map Defaults** 🗝️ *System Manager+*
Set default map position and zoom for new event years:
- **Default Center**: Latitude and longitude coordinates
- **Default Zoom**: Starting zoom level (1-20)
- **Scope**: Applied when creating new event years
- **Override**: Can be customized per year in Map Settings

Use Map Defaults to set a sensible starting point for all future events. You can fine-tune each year individually in Map Settings (see below).

**How to Set Defaults:**
1. Navigate to Map Management
2. Pan and zoom to desired default view
3. Return to Settings > Map Defaults
4. Click "Capture Current View" to save position and zoom

**6. Map Settings** 🗝️ *System Manager+*
Configure year-specific map visibility and behavior:
- **Year Selector**: Choose which event year to configure
- **Map Visibility**: Enable/disable map for specific year
- **Custom Center**: Override default center coordinates for this year
- **Custom Zoom**: Override default zoom level for this year
- **Scope**: Settings apply only to selected year

**Year-Specific Use Cases:**
- Hide map for years without physical event (online-only)
- Adjust map center if event venue changed locations
- Fine-tune zoom level for venue size differences

**7. Event Defaults** 🔑 *Event Manager+*
Set default meal counts for new event subscriptions:
- **Saturday**: Breakfast, Lunch, BBQ counts
- **Sunday**: Breakfast, Lunch counts
- **Application**: Auto-filled when subscribing new companies
- **Override**: Can be changed per subscription in Subscriptions tab
- **Scope**: Organization-wide defaults for all future subscriptions

**Typical Defaults:**
- Breakfast: 2-4 people per booth
- Lunch: 2-4 people per booth
- BBQ: 2-3 people per booth (Saturday only)

Event Managers can set these defaults to reduce data entry time when subscribing many companies.

**8. Advanced Settings** 🔒 *Super Admin Only*
System configuration and danger zone operations:
- **Database Maintenance**: Backup and restore options
- **System Configuration**: Technical settings
- **Danger Zone**: Irreversible operations
- **Scope**: System-wide impact

⚠️ **Warning**: Advanced settings can significantly impact the application. Only Super Admins with technical knowledge should access this section. Always create backups before making changes.

**Best Practices:**

**Settings Organization:**
- Personal settings (UI Language) affect only your account
- Organization settings affect all users and public interfaces
- Year-specific settings (Map Settings) apply to selected year only
- Always verify your current role badge before making changes

**Making Changes:**
- Test changes in staging environment first (if available)
- Communicate branding updates to all admin users
- Document category naming conventions for consistency
- Review user roles quarterly for security hygiene

**Common Scenarios:**

**Scenario 1: Setting Up for New Event Year**
1. Update Event Defaults with expected meal counts
2. Check Map Settings for the new year
3. Verify categories are current and organized
4. Review user roles and permissions

**Scenario 2: Branding Update**
1. Prepare new logo file (PNG, 200x200px, transparent)
2. Navigate to Settings > Branding Settings
3. Upload new logo
4. Update organization name if changed
5. Verify logo appears correctly in header and map clusters

**Scenario 3: Adding New Admin User**
1. Navigate to Settings > User Management
2. Click "Add User" or "Invite User"
3. Enter user email address
4. Assign appropriate role based on responsibilities
5. Send invitation and verify user receives access
      `.trim(),
      nl: `
Configureer organisatiebrede en persoonlijke instellingen. De Instellingen pagina is georganiseerd in twee groepen: Persoonlijke Instellingen (alleen voor jou) en Organisatie Instellingen (voor alle gebruikers).

**Instellingen Navigatie:**
De Instellingen pagina gebruikt een sidebar navigatie met duidelijk gelabelde secties. Elke admin rol ziet verschillende instellingen op basis van hun rechten. Je huidige rol badge wordt bovenaan de pagina weergegeven.

**Persoonlijke Instellingen Groep:**

**1. UI Taal** 🔓 *Alle Rollen*
Kies je persoonlijke interface taal voorkeur:
- **Taal Opties**: English, Nederlands
- **Scope**: Beïnvloedt alleen jouw admin interface
- **Persistentie**: Opgeslagen in je gebruikersaccount
- **Standaard**: Organisatie standaard taal

Deze instelling bepaalt de taal van alle admin interface elementen inclusief menu's, knoppen, labels en help-inhoud. Het heeft geen invloed op publieke content of bedrijfsinformatie.

**Organisatie Instellingen Groep:**

**2. Gebruikersbeheer** 🗝️ *System Manager+*
Beheer admin gebruikersaccounts en rol toewijzingen:
- **Bekijk Gebruikers**: Zie alle admin gebruikers met hun rollen
- **Voeg Gebruikers Toe**: Nodig nieuwe admins uit via email
- **Wijzig Rollen**: Wijs rollen toe (Super Admin, Systeembeheerder, Eventbeheerder, Content Editor)
- **Verwijder Gebruikers**: Intrek admin toegang
- **Rol Vereisten**:
  - Super Admins kunnen alle gebruikers beheren
  - Systeembeheerders kunnen Eventbeheerders en Content Editors beheren

**Belangrijk**: Gebruikersbeheer beïnvloedt beveiliging en toegangscontrole. Verifieer altijd rol toewijzingen voordat je opslaat.

**3. Categorie Instellingen** 🗝️ *System Manager+*
Creëer en beheer bedrijfscategorieën voor organisatiebrede filtering:
- **Creëer Categorieën**: Voeg nieuwe categorienamen en beschrijvingen toe
- **Wijzig Categorieën**: Update bestaande categorie informatie
- **Verwijder Categorieën**: Verwijder ongebruikte categorieën (met veiligheidscheck)
- **Categorie Gebruik**: Categorieën verschijnen in Bedrijven tabblad voor filtering
- **Scope**: Beschikbaar voor alle admin gebruikers over alle jaren

Categorieën helpen exposanten te organiseren per type (bijv. "Food & Beverage", "Technologie", "Kunst & Ambacht"). Bedrijven kunnen meerdere categorieën toegewezen krijgen in het Bedrijven tabblad.

**4. Branding Instellingen** 🗝️ *System Manager+*
Pas de applicatie weergave en identiteit aan:
- **Organisatie Logo**: Upload logo afbeelding (PNG, JPG, SVG)
- **Organisatienaam**: Weergavenaam door de hele app
- **Primaire Kleur**: Hoofdthemakleur voor UI elementen
- **Logo Weergave**: Verschijnt in admin header, kaart clusters, publieke kaart
- **Scope**: Beïnvloedt alle admin en publieke interfaces

**Logo Vereisten:**
- Aanbevolen grootte: 200x200px of groter
- Transparante achtergrond bij voorkeur voor clusters
- Ondersteunde formaten: PNG (aanbevolen), JPG, SVG
- Maximale bestandsgrootte: 2MB

**5. Kaart Standaarden** 🗝️ *System Manager+*
Stel standaard kaartpositie en zoom in voor nieuwe eventjaren:
- **Standaard Centrum**: Breedtegraad en lengtegraad coördinaten
- **Standaard Zoom**: Start zoomniveau (1-20)
- **Scope**: Toegepast bij het maken van nieuwe eventjaren
- **Override**: Kan per jaar aangepast worden in Kaart Instellingen

Gebruik Kaart Standaarden om een verstandig startpunt in te stellen voor alle toekomstige events. Je kunt elk jaar individueel fine-tunen in Kaart Instellingen (zie hieronder).

**Hoe Standaarden Instellen:**
1. Navigeer naar Kaartbeheer
2. Pan en zoom naar gewenste standaardweergave
3. Keer terug naar Instellingen > Kaart Standaarden
4. Klik "Leg Huidige Weergave Vast" om positie en zoom op te slaan

**6. Kaart Instellingen** 🗝️ *System Manager+*
Configureer jaarspecifieke kaart zichtbaarheid en gedrag:
- **Jaar Selector**: Kies welk eventjaar te configureren
- **Kaart Zichtbaarheid**: Schakel kaart in/uit voor specifiek jaar
- **Aangepast Centrum**: Override standaard centrum coördinaten voor dit jaar
- **Aangepaste Zoom**: Override standaard zoomniveau voor dit jaar
- **Scope**: Instellingen gelden alleen voor geselecteerd jaar

**Jaarspecifieke Use Cases:**
- Verberg kaart voor jaren zonder fysiek event (alleen online)
- Pas kaartcentrum aan als event locatie veranderd is
- Fine-tune zoomniveau voor verschillen in locatiegrootte

**7. Event Standaarden** 🔑 *Event Manager+*
Stel standaard maaltijdaantallen in voor nieuwe event inschrijvingen:
- **Zaterdag**: Ontbijt, Lunch, BBQ aantallen
- **Zondag**: Ontbijt, Lunch aantallen
- **Toepassing**: Automatisch ingevuld bij inschrijven nieuwe bedrijven
- **Override**: Kan per inschrijving aangepast worden in Inschrijvingen tabblad
- **Scope**: Organisatiebrede standaarden voor alle toekomstige inschrijvingen

**Typische Standaarden:**
- Ontbijt: 2-4 personen per stand
- Lunch: 2-4 personen per stand
- BBQ: 2-3 personen per stand (alleen zaterdag)

Eventbeheerders kunnen deze standaarden instellen om data-invoer tijd te verminderen bij het inschrijven van veel bedrijven.

**8. Geavanceerde Instellingen** 🔒 *Super Admin Only*
Systeemconfiguratie en danger zone operaties:
- **Database Onderhoud**: Backup en restore opties
- **Systeemconfiguratie**: Technische instellingen
- **Danger Zone**: Onomkeerbare operaties
- **Scope**: Systeembrede impact

⚠️ **Waarschuwing**: Geavanceerde instellingen kunnen de applicatie significant beïnvloeden. Alleen Super Admins met technische kennis moeten deze sectie benaderen. Maak altijd backups voordat je wijzigingen aanbrengt.

**Best Practices:**

**Instellingen Organisatie:**
- Persoonlijke instellingen (UI Taal) beïnvloeden alleen jouw account
- Organisatie instellingen beïnvloeden alle gebruikers en publieke interfaces
- Jaarspecifieke instellingen (Kaart Instellingen) gelden alleen voor geselecteerd jaar
- Verifieer altijd je huidige rol badge voordat je wijzigingen maakt

**Wijzigingen Maken:**
- Test wijzigingen eerst in staging omgeving (indien beschikbaar)
- Communiceer branding updates naar alle admin gebruikers
- Documenteer categorie naamgevingsconventies voor consistentie
- Review gebruikersrollen elk kwartaal voor security hygiëne

**Veelvoorkomende Scenario's:**

**Scenario 1: Opzetten voor Nieuw Eventjaar**
1. Update Event Standaarden met verwachte maaltijdaantallen
2. Controleer Kaart Instellingen voor het nieuwe jaar
3. Verifieer dat categorieën actueel en georganiseerd zijn
4. Review gebruikersrollen en rechten

**Scenario 2: Branding Update**
1. Bereid nieuw logo bestand voor (PNG, 200x200px, transparant)
2. Navigeer naar Instellingen > Branding Instellingen
3. Upload nieuw logo
4. Update organisatienaam indien gewijzigd
5. Verifieer dat logo correct verschijnt in header en kaart clusters

**Scenario 3: Nieuwe Admin Gebruiker Toevoegen**
1. Navigeer naar Instellingen > Gebruikersbeheer
2. Klik "Voeg Gebruiker Toe" of "Nodig Gebruiker Uit"
3. Voer gebruiker email adres in
4. Wijs passende rol toe op basis van verantwoordelijkheden
5. Stuur uitnodiging en verifieer dat gebruiker toegang ontvangt
      `.trim()
    },
    updated: "2025-12-02",
    tips: {
      en: [
        "Personal settings only affect your account, organization settings affect everyone",
        "Test branding changes before applying to production",
        "Review user roles quarterly for security hygiene",
        "Use categories consistently across all company assignments",
        "Set Event Defaults before bulk-subscribing companies"
      ],
      nl: [
        "Persoonlijke instellingen beïnvloeden alleen jouw account, organisatie instellingen iedereen",
        "Test branding wijzigingen voordat je ze toepast op productie",
        "Review gebruikersrollen elk kwartaal voor security hygiëne",
        "Gebruik categorieën consistent over alle bedrijfstoewijzingen",
        "Stel Event Standaarden in voordat je bulk-inschrijvingen doet"
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
Manage your event schedule and activities with full multi-language support. The Program Management interface allows year-specific activity scheduling with powerful organizational tools.

**Day-Based Organization:**

**Saturday/Sunday Tabs** 🔓 *All Roles*
The program is organized by event day for clarity:
- **Tab Navigation**: Click Saturday or Sunday to switch days
- **Activity Count**: Each tab shows activity count (e.g., "Saturday (12)")
- **Separate Management**: Activities stay organized per day
- **Independent Reordering**: Drag-to-reorder works within each day separately

**Multi-Language Content (NL/EN/DE)** 🔑 *Event Manager+*

Activities support three languages for international audiences:
- **Nederlands (NL)**: Dutch content for primary audience
- **English (EN)**: English translations for international visitors
- **Deutsch (DE)**: German translations for German-speaking visitors

**Translatable Fields:**
- Title (main heading for activity)
- Description (detailed information)
- Location text (for venue-type activities)
- Badge text (special labels)

All language fields are optional but recommended for complete coverage. Public schedule displays content based on visitor's selected language with fallback to Dutch.

**Location Types** 🔑 *Event Manager+*

Activities can reference two types of locations:

**1. Exhibitor Location:**
- Links activity to a specific company booth
- Displays company name automatically
- Shows booth assignment from assignments table
- Updates automatically if booth changes
- Perfect for: Workshops at exhibitor stands, product demos, exhibitor presentations

**2. Venue Location:**
- Custom static location text (multi-language)
- Manually entered location name
- Independent of booth assignments
- Perfect for: Main stage events, general venue areas, outdoor activities

**Optional Location Badge:**
- Toggle to show "Exhibitor" or "Venue" badge on activity
- Color-coded: Green for exhibitor, gray for venue
- Helps attendees quickly identify activity types
- Usually not needed unless event has many mixed activities

**Activity Status** 🔑 *Event Manager+*

Control activity visibility with active/inactive status:

**Active Activities:**
- Display in public schedule
- Normal appearance in admin list
- Can be dragged to reorder
- Shown in all public views

**Inactive Activities:**
- Hidden from public schedule
- Grayed out with diagonal stripe pattern in admin
- Cannot be dragged (reordering disabled)
- Labeled with "INACTIVE" orange badge
- Useful for: Planning future activities, temporarily removing without deleting

**Reactivate Feature:**
Inactive activities show a green "Restore" button instead of "Delete" button. Click to make activity visible again in public schedule.

**Drag-to-Reorder** 🔑 *Event Manager+*

Visually organize activity schedule order:
1. Hover over activity to see drag handle (⋮⋮ icon)
2. Click and drag activity to new position
3. Blue indicator line shows drop position
4. Release to reorder
5. System updates display_order field automatically
6. Changes save immediately to database

**Notes:**
- Only works on active activities (inactive cannot be dragged)
- Reorder separately for Saturday and Sunday
- Public schedule displays activities in this order
- Batch updates ensure consistent ordering

**Copy & Paste Activities** 🔑 *Event Manager+*

Duplicate activities efficiently:

**Copy:**
1. Click "Copy" button (copy icon) on any activity
2. System stores activity data (excludes ID and timestamps)
3. Toast notification confirms "Activity copied!"
4. Green "Paste Activity" button appears in header

**Paste:**
1. Click "Paste Activity" button
2. Activity form opens with copied data pre-filled
3. Edit any fields as needed (times, location, languages)
4. Click "Save" to create duplicate

**Use Cases:**
- Duplicate recurring activities (e.g., hourly demos)
- Create similar activities with small variations
- Clone activities from Saturday to Sunday
- Template for series of related events

**Copy from Previous Year** 🔑 *Event Manager+*

Quickly setup recurring annual events:
1. Click "Copy from [Previous Year]" button (purple)
2. Confirm copy operation
3. System copies all activities from previous year to current year
4. Activities maintain: times, locations, languages, order
5. New IDs assigned (creates independent copies)
6. Success toast confirms completion

**Important**: This copies all Saturday and Sunday activities. Review and adjust dates/times after copying.

**Archive Current Year** 🔒 *Super Admin Only*

Preserve completed event schedules:
1. Click "Archive [Year]" button (orange)
2. Confirm archive operation
3. All activities for year moved to archive table
4. Clears active schedule for fresh start
5. Historical data preserved for reference
6. Button disabled when no activities exist

**Archived activities are read-only** and cannot be edited or restored directly. Use "Copy from Previous Year" to bring back archived schedules.

**Adding Activities** 🔑 *Event Manager+*

Create new schedule entries:
1. Navigate to desired day tab (Saturday or Sunday)
2. Click "Add Activity" button (blue, top-right)
3. Fill in activity form:
   - **Time**: Start and end time (e.g., "10:00", "11:30")
   - **Location Type**: Select Exhibitor or Venue
   - **Location**: Choose company (exhibitor) or enter text (venue)
   - **Languages**: Fill NL, EN, DE fields for title and description
   - **Badge**: Optional special label (e.g., "FREE!", "VIP Only")
   - **Active Status**: Check to make visible in public schedule
   - **Location Badge**: Toggle to show location type indicator
4. Click "Save" to create activity
5. Activity appears in list on selected day

**Editing Activities** 🔑 *Event Manager+*

Modify existing schedule entries:
1. Click "Edit" button (blue pencil icon) on activity
2. Activity form opens with current data
3. Modify any fields
4. Click "Save" to apply changes
5. Updates immediately in public schedule

**Can edit inactive activities** to make changes before reactivating.

**Deleting Activities** 🔑 *Event Manager+*

Remove activities permanently:
1. Click "Delete" button (red trash icon) on active activity
2. Confirmation dialog appears with activity title
3. Confirm deletion
4. Activity removed from database permanently

**Alternative**: Set activity to inactive instead of deleting to preserve historical data.

**Activity Footer Stats** 🔓 *All Roles*

Bottom of activity list shows helpful counts:
- **Total Activities**: Complete count for selected day
- **Active Activities**: Green count of public-visible activities
- **Inactive Activities**: Orange count of hidden activities

Stats update automatically as activities are added, edited, or status changes.

**Best Practices:**

**Multi-Language Strategy:**
- Always fill Dutch (NL) as primary language
- Add English (EN) for international events
- Include German (DE) if serving German-speaking visitors
- Consistent terminology across all activities improves readability

**Activity Organization:**
- Use drag-to-reorder to match physical event flow
- Group similar activities together visually
- Set inactive for planning purposes (don't delete)
- Use badges sparingly for truly special events only

**Location Linking:**
- Link to exhibitor booths for sponsor visibility
- Use venue locations for central/main stage events
- Location badges usually not needed (clear from company name)
- Test public schedule view to verify correct display

**Workflow Efficiency:**
- Copy/paste for recurring activities (hourly demos)
- Copy from previous year for annual events
- Archive completed years to keep system organized
- Inactive status instead of delete preserves history

**Common Scenarios:**

**Scenario 1: Setting Up Annual Event Schedule**
1. Click "Copy from [Previous Year]" to import last year's schedule
2. Review and update activity times for new year dates
3. Edit locations if exhibitors changed
4. Update any badges or special notes
5. Add new activities for new exhibitors/sponsors
6. Verify multi-language content is current

**Scenario 2: Creating Recurring Hourly Demos**
1. Add first demo activity with all details
2. Click "Copy" on the activity
3. Click "Paste Activity" button
4. Update time to next hour (e.g., 10:00 → 11:00)
5. Click "Save"
6. Repeat for all demo times throughout day

**Scenario 3: Managing Activity Visibility**
1. Create all activities as active initially
2. During event planning, set tentative activities to inactive
3. Inactive activities hidden from public but visible in admin
4. As activities confirm, click "Restore" to reactivate
5. Public schedule shows only confirmed activities

**Scenario 4: Organizing Schedule by Event Flow**
1. Add all activities for the day
2. Review physical event layout
3. Drag activities to match spatial flow (entrance → middle → end)
4. Or organize by time if chronological order preferred
5. Test public schedule to verify logical progression
      `.trim(),
      nl: `
Beheer je event schema en activiteiten met volledige meertalige ondersteuning. De Programma Beheer interface maakt jaarspecifieke activiteitenplanning mogelijk met krachtige organisatietools.

**Dag-Gebaseerde Organisatie:**

**Zaterdag/Zondag Tabbladen** 🔓 *Alle Rollen*
Het programma is georganiseerd per eventdag voor helderheid:
- **Tabblad Navigatie**: Klik Zaterdag of Zondag om van dag te wisselen
- **Activiteitenaantal**: Elk tabblad toont activiteitenaantal (bijv. "Zaterdag (12)")
- **Gescheiden Beheer**: Activiteiten blijven georganiseerd per dag
- **Onafhankelijk Herschikken**: Sleep-om-te-herschikken werkt binnen elke dag apart

**Meertalige Content (NL/EN/DE)** 🔑 *Event Manager+*

Activiteiten ondersteunen drie talen voor internationaal publiek:
- **Nederlands (NL)**: Nederlandse content voor primair publiek
- **English (EN)**: Engelse vertalingen voor internationale bezoekers
- **Deutsch (DE)**: Duitse vertalingen voor Duitstalige bezoekers

**Vertaalbare Velden:**
- Titel (hoofdkop voor activiteit)
- Beschrijving (gedetailleerde informatie)
- Locatietekst (voor locatie-type activiteiten)
- Badge tekst (speciale labels)

Alle taalvelden zijn optioneel maar aanbevolen voor complete dekking. Publiek schema toont content gebaseerd op bezoekers geselecteerde taal met fallback naar Nederlands.

**Locatietypes** 🔑 *Event Manager+*

Activiteiten kunnen naar twee soorten locaties verwijzen:

**1. Standhouder Locatie:**
- Koppelt activiteit aan specifieke bedrijfsstand
- Toont bedrijfsnaam automatisch
- Toont standtoewijzing uit toewijzingentabel
- Update automatisch als stand wijzigt
- Perfect voor: Workshops op standhouder stands, productdemo's, standhouder presentaties

**2. Locatie Locatie:**
- Aangepaste statische locatietekst (meertalig)
- Handmatig ingevoerde locatienaam
- Onafhankelijk van standtoewijzingen
- Perfect voor: Hoofdpodium events, algemene venue gebieden, buitenactiviteiten

**Optionele Locatie Badge:**
- Schakel om "Standhouder" of "Locatie" badge te tonen op activiteit
- Kleurgecodeerd: Groen voor standhouder, grijs voor locatie
- Helpt bezoekers snel activiteitentypes te identificeren
- Meestal niet nodig tenzij event veel gemengde activiteiten heeft

**Activiteitenstatus** 🔑 *Event Manager+*

Bepaal activiteitzichtbaarheid met actief/inactief status:

**Actieve Activiteiten:**
- Weergeven in publiek schema
- Normale weergave in admin lijst
- Kunnen gesleept worden om te herschikken
- Getoond in alle publieke weergaven

**Inactieve Activiteiten:**
- Verborgen in publiek schema
- Uitgegrijsd met diagonaal streeppatroon in admin
- Kunnen niet gesleept worden (herschikken uitgeschakeld)
- Gelabeld met "INACTIEF" oranje badge
- Handig voor: Plannen toekomstige activiteiten, tijdelijk verwijderen zonder te verwijderen

**Reactiveren Feature:**
Inactieve activiteiten tonen een groene "Herstellen" knop in plaats van "Verwijderen" knop. Klik om activiteit weer zichtbaar te maken in publiek schema.

**Sleep-om-te-Herschikken** 🔑 *Event Manager+*

Organiseer visueel activiteitenschema volgorde:
1. Hover over activiteit om sleephandvat te zien (⋮⋮ icoon)
2. Klik en sleep activiteit naar nieuwe positie
3. Blauwe indicatorlijn toont drop positie
4. Laat los om te herschikken
5. Systeem update display_order veld automatisch
6. Wijzigingen slaan direct op naar database

**Opmerkingen:**
- Werkt alleen op actieve activiteiten (inactief kan niet gesleept worden)
- Herschik apart voor Zaterdag en Zondag
- Publiek schema toont activiteiten in deze volgorde
- Batch updates zorgen voor consistente volgorde

**Kopiëren & Plakken Activiteiten** 🔑 *Event Manager+*

Dupliceer activiteiten efficiënt:

**Kopiëren:**
1. Klik "Kopiëren" knop (kopieer icoon) op activiteit
2. Systeem slaat activiteitdata op (exclusief ID en timestamps)
3. Toast notificatie bevestigt "Activiteit gekopieerd!"
4. Groene "Activiteit Plakken" knop verschijnt in header

**Plakken:**
1. Klik "Activiteit Plakken" knop
2. Activiteitformulier opent met gekopieerde data vooraf ingevuld
3. Bewerk velden indien nodig (tijden, locatie, talen)
4. Klik "Opslaan" om duplicaat te creëren

**Use Cases:**
- Dupliceer terugkerende activiteiten (bijv. uurlijkse demo's)
- Creëer vergelijkbare activiteiten met kleine variaties
- Kloon activiteiten van Zaterdag naar Zondag
- Template voor reeks gerelateerde events

**Kopiëren van Vorig Jaar** 🔑 *Event Manager+*

Stel snel terugkerende jaarlijkse events in:
1. Klik "Kopiëren van [Vorig Jaar]" knop (paars)
2. Bevestig kopieeroperatie
3. Systeem kopieert alle activiteiten van vorig jaar naar huidig jaar
4. Activiteiten behouden: tijden, locaties, talen, volgorde
5. Nieuwe IDs toegewezen (creëert onafhankelijke kopieën)
6. Success toast bevestigt voltooiing

**Belangrijk**: Dit kopieert alle Zaterdag en Zondag activiteiten. Review en pas data/tijden aan na kopiëren.

**Huidig Jaar Archiveren** 🔒 *Alleen Super Admin*

Bewaar voltooide event schema's:
1. Klik "Archiveer [Jaar]" knop (oranje)
2. Bevestig archiveringsoperatie
3. Alle activiteiten voor jaar verplaatst naar archieftabel
4. Maakt actief schema vrij voor nieuwe start
5. Historische data behouden voor referentie
6. Knop uitgeschakeld wanneer geen activiteiten bestaan

**Gearchiveerde activiteiten zijn alleen-lezen** en kunnen niet direct bewerkt of hersteld worden. Gebruik "Kopiëren van Vorig Jaar" om gearchiveerde schema's terug te halen.

**Activiteiten Toevoegen** 🔑 *Event Manager+*

Creëer nieuwe schema entries:
1. Navigeer naar gewenst dag tabblad (Zaterdag of Zondag)
2. Klik "Activiteit Toevoegen" knop (blauw, rechts-boven)
3. Vul activiteitformulier in:
   - **Tijd**: Start- en eindtijd (bijv. "10:00", "11:30")
   - **Locatietype**: Selecteer Standhouder of Locatie
   - **Locatie**: Kies bedrijf (standhouder) of voer tekst in (locatie)
   - **Talen**: Vul NL, EN, DE velden in voor titel en beschrijving
   - **Badge**: Optioneel speciaal label (bijv. "GRATIS!", "Alleen VIP")
   - **Actieve Status**: Vink aan om zichtbaar te maken in publiek schema
   - **Locatie Badge**: Schakel om locatietype indicator te tonen
4. Klik "Opslaan" om activiteit te creëren
5. Activiteit verschijnt in lijst op geselecteerde dag

**Activiteiten Bewerken** 🔑 *Event Manager+*

Wijzig bestaande schema entries:
1. Klik "Bewerken" knop (blauw potlood icoon) op activiteit
2. Activiteitformulier opent met huidige data
3. Wijzig velden
4. Klik "Opslaan" om wijzigingen toe te passen
5. Update direct in publiek schema

**Kan inactieve activiteiten bewerken** om wijzigingen te maken voor reactiveren.

**Activiteiten Verwijderen** 🔑 *Event Manager+*

Verwijder activiteiten permanent:
1. Klik "Verwijderen" knop (rode prullenbak icoon) op actieve activiteit
2. Bevestigingsdialoog verschijnt met activiteitstitel
3. Bevestig verwijdering
4. Activiteit permanent verwijderd uit database

**Alternatief**: Zet activiteit op inactief in plaats van verwijderen om historische data te bewaren.

**Activiteit Footer Stats** 🔓 *Alle Rollen*

Onderkant van activiteitenlijst toont handige tellingen:
- **Totaal Activiteiten**: Compleet aantal voor geselecteerde dag
- **Actieve Activiteiten**: Groen aantal van publiek-zichtbare activiteiten
- **Inactieve Activiteiten**: Oranje aantal van verborgen activiteiten

Stats updaten automatisch wanneer activiteiten toegevoegd, bewerkt of status wijzigt.

**Best Practices:**

**Meertalige Strategie:**
- Vul altijd Nederlands (NL) als primaire taal
- Voeg Engels (EN) toe voor internationale events
- Voeg Duits (DE) toe indien Duitstalige bezoekers bediend worden
- Consistente terminologie over alle activiteiten verbetert leesbaarheid

**Activiteiten Organisatie:**
- Gebruik sleep-om-te-herschikken om fysieke event flow te matchen
- Groepeer vergelijkbare activiteiten visueel samen
- Zet inactief voor planningsdoeleinden (niet verwijderen)
- Gebruik badges spaarzaam voor echt speciale events alleen

**Locatie Koppeling:**
- Koppel aan standhouder stands voor sponsor zichtbaarheid
- Gebruik locatie locaties voor centrale/hoofdpodium events
- Locatie badges meestal niet nodig (duidelijk uit bedrijfsnaam)
- Test publieke schema weergave om correcte display te verifiëren

**Workflow Efficiëntie:**
- Kopiëren/plakken voor terugkerende activiteiten (uurlijkse demo's)
- Kopiëren van vorig jaar voor jaarlijkse events
- Archiveer voltooide jaren om systeem georganiseerd te houden
- Inactieve status in plaats van verwijderen bewaart geschiedenis

**Veelvoorkomende Scenario's:**

**Scenario 1: Jaarlijks Event Schema Opzetten**
1. Klik "Kopiëren van [Vorig Jaar]" om vorig jaar schema te importeren
2. Review en update activiteitentijden voor nieuwe jaar data
3. Bewerk locaties als standhouders veranderd zijn
4. Update badges of speciale notities
5. Voeg nieuwe activiteiten toe voor nieuwe standhouders/sponsors
6. Verifieer dat meertalige content actueel is

**Scenario 2: Terugkerende Uurlijkse Demo's Creëren**
1. Voeg eerste demo activiteit toe met alle details
2. Klik "Kopiëren" op de activiteit
3. Klik "Activiteit Plakken" knop
4. Update tijd naar volgend uur (bijv. 10:00 → 11:00)
5. Klik "Opslaan"
6. Herhaal voor alle demo tijden door de dag

**Scenario 3: Activiteitenzichtbaarheid Beheren**
1. Creëer alle activiteiten als actief initieel
2. Tijdens event planning, zet voorlopige activiteiten op inactief
3. Inactieve activiteiten verborgen voor publiek maar zichtbaar in admin
4. Wanneer activiteiten bevestigen, klik "Herstellen" om te reactiveren
5. Publiek schema toont alleen bevestigde activiteiten

**Scenario 4: Schema Organiseren op Event Flow**
1. Voeg alle activiteiten voor de dag toe
2. Review fysieke event indeling
3. Sleep activiteiten om ruimtelijke flow te matchen (entree → midden → eind)
4. Of organiseer op tijd indien chronologische volgorde geprefereerd
5. Test publiek schema om logische progressie te verifiëren
      `.trim()
    },
    updated: "2025-12-02",
    tips: {
      en: [
        "Fill all three languages (NL/EN/DE) for international events",
        "Use copy/paste to efficiently create recurring hourly activities",
        "Set activities inactive instead of deleting to preserve history",
        "Drag-to-reorder only works on active activities",
        "Copy from previous year saves hours when setting up annual events"
      ],
      nl: [
        "Vul alle drie talen (NL/EN/DE) in voor internationale events",
        "Gebruik kopiëren/plakken om efficiënt terugkerende uurlijkse activiteiten te creëren",
        "Zet activiteiten inactief in plaats van verwijderen om geschiedenis te bewaren",
        "Sleep-om-te-herschikken werkt alleen op actieve activiteiten",
        "Kopiëren van vorig jaar bespaart uren bij opzetten jaarlijkse events"
      ]
    }
  },

  userRoles: {
    title: {
      en: "User Roles & Permissions",
      nl: "Gebruikersrollen & Rechten"
    },
    content: {
      en: `
Understanding user roles helps you know what features you can access and what actions you can perform in the admin panel.

**Role System Overview:**

The application uses a hierarchical role-based access control system with three admin roles. Each role grants specific permissions, and higher roles inherit all permissions from lower roles. Super Admin can access everything, while other roles have targeted access to specific features.

**The Three Admin Roles:**

**1. Event Manager** 🔑 *Event Manager+*
Event Managers handle event-specific data and company information. This role is perfect for staff who manage exhibitor relationships and event logistics.

**Permissions:**
- ✅ View Dashboard (read-only)
- ✅ Manage Companies (full CRUD: create, read, update, delete)
- ✅ Manage Event Subscriptions (full CRUD, import/export, archive, copy from previous year)
- ✅ Manage Assignments (view, assign companies to markers)
- ✅ Manage Program/Activities (full CRUD, import/export, archive, copy from previous year)
- ✅ Change Personal UI Language
- ✅ Access Event Defaults settings (read/write)
- ❌ Cannot edit map markers or marker settings
- ❌ Cannot access User Management, Branding, Categories, Map Defaults
- ❌ Cannot archive data (Super Admin only)

**Common Workflows:**
- Import annual exhibitor list
- Assign companies to booth locations
- Update event program schedule
- Export subscription data for reporting

**2. System Manager** 🗝️ *System Manager+*
System Managers control the map infrastructure and organization-wide settings. This role is ideal for technical staff managing the map system and visual customization.

**Permissions:**
- ✅ All Event Manager permissions
- ✅ Map Management (full CRUD: markers, styling, glyphs, visibility)
- ✅ User Management (invite users, assign roles, delete users)
- ✅ Category Settings (create/edit company categories)
- ✅ Branding Settings (logo, colors, app name)
- ✅ Map Defaults (default position and zoom)
- ✅ Map Settings (year-specific visibility and configuration)
- ❌ Cannot access Advanced Settings (Super Admin only)
- ❌ Cannot perform Super Admin-only archives

**Common Workflows:**
- Create and position map markers for new venues
- Adjust marker visibility by zoom level
- Configure organization branding
- Manage admin user accounts

**3. Super Admin** 🔒 *Super Admin Only*
Super Admins have unrestricted access to all features, including system-critical functions. This role should be reserved for organization leadership or IT administrators.

**Permissions:**
- ✅ All System Manager permissions
- ✅ All Event Manager permissions
- ✅ Advanced Settings (danger zone, system configuration)
- ✅ Archive Current Year operations (subscriptions, activities)
- ✅ Delete users from User Management
- ✅ Create other Super Admin accounts
- ✅ Full access to all settings and features

**Common Workflows:**
- Archive completed event years
- Configure advanced system settings
- Manage high-level user permissions
- Perform system-wide configuration changes

**Role Hierarchy:**

The role hierarchy determines permission inheritance:

\`\`\`
Super Admin (🔒)
    ↓ inherits all permissions
System Manager (🗝️)
    ↓ inherits all permissions
Event Manager (🔑)
    ↓ basic access
All Users (🔓)
\`\`\`

**Permission Matrix:**

| Feature | Event Manager 🔑 | System Manager 🗝️ | Super Admin 🔒 |
|---------|:----------------:|:------------------:|:--------------:|
| Dashboard (view) | ✅ | ✅ | ✅ |
| Companies | ✅ Full | ✅ Full | ✅ Full |
| Subscriptions | ✅ Full | ✅ Full | ✅ Full |
| Assignments | ✅ Full | ✅ Full | ✅ Full |
| Program Management | ✅ Full | ✅ Full | ✅ Full |
| Map Management | ❌ | ✅ Full | ✅ Full |
| User Management | ❌ | ✅ Full | ✅ Full |
| UI Language | ✅ Personal | ✅ Personal | ✅ Personal |
| Category Settings | ❌ | ✅ Full | ✅ Full |
| Branding | ❌ | ✅ Full | ✅ Full |
| Map Defaults | ❌ | ✅ Full | ✅ Full |
| Map Settings | ❌ | ✅ Full | ✅ Full |
| Event Defaults | ✅ Full | ✅ Full | ✅ Full |
| Advanced Settings | ❌ | ❌ | ✅ Full |
| Archive Year | ❌ | ❌ | ✅ Only |
| Delete Users | ❌ | ❌ | ✅ Only |

**How Role Badges Work:**

Throughout the help documentation and interface, you'll see emoji badges indicating permission requirements:
- 🔓 **All Roles** - Available to everyone (rarely shown, usually implicit)
- 🔑 **Event Manager+** - Event Manager, System Manager, or Super Admin
- 🗝️ **System Manager+** - System Manager or Super Admin
- 🔒 **Super Admin Only** - Only Super Admins can access

**Requesting Role Changes:**

If you need different permissions:

1. **Identify What You Need**: Determine which specific features you need access to
2. **Contact a System Manager or Super Admin**: Only these roles can modify user accounts
3. **Navigate to Settings → User Management** (for admin making the change)
4. **Edit User Role**: Click edit icon next to user, select new role, save changes
5. **User Logs Out/In**: Role changes take effect after re-authentication

**Important Notes:**
- Role changes require System Manager or Super Admin access
- Users cannot change their own role
- Each role is designed for specific job functions
- Higher roles have more responsibility and access to sensitive operations

**Security Best Practices:**

**For Organizations:**
- Grant minimum necessary permissions (principle of least privilege)
- Limit Super Admin accounts to 1-2 trusted individuals
- Use Event Manager role for most event staff
- Use System Manager for technical/map staff
- Regularly review user accounts in User Management
- Remove accounts for staff who no longer need access

**For Users:**
- Don't share your login credentials
- Log out when finished, especially on shared computers
- Report any access issues to your administrator
- Understand your role's capabilities and limitations
      `.trim(),
      nl: `
Het begrijpen van gebruikersrollen helpt je te weten tot welke functies je toegang hebt en welke acties je kunt uitvoeren in het admin paneel.

**Rolsysteem Overzicht:**

De applicatie gebruikt een hiërarchisch op rollen gebaseerd toegangscontrolesysteem met drie admin-rollen. Elke rol verleent specifieke rechten, en hogere rollen erven alle rechten van lagere rollen. Super Admin heeft toegang tot alles, terwijl andere rollen gerichte toegang hebben tot specifieke functies.

**De Drie Admin Rollen:**

**1. Event Manager** 🔑 *Event Manager+*
Event Managers beheren event-specifieke data en bedrijfsinformatie. Deze rol is perfect voor personeel dat standhouderrelaties en eventlogistiek beheert.

**Rechten:**
- ✅ Dashboard Bekijken (alleen-lezen)
- ✅ Bedrijven Beheren (volledige CRUD: aanmaken, lezen, updaten, verwijderen)
- ✅ Event Inschrijvingen Beheren (volledige CRUD, import/export, archiveren, kopiëren van vorig jaar)
- ✅ Toewijzingen Beheren (bekijken, bedrijven toewijzen aan markers)
- ✅ Programma/Activiteiten Beheren (volledige CRUD, import/export, archiveren, kopiëren van vorig jaar)
- ✅ Persoonlijke UI Taal Wijzigen
- ✅ Toegang tot Event Defaults instellingen (lezen/schrijven)
- ❌ Kan kaartmarkers of markerinstellingen niet bewerken
- ❌ Geen toegang tot Gebruikersbeheer, Branding, Categorieën, Kaart Defaults
- ❌ Kan data niet archiveren (alleen Super Admin)

**Veelvoorkomende Workflows:**
- Jaarlijkse standhouderlijst importeren
- Bedrijven toewijzen aan standlocaties
- Event programmaplanning updaten
- Inschrijvingsdata exporteren voor rapportage

**2. System Manager** 🗝️ *System Manager+*
System Managers beheren de kaartinfrastructuur en organisatie-brede instellingen. Deze rol is ideaal voor technisch personeel dat het kaartsysteem en visuele aanpassing beheert.

**Rechten:**
- ✅ Alle Event Manager rechten
- ✅ Kaart Beheer (volledige CRUD: markers, styling, glyphs, zichtbaarheid)
- ✅ Gebruikersbeheer (gebruikers uitnodigen, rollen toewijzen, gebruikers verwijderen)
- ✅ Categorie Instellingen (bedrijfscategorieën aanmaken/bewerken)
- ✅ Branding Instellingen (logo, kleuren, app naam)
- ✅ Kaart Defaults (standaard positie en zoom)
- ✅ Kaart Instellingen (jaar-specifieke zichtbaarheid en configuratie)
- ❌ Geen toegang tot Geavanceerde Instellingen (alleen Super Admin)
- ❌ Kan geen Super Admin-only archiefacties uitvoeren

**Veelvoorkomende Workflows:**
- Kaartmarkers aanmaken en positioneren voor nieuwe locaties
- Markerzichtbaarheid aanpassen per zoomniveau
- Organisatie branding configureren
- Admin gebruikersaccounts beheren

**3. Super Admin** 🔒 *Super Admin Only*
Super Admins hebben onbeperkte toegang tot alle functies, inclusief systeemkritische functies. Deze rol moet gereserveerd zijn voor organisatieleiderschap of IT-beheerders.

**Rechten:**
- ✅ Alle System Manager rechten
- ✅ Alle Event Manager rechten
- ✅ Geavanceerde Instellingen (danger zone, systeemconfiguratie)
- ✅ Huidig Jaar Archiveren operaties (inschrijvingen, activiteiten)
- ✅ Gebruikers verwijderen uit Gebruikersbeheer
- ✅ Andere Super Admin accounts aanmaken
- ✅ Volledige toegang tot alle instellingen en functies

**Veelvoorkomende Workflows:**
- Voltooide eventjaren archiveren
- Geavanceerde systeeminstellingen configureren
- High-level gebruikersrechten beheren
- Systeem-brede configuratiewijzigingen uitvoeren

**Rolhiërarchie:**

De rolhiërarchie bepaalt rechten-overerving:

\`\`\`
Super Admin (🔒)
    ↓ erft alle rechten
System Manager (🗝️)
    ↓ erft alle rechten
Event Manager (🔑)
    ↓ basis toegang
Alle Gebruikers (🔓)
\`\`\`

**Rechten Matrix:**

| Functie | Event Manager 🔑 | System Manager 🗝️ | Super Admin 🔒 |
|---------|:----------------:|:------------------:|:--------------:|
| Dashboard (bekijken) | ✅ | ✅ | ✅ |
| Bedrijven | ✅ Volledig | ✅ Volledig | ✅ Volledig |
| Inschrijvingen | ✅ Volledig | ✅ Volledig | ✅ Volledig |
| Toewijzingen | ✅ Volledig | ✅ Volledig | ✅ Volledig |
| Programma Beheer | ✅ Volledig | ✅ Volledig | ✅ Volledig |
| Kaart Beheer | ❌ | ✅ Volledig | ✅ Volledig |
| Gebruikersbeheer | ❌ | ✅ Volledig | ✅ Volledig |
| UI Taal | ✅ Persoonlijk | ✅ Persoonlijk | ✅ Persoonlijk |
| Categorie Instellingen | ❌ | ✅ Volledig | ✅ Volledig |
| Branding | ❌ | ✅ Volledig | ✅ Volledig |
| Kaart Defaults | ❌ | ✅ Volledig | ✅ Volledig |
| Kaart Instellingen | ❌ | ✅ Volledig | ✅ Volledig |
| Event Defaults | ✅ Volledig | ✅ Volledig | ✅ Volledig |
| Geavanceerde Instellingen | ❌ | ❌ | ✅ Volledig |
| Jaar Archiveren | ❌ | ❌ | ✅ Alleen |
| Gebruikers Verwijderen | ❌ | ❌ | ✅ Alleen |

**Hoe Rol Badges Werken:**

Door de gehele helpdocumentatie en interface zie je emoji badges die rechten-vereisten aangeven:
- 🔓 **Alle Rollen** - Beschikbaar voor iedereen (zelden getoond, meestal impliciet)
- 🔑 **Event Manager+** - Event Manager, System Manager, of Super Admin
- 🗝️ **System Manager+** - System Manager of Super Admin
- 🔒 **Super Admin Only** - Alleen Super Admins hebben toegang

**Rolwijzigingen Aanvragen:**

Als je andere rechten nodig hebt:

1. **Identificeer Wat Je Nodig Hebt**: Bepaal tot welke specifieke functies je toegang nodig hebt
2. **Neem Contact Op met System Manager of Super Admin**: Alleen deze rollen kunnen gebruikersaccounts wijzigen
3. **Navigeer naar Instellingen → Gebruikersbeheer** (voor admin die wijziging maakt)
4. **Bewerk Gebruikersrol**: Klik bewerkicoon naast gebruiker, selecteer nieuwe rol, sla op
5. **Gebruiker Logt Uit/In**: Rolwijzigingen worden actief na hernieuwde authenticatie

**Belangrijke Opmerkingen:**
- Rolwijzigingen vereisen System Manager of Super Admin toegang
- Gebruikers kunnen hun eigen rol niet wijzigen
- Elke rol is ontworpen voor specifieke functies
- Hogere rollen hebben meer verantwoordelijkheid en toegang tot gevoelige operaties

**Beveiligings Best Practices:**

**Voor Organisaties:**
- Verleen minimaal noodzakelijke rechten (principe van minste privilege)
- Beperk Super Admin accounts tot 1-2 vertrouwde personen
- Gebruik Event Manager rol voor meeste eventpersoneel
- Gebruik System Manager voor technisch/kaartpersoneel
- Controleer regelmatig gebruikersaccounts in Gebruikersbeheer
- Verwijder accounts voor personeel dat geen toegang meer nodig heeft

**Voor Gebruikers:**
- Deel je inloggegevens niet
- Log uit wanneer je klaar bent, vooral op gedeelde computers
- Meld toegangsproblemen bij je beheerder
- Begrijp de mogelijkheden en beperkingen van je rol
      `.trim()
    },
    updated: "2025-12-02",
    tips: {
      en: [
        "Your current role is always displayed in the top-right corner of the admin panel",
        "If you see a lock icon on a feature, it means you don't have permission to access it",
        "Event Managers handle event data; System Managers handle the map and settings",
        "Super Admin should be limited to 1-2 trusted individuals in your organization",
        "Role changes require logging out and back in to take effect"
      ],
      nl: [
        "Je huidige rol wordt altijd rechtsboven in het admin paneel weergegeven",
        "Als je een slotpictogram bij een functie ziet, heb je geen toegang",
        "Event Managers beheren eventdata; System Managers beheren kaart en instellingen",
        "Super Admin moet beperkt zijn tot 1-2 vertrouwde personen in je organisatie",
        "Rolwijzigingen vereisen uitloggen en opnieuw inloggen om actief te worden"
      ]
    }
  },

  categories: {
    title: {
      en: "Categories Management",
      nl: "Categorieën Beheer"
    },
    content: {
      en: `
Categories help organize and filter companies throughout the application. They provide visual badges with custom icons and colors that appear in company lists, making it easy to identify company types at a glance.

**What Are Categories?**

Categories are reusable tags you can assign to companies to group them by type, industry, or any classification that makes sense for your event. Each category has:
- **Name**: Display name in three languages (NL/EN/DE)
- **Description**: Optional explanation in three languages
- **Icon**: Visual symbol from preset icon library
- **Color**: Custom color for badges and visual distinction
- **Slug**: Unique identifier (e.g., "vehicles-dealers")
- **Sort Order**: Controls display order in category lists

**Category Management** 🗝️ *System Manager+*

**Viewing Categories:**
Navigate to **Settings → Category Settings** to see all categories in a table view. The table shows:
- Sort order with drag handle
- Icon and color preview
- Category name and description (in current UI language)
- Slug identifier
- Number of exhibitors assigned to this category
- Edit and delete actions

**Creating Categories** 🗝️ *System Manager+*

To create a new category:

1. **Click "Create New" Button** in the top-right corner
2. **Fill in Basic Information**:
   - **Slug** (required): Unique identifier using lowercase letters, numbers, and hyphens (e.g., "food-vendors")
   - **Icon**: Select from preset Material Design icons (Car, Tent, Trailer, etc.)
   - **Color**: Choose from preset colors or enter custom hex code (#1976d2)
   - **Sort Order**: Numeric value determining display order (lower numbers appear first)

3. **Add Translations** (all languages required):
   - **Nederlands (NL)**: Name and optional description in Dutch
   - **English (EN)**: Name and optional description in English
   - **Deutsch (DE)**: Name and optional description in German

4. **Click "Create"** to save the category

**Best Practices for Creating Categories:**
- Use descriptive, specific names ("Automotive Dealers" vs "Companies")
- Choose distinct colors for visual clarity (avoid similar shades)
- Pick icons that match the category purpose
- Keep descriptions concise (1-2 sentences maximum)
- Plan sort order logically (most common categories first)
- Use consistent slug format: lowercase-with-hyphens

**Editing Categories** 🗝️ *System Manager+*

To update an existing category:

1. **Click Edit Icon** (pencil) next to the category in the table
2. **Modify Any Field**: Slug, icon, color, sort order, or translations
3. **Update All Languages**: Ensure translations remain consistent
4. **Click "Save"** to apply changes

**Important Notes:**
- Changing a category's slug does NOT affect existing assignments
- Color and icon changes update immediately across all company displays
- Translation updates apply to all interfaces using that language

**Deleting Categories** 🗝️ *System Manager+*

To remove a category:

1. **Check Exhibitor Count**: Only categories with 0 assigned companies can be deleted
2. **Click Delete Icon** (trash) next to the category
3. **Confirm Deletion** in the dialog

**Safety Protections:**
- Cannot delete categories currently assigned to companies
- Must first remove all company assignments before deletion
- Deletion is permanent and cannot be undone
- Consider archiving by removing assignments instead of deleting

**Assigning Categories to Companies** 🔑 *Event Manager+*

Categories are assigned within the Companies management interface:

**In Companies Tab:**
1. **Click a Company Row** to open the edit modal
2. **Scroll to "Categories" Section** (usually near the bottom)
3. **Select/Deselect Categories** using checkboxes or multi-select
4. **Save Company** to apply category assignments

**Companies can have:**
- Zero categories (no filter tags)
- One category (single classification)
- Multiple categories (multi-classification)

**Category Badges in Company Lists:**
- Appear as colored pills with icon and name
- Show all assigned categories per company
- Click badges to filter by that category (if filtering enabled)
- Colors and icons match category settings

**Using Categories for Filtering** 🔓 *All Roles*

Categories enable powerful filtering throughout the application:

**In Companies Tab:**
- **Category Filter Dropdown**: Select one or more categories
- **View Matching Companies**: List updates to show only companies with selected categories
- **Clear Filters**: Remove category filter to see all companies

**In Public Map View:**
- Categories may appear as filter options for visitors
- Helps attendees find specific types of exhibitors
- Depends on configuration and public-facing settings

**In Reports and Exports:**
- Filter export data by category
- Generate category-specific exhibitor lists
- Track participation by company type

**Category Statistics** 🗝️ *System Manager+*

The "Exhibitors" column in the category table shows usage statistics:
- **Number**: Count of companies assigned to this category
- **Real-Time**: Updates automatically when assignments change
- **Zero Count**: Indicates unused categories (safe to delete)
- **High Count**: Shows popular classifications

**Use Statistics To:**
- Identify underutilized categories for removal
- Ensure even distribution across categories
- Track most common exhibitor types
- Plan category structure for next year

**Multi-Language Category Display:**

Categories automatically display in the user's selected language:
- **Dutch (NL)**: Shown to users with UI set to Nederlands
- **English (EN)**: Shown to users with UI set to English
- **German (DE)**: Shown to users with UI set to Deutsch
- **Fallback**: If translation missing, shows Dutch (NL) version

**All Three Languages Required:**
When creating or editing, you must provide name translations for all three languages. Descriptions are optional but recommended for clarity.

**Common Category Workflows:**

**Setting Up Annual Event Categories:**
1. Plan category structure (5-15 categories is typical)
2. Create categories with consistent naming
3. Assign sort order by expected popularity
4. Test category display in Companies tab
5. Bulk assign categories to existing companies

**Reorganizing Categories Mid-Event:**
1. Review category usage statistics
2. Merge underutilized categories (reassign companies, then delete)
3. Split overpopulated categories (create new, reassign some companies)
4. Update sort order to reflect new priorities
5. Update translations if category focus changed

**Cleaning Up After Event:**
1. Review all categories for next year relevance
2. Delete unused categories (0 exhibitors)
3. Archive assignments for completed year
4. Plan category structure improvements
5. Update translations if needed

**Best Practices:**

**For System Managers:**
- Create categories BEFORE bulk company import
- Use clear, jargon-free category names
- Maintain consistent icon style (all outline or all filled)
- Choose accessible color contrasts for readability
- Document category definitions for team consistency
- Review and update categories annually

**For Event Managers:**
- Assign categories during company creation
- Use multiple categories when companies fit multiple types
- Check category badges display correctly in company lists
- Update assignments when company focus changes
- Use category filters to verify data quality

**For All Users:**
- Understand what each category represents
- Use category filters to find specific exhibitor types
- Report missing or incorrect category assignments
- Suggest new categories when existing ones don't fit

**Technical Details:**

**Category Data Structure:**
- Stored in \`categories\` table with translations in \`category_translations\` table
- Many-to-many relationship via \`company_categories\` join table
- Real-time updates via Supabase subscriptions
- Automatic fallback to Dutch if translation missing

**Slug Requirements:**
- Must be unique across all categories
- Lowercase letters, numbers, hyphens only
- No spaces or special characters
- Used in filtering logic and API queries
- Cannot be changed without affecting integrations

**Icon Library:**
Available icons include: Car, Tent, Trailer, Car Parts, Airplane, Building, People, Terrain, Phone, Other (expandable)

**Color Format:**
- Hex color codes (#RRGGBB format)
- 16 preset colors provided
- Custom colors supported
- Used for badge backgrounds and visual grouping
      `.trim(),
      nl: `
Categorieën helpen bedrijven te organiseren en filteren door de gehele applicatie. Ze bieden visuele badges met aangepaste pictogrammen en kleuren die verschijnen in bedrijfslijsten, waardoor het gemakkelijk is om bedrijfstypen in één oogopslag te identificeren.

**Wat Zijn Categorieën?**

Categorieën zijn herbruikbare tags die je aan bedrijven kunt toewijzen om ze te groeperen op type, branche, of elke classificatie die zinvol is voor je event. Elke categorie heeft:
- **Naam**: Weergavenaam in drie talen (NL/EN/DE)
- **Beschrijving**: Optionele uitleg in drie talen
- **Pictogram**: Visueel symbool uit vooraf ingestelde pictogrambibliotheek
- **Kleur**: Aangepaste kleur voor badges en visueel onderscheid
- **Slug**: Unieke identifier (bijv. "voertuigen-dealers")
- **Sorteervolgorde**: Bepaalt weergavevolgorde in categorielijsten

**Categoriebeheer** 🗝️ *System Manager+*

**Categorieën Bekijken:**
Navigeer naar **Instellingen → Categorie Instellingen** om alle categorieën in een tabelweergave te zien. De tabel toont:
- Sorteervolgorde met sleephandgreep
- Pictogram en kleurvoorbeeld
- Categorienaam en beschrijving (in huidige UI-taal)
- Slug identifier
- Aantal standhouders toegewezen aan deze categorie
- Bewerk en verwijder acties

**Categorieën Aanmaken** 🗝️ *System Manager+*

Om een nieuwe categorie aan te maken:

1. **Klik "Nieuwe Aanmaken" Knop** rechtsboven
2. **Vul Basisinformatie In**:
   - **Slug** (verplicht): Unieke identifier met kleine letters, cijfers en streepjes (bijv. "voedsel-verkopers")
   - **Pictogram**: Kies uit vooraf ingestelde Material Design pictogrammen (Auto, Tent, Aanhanger, etc.)
   - **Kleur**: Kies uit vooraf ingestelde kleuren of voer aangepaste hex-code in (#1976d2)
   - **Sorteervolgorde**: Numerieke waarde die weergavevolgorde bepaalt (lagere nummers verschijnen eerst)

3. **Voeg Vertalingen Toe** (alle talen verplicht):
   - **Nederlands (NL)**: Naam en optionele beschrijving in het Nederlands
   - **English (EN)**: Naam en optionele beschrijving in het Engels
   - **Deutsch (DE)**: Naam en optionele beschrijving in het Duits

4. **Klik "Aanmaken"** om de categorie op te slaan

**Best Practices voor Categorieën Aanmaken:**
- Gebruik beschrijvende, specifieke namen ("Automotive Dealers" vs "Bedrijven")
- Kies onderscheidende kleuren voor visuele helderheid (vermijd vergelijkbare tinten)
- Kies pictogrammen die passen bij het categoriedoel
- Houd beschrijvingen beknopt (maximaal 1-2 zinnen)
- Plan sorteervolgorde logisch (meest voorkomende categorieën eerst)
- Gebruik consistent slug-formaat: kleine-letters-met-streepjes

**Categorieën Bewerken** 🗝️ *System Manager+*

Om een bestaande categorie bij te werken:

1. **Klik Bewerkpictogram** (potlood) naast de categorie in de tabel
2. **Wijzig Elk Veld**: Slug, pictogram, kleur, sorteervolgorde, of vertalingen
3. **Update Alle Talen**: Zorg dat vertalingen consistent blijven
4. **Klik "Opslaan"** om wijzigingen toe te passen

**Belangrijke Opmerkingen:**
- Slug wijzigen beïnvloedt NIET bestaande toewijzingen
- Kleur en pictogram wijzigingen updaten direct in alle bedrijfsweergaves
- Vertaling updates gelden voor alle interfaces in die taal

**Categorieën Verwijderen** 🗝️ *System Manager+*

Om een categorie te verwijderen:

1. **Controleer Standhouder Aantal**: Alleen categorieën met 0 toegewezen bedrijven kunnen worden verwijderd
2. **Klik Verwijderpictogram** (prullenbak) naast de categorie
3. **Bevestig Verwijdering** in de dialoog

**Veiligheidsmaatregelen:**
- Kan geen categorieën verwijderen die momenteel aan bedrijven zijn toegewezen
- Moet eerst alle bedrijfstoewijzingen verwijderen voor verwijdering
- Verwijdering is permanent en kan niet ongedaan worden gemaakt
- Overweeg archiveren door toewijzingen te verwijderen in plaats van verwijderen

**Categorieën Toewijzen aan Bedrijven** 🔑 *Event Manager+*

Categorieën worden toegewezen binnen de Bedrijvenbeheer interface:

**In Bedrijven Tab:**
1. **Klik een Bedrijfsrij** om de bewerkmodal te openen
2. **Scroll naar "Categorieën" Sectie** (meestal onderaan)
3. **Selecteer/Deselecteer Categorieën** met selectievakjes of multi-select
4. **Sla Bedrijf Op** om categorietoewijzingen toe te passen

**Bedrijven kunnen hebben:**
- Nul categorieën (geen filtertags)
- Eén categorie (enkele classificatie)
- Meerdere categorieën (multi-classificatie)

**Categoriebadges in Bedrijfslijsten:**
- Verschijnen als gekleurde pillen met pictogram en naam
- Tonen alle toegewezen categorieën per bedrijf
- Klik badges om te filteren op die categorie (als filtering ingeschakeld)
- Kleuren en pictogrammen komen overeen met categorie-instellingen

**Categorieën Gebruiken voor Filtering** 🔓 *Alle Rollen*

Categorieën maken krachtige filtering mogelijk door de gehele applicatie:

**In Bedrijven Tab:**
- **Categoriefilter Dropdown**: Selecteer een of meerdere categorieën
- **Bekijk Overeenkomende Bedrijven**: Lijst update toont alleen bedrijven met geselecteerde categorieën
- **Wis Filters**: Verwijder categoriefilter om alle bedrijven te zien

**In Publieke Kaartweergave:**
- Categorieën kunnen verschijnen als filteropties voor bezoekers
- Helpt deelnemers specifieke soorten standhouders te vinden
- Afhankelijk van configuratie en publieke instellingen

**In Rapporten en Exports:**
- Filter exportdata op categorie
- Genereer categorie-specifieke standhouderlijsten
- Track deelname per bedrijfstype

**Categoriestatistieken** 🗝️ *System Manager+*

De "Standhouders" kolom in de categorietabel toont gebruiksstatistieken:
- **Aantal**: Telling van bedrijven toegewezen aan deze categorie
- **Real-Time**: Update automatisch wanneer toewijzingen wijzigen
- **Nul Telling**: Geeft ongebruikte categorieën aan (veilig om te verwijderen)
- **Hoge Telling**: Toont populaire classificaties

**Gebruik Statistieken Om:**
- Ondergebruikte categorieën identificeren voor verwijdering
- Zorg voor gelijke verdeling over categorieën
- Track meest voorkomende standhoudertypen
- Plan categoriestructuur voor volgend jaar

**Meertalige Categorieweergave:**

Categorieën tonen automatisch in de geselecteerde taal van de gebruiker:
- **Nederlands (NL)**: Getoond aan gebruikers met UI ingesteld op Nederlands
- **English (EN)**: Getoond aan gebruikers met UI ingesteld op English
- **Deutsch (DE)**: Getoond aan gebruikers met UI ingesteld op Deutsch
- **Fallback**: Als vertaling ontbreekt, toont Nederlandse (NL) versie

**Alle Drie Talen Verplicht:**
Bij aanmaken of bewerken moet je naamvertalingen voor alle drie talen opgeven. Beschrijvingen zijn optioneel maar aanbevolen voor duidelijkheid.

**Veelvoorkomende Categorie Workflows:**

**Jaarlijkse Event Categorieën Instellen:**
1. Plan categoriestructuur (5-15 categorieën is typisch)
2. Maak categorieën aan met consistente naamgeving
3. Wijs sorteervolgorde toe op verwachte populariteit
4. Test categorieweergave in Bedrijven tab
5. Bulk wijs categorieën toe aan bestaande bedrijven

**Categorieën Reorganiseren Tijdens Event:**
1. Bekijk categoriegebruik statistieken
2. Voeg ondergebruikte categorieën samen (wijs bedrijven opnieuw toe, verwijder dan)
3. Splits overbevolkte categorieën (maak nieuwe aan, wijs enkele bedrijven opnieuw toe)
4. Update sorteervolgorde om nieuwe prioriteiten te weerspiegelen
5. Update vertalingen als categoriefocus wijzigde

**Opruimen Na Event:**
1. Bekijk alle categorieën voor relevantie volgend jaar
2. Verwijder ongebruikte categorieën (0 standhouders)
3. Archiveer toewijzingen voor voltooid jaar
4. Plan categoriestructuur verbeteringen
5. Update vertalingen indien nodig

**Best Practices:**

**Voor System Managers:**
- Maak categorieën AAN VOOR bulk bedrijfsimport
- Gebruik duidelijke, jargon-vrije categorienamen
- Behoud consistente pictogramstijl (allemaal outline of allemaal gevuld)
- Kies toegankelijke kleurcontrasten voor leesbaarheid
- Documenteer categoriedefinities voor teamconsistentie
- Bekijk en update categorieën jaarlijks

**Voor Event Managers:**
- Wijs categorieën toe tijdens bedrijfsaanmaak
- Gebruik meerdere categorieën wanneer bedrijven in meerdere types passen
- Controleer of categoriebadges correct tonen in bedrijfslijsten
- Update toewijzingen wanneer bedrijfsfocus wijzigt
- Gebruik categoriefilters om datakwaliteit te verifiëren

**Voor Alle Gebruikers:**
- Begrijp wat elke categorie vertegenwoordigt
- Gebruik categoriefilters om specifieke standhoudertypen te vinden
- Meld ontbrekende of incorrecte categorietoewijzingen
- Stel nieuwe categorieën voor wanneer bestaande niet passen

**Technische Details:**

**Categoriedata Structuur:**
- Opgeslagen in \`categories\` tabel met vertalingen in \`category_translations\` tabel
- Many-to-many relatie via \`company_categories\` join tabel
- Real-time updates via Supabase subscriptions
- Automatische fallback naar Nederlands als vertaling ontbreekt

**Slug Vereisten:**
- Moet uniek zijn over alle categorieën
- Alleen kleine letters, cijfers, streepjes
- Geen spaties of speciale tekens
- Gebruikt in filterlogica en API queries
- Kan niet worden gewijzigd zonder integraties te beïnvloeden

**Pictogrambibliotheek:**
Beschikbare pictogrammen zijn: Auto, Tent, Aanhanger, Auto-onderdelen, Vliegtuig, Gebouw, Mensen, Terrein, Telefoon, Anders (uitbreidbaar)

**Kleurformaat:**
- Hex kleurcodes (#RRGGBB formaat)
- 16 vooraf ingestelde kleuren beschikbaar
- Aangepaste kleuren ondersteund
- Gebruikt voor badge achtergronden en visuele groepering
      `.trim()
    },
    updated: "2025-12-02",
    tips: {
      en: [
        "Create categories before importing companies to assign them during import",
        "Use distinct colors and icons to make categories instantly recognizable",
        "Check the exhibitor count before deleting - you can't delete categories in use",
        "Provide all three language translations for international events",
        "Review category statistics regularly to identify underutilized categories"
      ],
      nl: [
        "Maak categorieën aan voor het importeren van bedrijven om ze tijdens import toe te wijzen",
        "Gebruik onderscheidende kleuren en pictogrammen om categorieën direct herkenbaar te maken",
        "Controleer het standhouderaantal voor verwijderen - je kunt categorieën in gebruik niet verwijderen",
        "Geef alle drie taalvertalingen voor internationale events",
        "Bekijk categoriestatistieken regelmatig om ondergebruikte categorieën te identificeren"
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
- **Super Admin** 🔒: Full access to everything
- **System Manager** 🗝️: Map editing, settings, and user management
- **Event Manager** 🔑: Companies, subscriptions, assignments, and program management

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
- **Super Admin** 🔒: Volledige toegang tot alles
- **System Manager** 🗝️: Kaartbewerking, instellingen en gebruikersbeheer
- **Event Manager** 🔑: Bedrijven, inschrijvingen, toewijzingen en programma beheer

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

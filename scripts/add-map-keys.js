import fs from 'fs';

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const nl = JSON.parse(fs.readFileSync('src/locales/nl.json', 'utf8'));

const newEnKeys = {
  "subscriptionList": "Subscription List",
  "markersList": "Markers List",
  "assignedBoothDefault": "Assigned Booth Default",
  "unassignedBoothDefault": "Unassigned Booth Default",
  "globalDefaultForBoothMarkers": "Global Default for Booth Markers",
  "editMode": "Edit Mode",
  "finishEditing": "Finish Editing",
  "doneEditing": "Done",
  "aboutDefaultMarkers": "About Default Markers",
  "defaultAppearanceAssigned": "This defines the default appearance for booth markers (ID < 1000) that have a company assigned.",
  "defaultAppearanceUnassigned": "This defines the default appearance for booth markers (ID < 1000) that have no company assigned.",
  "overrideDefaultsNote": "Individual booth markers can override these defaults by having their own values in the Appearance table.",
  "defaultVisualStyling": "Default Visual Styling",
  "visualStyling": "Visual Styling",
  "boothContentManaged": "Booth - Content managed via Companies/Assignments",
  "positionAndStructure": "Position & Structure"
};

const newNlKeys = {
  "subscriptionList": "Abonnementenlijst",
  "markersList": "Markerlijst",
  "assignedBoothDefault": "Standaard Toegewezen Kraam",
  "unassignedBoothDefault": "Standaard Niet-toegewezen Kraam",
  "globalDefaultForBoothMarkers": "Algemene Standaard voor Kraam Markers",
  "editMode": "Bewerkingsmodus",
  "finishEditing": "Bewerken Voltooien",
  "doneEditing": "Klaar",
  "aboutDefaultMarkers": "Over Standaard Markers",
  "defaultAppearanceAssigned": "Dit definieert de standaardweergave voor kraam markers (ID < 1000) waaraan een bedrijf is toegewezen.",
  "defaultAppearanceUnassigned": "Dit definieert de standaardweergave voor kraam markers (ID < 1000) waaraan geen bedrijf is toegewezen.",
  "overrideDefaultsNote": "Individuele kraam markers kunnen deze standaarden overschrijven door hun eigen waarden in de Weergave-tabel in te vullen.",
  "defaultVisualStyling": "Standaard Visuele Stijl",
  "visualStyling": "Visuele Stijl",
  "boothContentManaged": "Kraam - Inhoud beheerd via Bedrijven/Toewijzingen",
  "positionAndStructure": "Positie & Structuur"
};

Object.assign(en.mapManagement, newEnKeys);
Object.assign(nl.mapManagement, newNlKeys);

fs.writeFileSync('src/locales/en.json', JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/locales/nl.json', JSON.stringify(nl, null, 2) + '\n', 'utf8');

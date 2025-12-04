/**
 * Visitor View Tour Configurations
 *
 * Tours for public-facing user features
 */

export const visitorWelcomeTour = {
  scope: 'visitor',
  id: 'visitor-welcome',
  autoStart: true,
  roles: null, // Available to all users
  steps: [
    {
      element: 'body',
      popover: {
        title: {
          en: 'Welcome to 4x4 Vakantiebeurs!',
          nl: 'Welkom bij 4x4 Vakantiebeurs!'
        },
        description: {
          en: 'Let us show you around! This quick tour will help you discover exhibitors, explore the interactive map, and plan your visit.',
          nl: 'Laten we je rondleiden! Deze korte rondleiding helpt je exposanten te ontdekken, de interactieve kaart te verkennen en je bezoek te plannen.'
        },
        side: 'center',
        align: 'center',
      },
    },
    {
      element: '.tab-navigation',
      popover: {
        title: {
          en: 'Navigation Tabs',
          nl: 'Navigatie Tabbladen'
        },
        description: {
          en: 'Use these tabs to navigate between Home, Map, Exhibitors, and Schedule. The tabs are always available at the bottom of the screen.',
          nl: 'Gebruik deze tabbladen om te navigeren tussen Home, Kaart, Exposanten en Programma. De tabbladen zijn altijd beschikbaar onderaan het scherm.'
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.language-selector',
      popover: {
        title: {
          en: 'Change Language',
          nl: 'Taal Wijzigen'
        },
        description: {
          en: 'Switch between English, Dutch, and German at any time using the language selector.',
          nl: 'Schakel op elk moment tussen Engels, Nederlands en Duits met de taalkeuze.'
        },
        side: 'left',
        align: 'start',
      },
    },
    {
      element: 'body',
      popover: {
        title: {
          en: 'That\'s it!',
          nl: 'Dat is het!'
        },
        description: {
          en: 'You\'re all set! Explore the map to find exhibitors, check the schedule for activities, and favorite your must-visit booths. Enjoy the event!',
          nl: 'Je bent helemaal klaar! Verken de kaart om exposanten te vinden, bekijk het programma voor activiteiten, en markeer je must-visit stands als favoriet. Geniet van het evenement!'
        },
        side: 'center',
        align: 'center',
      },
    },
  ],
};

export const visitorMapTour = {
  scope: 'visitor',
  id: 'visitor-map',
  autoStart: false,
  roles: null,
  steps: [
    {
      element: '.leaflet-container',
      popover: {
        title: {
          en: 'Interactive Map',
          nl: 'Interactieve Kaart'
        },
        description: {
          en: 'This interactive map shows all exhibitor locations at the event venue. Click on markers to see company details.',
          nl: 'Deze interactieve kaart toont alle exposantenlocaties op het eventterrein. Klik op markers om bedrijfsdetails te zien.'
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.leaflet-control-search',
      popover: {
        title: {
          en: 'Search Exhibitors',
          nl: 'Exposanten Zoeken'
        },
        description: {
          en: 'Use the search bar to quickly find specific exhibitors by name. The map will zoom to their location.',
          nl: 'Gebruik de zoekbalk om snel specifieke exposanten op naam te vinden. De kaart zoomt naar hun locatie.'
        },
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.leaflet-marker-icon:first-of-type',
      popover: {
        title: {
          en: 'Exhibitor Markers',
          nl: 'Exposant Markers'
        },
        description: {
          en: 'Each marker represents an exhibitor booth. Click any marker to view company information, contact details, and add to favorites.',
          nl: 'Elke marker vertegenwoordigt een exposantenstand. Klik op een marker om bedrijfsinformatie, contactgegevens te bekijken en toe te voegen aan favorieten.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.favorites-toggle',
      popover: {
        title: {
          en: 'Favorites System',
          nl: 'Favorieten Systeem'
        },
        description: {
          en: 'Star exhibitors to save them as favorites. Use the favorites filter to show only your saved exhibitors on the map.',
          nl: 'Markeer exposanten met een ster om ze als favorieten op te slaan. Gebruik het favorietenfilter om alleen je opgeslagen exposanten op de kaart te tonen.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.leaflet-control-layers',
      popover: {
        title: {
          en: 'Map Layers',
          nl: 'Kaartlagen'
        },
        description: {
          en: 'Switch between different map views using the layer control. Try the satellite view for a detailed aerial perspective.',
          nl: 'Schakel tussen verschillende kaartweergaven met de laagbesturing. Probeer de satellietweergave voor een gedetailleerd luchtperspectief.'
        },
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '.leaflet-control-zoom',
      popover: {
        title: {
          en: 'Zoom Controls',
          nl: 'Zoom Besturing'
        },
        description: {
          en: 'Zoom in and out using these controls, or use pinch gestures on mobile devices. The map adapts marker sizes based on zoom level.',
          nl: 'Zoom in en uit met deze besturing, of gebruik knijpgebaren op mobiele apparaten. De kaart past markergroottes aan op basis van het zoomniveau.'
        },
        side: 'left',
        align: 'start',
      },
    },
  ],
};

export const visitorExhibitorsTour = {
  scope: 'visitor',
  id: 'visitor-exhibitors',
  autoStart: false,
  roles: null,
  steps: [
    {
      element: '.exhibitors-list',
      popover: {
        title: {
          en: 'Exhibitor List',
          nl: 'Exposantenlijst'
        },
        description: {
          en: 'Browse all exhibitors in a convenient list view. Each card shows company logo, booth number, and category.',
          nl: 'Blader door alle exposanten in een handige lijstweergave. Elke kaart toont bedrijfslogo, standnummer en categorie.'
        },
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.exhibitors-search',
      popover: {
        title: {
          en: 'Search Companies',
          nl: 'Bedrijven Zoeken'
        },
        description: {
          en: 'Search for exhibitors by company name, booth number, or keywords. Results update instantly as you type.',
          nl: 'Zoek naar exposanten op bedrijfsnaam, standnummer of trefwoorden. Resultaten worden direct bijgewerkt terwijl je typt.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.category-filter',
      popover: {
        title: {
          en: 'Filter by Category',
          nl: 'Filter op Categorie'
        },
        description: {
          en: 'Filter exhibitors by category to find companies in specific industries. Select multiple categories to refine your search.',
          nl: 'Filter exposanten op categorie om bedrijven in specifieke sectoren te vinden. Selecteer meerdere categorieën om je zoekopdracht te verfijnen.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.exhibitor-card:first-of-type',
      popover: {
        title: {
          en: 'Company Cards',
          nl: 'Bedrijfskaarten'
        },
        description: {
          en: 'Click any exhibitor card to expand and view full details including contact information, website, and booth location.',
          nl: 'Klik op een exposantenkaart om uit te vouwen en volledige details te bekijken, inclusief contactinformatie, website en standlocatie.'
        },
        side: 'bottom',
        align: 'center',
      },
    },
  ],
};

/**
 * Get all visitor tours
 */
export function getAllVisitorTours() {
  return [
    visitorWelcomeTour,
    visitorMapTour,
    visitorExhibitorsTour,
  ];
}

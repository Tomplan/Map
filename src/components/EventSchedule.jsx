import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiClockOutline, mdiMapMarker, mdiAlert } from '@mdi/js';
import { useEventActivities } from '../hooks/useEventActivities';

/**
 * EventSchedule - Timeline of event activities
 * Loads program data from database with live booth numbers
 * Admins can manage activities via Settings → Program Management
 */
export default function EventSchedule({ selectedYear }) {
  const { t, i18n } = useTranslation();
  const [selectedDay, setSelectedDay] = useState('saturday');
  const lang = i18n.language || 'en';
  
  // Load activities from database
  const { activities: activityData, loading, error, getActivityLocation } = useEventActivities();
  
  // Select activities for current day
  const activities = selectedDay === 'saturday' ? activityData.saturday : activityData.sunday;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600">{lang === 'en' ? 'Loading schedule...' : 'Programma laden...'}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Icon path={mdiAlert} size={2} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
            {lang === 'en' ? 'Unable to load schedule' : 'Kan programma niet laden'}
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  /* Hardcoded data removed - now loaded from database
  const saturdayActivities = [
    {
      id: 'sat-1',
      title: { nl: 'Beursvloer', en: 'Exhibition Floor' },
      description: { 
        nl: 'De beurs is de gehele dag geopend voor publiek. Bezoek de ruim 80 standhouders en doe inspiratie op voor jouw volgende 4x4 avontuur.',
        en: 'The fair is open all day to the public. Visit over 80 exhibitors and get inspired for your next 4x4 adventure.'
      },
      startTime: '10:00',
      endTime: '17:00',
      location: { nl: 'Beursterrein', en: 'Fairgrounds' },
      badge: { nl: 'GRATIS ENTREE!', en: 'FREE ENTRY!' },
    },
    {
      id: 'sat-2',
      title: { nl: 'BeNeLux Primeur: BruderX!', en: 'BeNeLux Premiere: BruderX!' },
      description: { 
        nl: 'Voor het eerst in Nederland te zien: de BruderX! Dé offroad caravan uit Australië. Te zien op de stand van Camp-Impuls.',
        en: 'For the first time in the Netherlands: the BruderX! The offroad caravan from Australia. See it at the Camp-Impuls booth.'
      },
      startTime: '10:00',
      endTime: '17:00',
      location: { nl: 'Stand Camp-Impuls', en: 'Camp-Impuls Booth' },
    },
    {
      id: 'sat-3',
      title: { nl: 'Europese Primeur: PATIO Air-5', en: 'European Premiere: PATIO Air-5' },
      description: { 
        nl: 'De Europese primeur van de PATIO Air-5 tenttrailer. Deze Zuid-Koreaanse alleskunner laat zien dat het ook anders kan. Te zien op de stand van TentVent.',
        en: 'The European premiere of the PATIO Air-5 tent trailer. This South Korean all-rounder shows that things can be done differently. See it at the TentVent booth.'
      },
      startTime: '10:00',
      endTime: '17:00',
      location: { nl: 'Stand TentVent', en: 'TentVent Booth' },
    },
    {
      id: 'sat-4',
      title: { nl: 'Tentoonstelling 40 jaar VW Syncro', en: 'Exhibition: 40 Years VW Syncro' },
      description: { 
        nl: 'In samenwerking met de VW Bus Club Nederland kun je een aantal unieke Syncro\'s aanschouwen. 40 jaar Volkswagen 4x4 historie!',
        en: 'In collaboration with VW Bus Club Nederland, you can see several unique Syncros. 40 years of Volkswagen 4x4 history!'
      },
      startTime: '10:00',
      endTime: '17:00',
      location: { nl: 'Parkeerterrein entree', en: 'Entrance Parking Area' },
    },
    {
      id: 'sat-5',
      title: { nl: 'RC Auto\'s', en: 'RC Cars' },
      description: { 
        nl: 'Geweldige baan waar met RC auto\'s gereden kan worden. Heb je zelf een auto? Neem hem mee! Geen auto? Ook proberen kan!',
        en: 'Great track where you can drive RC cars. Have your own car? Bring it along! No car? You can still try!'
      },
      startTime: '10:00',
      endTime: '17:00',
      location: { nl: 'Waterfront', en: 'Waterfront' },
    },
    {
      id: 'sat-6',
      title: { nl: 'LRCH Members: Jubileum Toertocht', en: 'LRCH Members: Anniversary Tour' },
      description: { 
        nl: 'Speciale 4x4 Vakantiebeurs Jubileum-toertocht, uitgezet door de Allroad Commissie. Exclusief voor LRCH leden.',
        en: 'Special 4x4 Holiday Fair Anniversary tour, organized by the Allroad Committee. Exclusive for LRCH members.'
      },
      startTime: '10:00',
      endTime: '16:00',
      location: { nl: 'Parkeerplaats Slijk-Ewijk', en: 'Slijk-Ewijk Parking' },
      badge: { nl: 'Leden only', en: 'Members only' },
    },
    {
      id: 'sat-7',
      title: { nl: 'Offroad Rijden', en: 'Offroad Driving' },
      description: { 
        nl: 'Ga zelf met jouw 4x4 het terrein in! GRATIS voor leden van de LRCH. Niet-leden betalen €20,-',
        en: 'Drive your own 4x4 offroad! FREE for LRCH members. Non-members pay €20'
      },
      startTime: '10:00',
      endTime: '16:30',
      location: { nl: 'Offroad terrein', en: 'Off-road Terrain' },
    },
    {
      id: 'sat-8',
      title: { nl: 'LRCH Nieuwe Leden Dag', en: 'LRCH New Members Day' },
      description: { 
        nl: 'Nieuwe leden worden wegwijs gemaakt binnen de club. Ontmoet bestuursleden en leer over commissies en evenementen.',
        en: 'New members get acquainted with the club. Meet board members and learn about committees and events.'
      },
      startTime: '11:00',
      endTime: '12:00',
      location: { nl: 'The Beach House', en: 'The Beach House' },
    },
    {
      id: 'sat-9',
      title: { nl: 'RC Vliegen met Watervliegtuigen', en: 'RC Flying with Seaplanes' },
      description: { 
        nl: 'Vliegclub Nimbus geeft spectaculaire demonstraties met radiografisch bestuurde watervliegtuigen.',
        en: 'Flying Club Nimbus gives spectacular demonstrations with radio-controlled seaplanes.'
      },
      startTime: '11:00',
      endTime: '12:30',
      location: { nl: 'Waterfront', en: 'Waterfront' },
    },
    {
      id: 'sat-10',
      title: { nl: 'RC Vliegen met Watervliegtuigen', en: 'RC Flying with Seaplanes' },
      description: { 
        nl: 'Vliegclub Nimbus geeft spectaculaire demonstraties met radiografisch bestuurde watervliegtuigen.',
        en: 'Flying Club Nimbus gives spectacular demonstrations with radio-controlled seaplanes.'
      },
      startTime: '13:00',
      endTime: '15:00',
      location: { nl: 'Waterfront', en: 'Waterfront' },
    },
    {
      id: 'sat-11',
      title: { nl: 'Meerijden met Land Rover Defender', en: 'Ride Along in Land Rover Defender' },
      description: { 
        nl: 'Omnivents 4x4 laat jouw droom in vervulling gaan! Stap in en rijd mee in het offroad parcours.',
        en: 'Omnivents 4x4 makes your dream come true! Get in and ride along on the offroad course.'
      },
      startTime: '11:00',
      endTime: '16:00',
      location: { nl: 'Offroad terrein', en: 'Off-road Terrain' },
    },
    {
      id: 'sat-12',
      title: { nl: 'Magic Moments met Tim Horsting', en: 'Magic Moments with Tim Horsting' },
      description: { 
        nl: 'Laat je verrassen en beleef magische momenten met Tim Horsting! Bekend van TV.',
        en: 'Be amazed and experience magical moments with Tim Horsting! Known from TV.'
      },
      startTime: '12:00',
      endTime: '15:00',
      location: { nl: 'Beursvloer', en: 'Exhibition Floor' },
    },
    {
      id: 'sat-13',
      title: { nl: 'DJ Lungarno', en: 'DJ Lungarno' },
      description: { 
        nl: 'Feestvreugde op het beursterrein met ontspannen lounge en uptempo disco klassiekers!',
        en: 'Party vibes at the fairgrounds with relaxed lounge and uptempo disco classics!'
      },
      startTime: '14:00',
      endTime: '17:00',
      location: { nl: 'Waterside', en: 'Waterside' },
    },
  ];

  const sundayActivities = [
    {
      id: 'sun-1',
      title: { nl: 'Beursvloer', en: 'Exhibition Floor' },
      description: { 
        nl: 'De beurs is de gehele dag geopend voor publiek. Bezoek de ruim 80 standhouders en doe inspiratie op voor jouw volgende 4x4 avontuur.',
        en: 'The fair is open all day to the public. Visit over 80 exhibitors and get inspired for your next 4x4 adventure.'
      },
      startTime: '10:00',
      endTime: '16:00',
      location: { nl: 'Beursterrein', en: 'Fairgrounds' },
      badge: { nl: 'GRATIS ENTREE!', en: 'FREE ENTRY!' },
    },
    {
      id: 'sun-2',
      title: { nl: 'BeNeLux Primeur: BruderX!', en: 'BeNeLux Premiere: BruderX!' },
      description: { 
        nl: 'Voor het eerst in Nederland te zien: de BruderX! Dé offroad caravan uit Australië. Te zien op de stand van Camp-Impuls.',
        en: 'For the first time in the Netherlands: the BruderX! The offroad caravan from Australia. See it at the Camp-Impuls booth.'
      },
      startTime: '10:00',
      endTime: '16:00',
      location: { nl: 'Stand Camp-Impuls', en: 'Camp-Impuls Booth' },
    },
    {
      id: 'sun-3',
      title: { nl: 'Europese Primeur: PATIO Air-5', en: 'European Premiere: PATIO Air-5' },
      description: { 
        nl: 'De Europese primeur van de PATIO Air-5 tenttrailer. Deze Zuid-Koreaanse alleskunner laat zien dat het ook anders kan. Te zien op de stand van TentVent.',
        en: 'The European premiere of the PATIO Air-5 tent trailer. This South Korean all-rounder shows that things can be done differently. See it at the TentVent booth.'
      },
      startTime: '10:00',
      endTime: '16:00',
      location: { nl: 'Stand TentVent', en: 'TentVent Booth' },
    },
    {
      id: 'sun-4',
      title: { nl: 'Tentoonstelling 40 jaar VW Syncro', en: 'Exhibition: 40 Years VW Syncro' },
      description: { 
        nl: 'In samenwerking met de VW Bus Club Nederland kun je een aantal unieke Syncro\'s aanschouwen. 40 jaar Volkswagen 4x4 historie!',
        en: 'In collaboration with VW Bus Club Nederland, you can see several unique Syncros. 40 years of Volkswagen 4x4 history!'
      },
      startTime: '10:00',
      endTime: '16:00',
      location: { nl: 'Parkeerterrein entree', en: 'Entrance Parking Area' },
    },
    {
      id: 'sun-5',
      title: { nl: 'RC Auto\'s', en: 'RC Cars' },
      description: { 
        nl: 'Geweldige baan waar met RC auto\'s gereden kan worden. Heb je zelf een auto? Neem hem mee! Geen auto? Ook proberen kan!',
        en: 'Great track where you can drive RC cars. Have your own car? Bring it along! No car? You can still try!'
      },
      startTime: '10:00',
      endTime: '16:00',
      location: { nl: 'Waterfront', en: 'Waterfront' },
    },
    {
      id: 'sun-6',
      title: { nl: 'LRCH Members: Jubileum Toertocht', en: 'LRCH Members: Anniversary Tour' },
      description: { 
        nl: 'Speciale 4x4 Vakantiebeurs Jubileum-toertocht, uitgezet door de Allroad Commissie. Exclusief voor LRCH leden.',
        en: 'Special 4x4 Holiday Fair Anniversary tour, organized by the Allroad Committee. Exclusive for LRCH members.'
      },
      startTime: '10:00',
      endTime: '16:00',
      location: { nl: 'Parkeerplaats Slijk-Ewijk', en: 'Slijk-Ewijk Parking' },
      badge: { nl: 'Leden only', en: 'Members only' },
    },
    {
      id: 'sun-7',
      title: { nl: 'Tea on the Tailgate Meeting', en: 'Tea on the Tailgate Meeting' },
      description: { 
        nl: 'Internationaal initiatief om kleinschalig Land Rover meetings te organiseren onder het genot van \'a cup of tea\'. Met deelname uit de UK!',
        en: 'International initiative to organize small-scale Land Rover meetings while enjoying \'a cup of tea\'. With participants from the UK!'
      },
      startTime: '10:00',
      endTime: '16:00',
      location: { nl: 'Parkeerterrein entree', en: 'Entrance Parking Area' },
    },
    {
      id: 'sun-8',
      title: { nl: 'Offroad Rijden', en: 'Offroad Driving' },
      description: { 
        nl: 'Ga zelf met jouw 4x4 het terrein in! GRATIS voor leden van de LRCH. Niet-leden betalen €20,-',
        en: 'Drive your own 4x4 offroad! FREE for LRCH members. Non-members pay €20'
      },
      startTime: '10:00',
      endTime: '16:00',
      location: { nl: 'Offroad terrein', en: 'Off-road Terrain' },
    },
    {
      id: 'sun-9',
      title: { nl: 'LRCH Nieuwe Leden Dag', en: 'LRCH New Members Day' },
      description: { 
        nl: 'Nieuwe leden worden wegwijs gemaakt binnen de club. Ontmoet bestuursleden en leer over commissies en evenementen.',
        en: 'New members get acquainted with the club. Meet board members and learn about committees and events.'
      },
      startTime: '11:00',
      endTime: '12:00',
      location: { nl: 'The Beach House', en: 'The Beach House' },
    },
    {
      id: 'sun-10',
      title: { nl: 'RC Vliegen met Watervliegtuigen', en: 'RC Flying with Seaplanes' },
      description: { 
        nl: 'Vliegclub Nimbus geeft spectaculaire demonstraties met radiografisch bestuurde watervliegtuigen.',
        en: 'Flying Club Nimbus gives spectacular demonstrations with radio-controlled seaplanes.'
      },
      startTime: '11:00',
      endTime: '12:30',
      location: { nl: 'Waterfront', en: 'Waterfront' },
    },
    {
      id: 'sun-11',
      title: { nl: 'RC Vliegen met Watervliegtuigen', en: 'RC Flying with Seaplanes' },
      description: { 
        nl: 'Vliegclub Nimbus geeft spectaculaire demonstraties met radiografisch bestuurde watervliegtuigen.',
        en: 'Flying Club Nimbus gives spectacular demonstrations with radio-controlled seaplanes.'
      },
      startTime: '13:00',
      endTime: '15:00',
      location: { nl: 'Waterfront', en: 'Waterfront' },
    },
    {
      id: 'sun-12',
      title: { nl: 'Meerijden met Land Rover Defender', en: 'Ride Along in Land Rover Defender' },
      description: { 
        nl: 'Omnivents 4x4 laat jouw droom in vervulling gaan! Stap in en rijd mee in het offroad parcours.',
        en: 'Omnivents 4x4 makes your dream come true! Get in and ride along on the offroad course.'
      },
      startTime: '11:00',
      endTime: '15:00',
      location: { nl: 'Offroad terrein', en: 'Off-road Terrain' },
    },
    {
      id: 'sun-13',
      title: { nl: 'Magic Moments met Tim Horsting', en: 'Magic Moments with Tim Horsting' },
      description: { 
        nl: 'Laat je verrassen en beleef magische momenten met Tim Horsting! Bekend van TV.',
        en: 'Be amazed and experience magical moments with Tim Horsting! Known from TV.'
      },
      startTime: '11:00',
      endTime: '15:00',
      location: { nl: 'Beursvloer', en: 'Exhibition Floor' },
    },
  ]; */

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {lang === 'en' ? 'Program' : 'Programma'}
          </h1>

          {/* Warning Banner for Managers */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
            <div className="flex items-start gap-3">
              <Icon path={mdiAlert} size={1} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800 mb-1">
                  {lang === 'en' ? 'Note for Managers' : 'Let op!'}
                </p>
                <p className="text-sm text-yellow-700">
                  {lang === 'en'
                    ? 'This schedule shows 2025 program data (October 11-12, 2025). Please update for the 2026 event (October 10-11, 2026).'
                    : 'Dit programma toont 2025 gegevens (11-12 oktober 2025). Gelieve bij te werken voor het 2026 evenement (10-11 oktober 2026).'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Day Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDay('saturday')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDay === 'saturday'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {lang === 'en' ? 'Saturday October 10' : 'Zaterdag 10 oktober'}
            </button>
            <button
              onClick={() => setSelectedDay('sunday')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDay === 'sunday'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {lang === 'en' ? 'Sunday October 11' : 'Zondag 11 oktober'}
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {activities.map((activity) => {
            const location = getActivityLocation(activity, i18n.language);
            
            return (
              <div
                key={activity.id}
                className="bg-white rounded-lg shadow border-l-4 border-l-orange-600 p-4 transition-all hover:shadow-md"
              >
                {/* Time and Badge */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon path={mdiClockOutline} size={0.9} className="text-gray-600" />
                    <span className="font-semibold text-gray-900">
                      {activity.start_time} - {activity.end_time}
                    </span>
                  </div>
                  {(activity.badge_nl || activity.badge_en || activity.badge_de) && (
                    <span className="inline-block px-2 py-1 bg-orange-600 text-white text-xs font-semibold rounded">
                      {lang === 'nl' ? activity.badge_nl : lang === 'de' ? activity.badge_de : activity.badge_en}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {lang === 'nl' ? activity.title_nl : lang === 'de' ? activity.title_de : activity.title_en}
                </h3>

                {/* Description */}
                {(activity.description_nl || activity.description_en || activity.description_de) && (
                  <p className="text-gray-700 mb-3">
                    {lang === 'nl' ? activity.description_nl : lang === 'de' ? activity.description_de : activity.description_en}
                  </p>
                )}

                {/* Location with live booth number */}
                <div className="flex items-center gap-2 text-sm">
                  <Icon path={mdiMapMarker} size={0.8} className="text-orange-600" />
                  <span className="text-gray-700">
                    <span className="font-medium">{t('programManagement.location')}:</span>{' '}
                    {location.text}
                  </span>
                  {activity.show_location_type_badge && (
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      activity.location_type === 'exhibitor'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {(activity.location_type === 'exhibitor' || activity.location_type === 'company')
                            ? t('programManagement.exhibitor')
                            : t('programManagement.venue')
                          }
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

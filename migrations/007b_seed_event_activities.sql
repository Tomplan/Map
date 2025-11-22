-- Migration 007b: Seed event_activities with current program data
-- Purpose: Migrate hardcoded schedule from EventSchedule.jsx to database
-- Note: Company IDs for Camp-Impuls, TentVent, and Omnivents need to be updated with actual UUIDs

-- Get organization_id (assumes single organization for now)
DO $$
DECLARE
  v_org_id INT;
  v_camp_impuls_id BIGINT;
  v_tentvent_id BIGINT;
BEGIN
  -- Get the organization ID
  SELECT id INTO v_org_id FROM organization_profile LIMIT 1;
  
  -- Try to find company IDs by name (case-insensitive search)
  -- These may need manual verification after migration
  SELECT id INTO v_camp_impuls_id FROM companies 
  WHERE LOWER(name) LIKE '%camp%impuls%' OR LOWER(name) LIKE '%camp-impuls%' 
  LIMIT 1;
  
  SELECT id INTO v_tentvent_id FROM companies 
  WHERE LOWER(name) LIKE '%tentvent%' OR LOWER(name) LIKE '%tent%vent%'
  LIMIT 1;

  -- Check if all required companies were found
  IF v_camp_impuls_id IS NULL THEN
    RAISE EXCEPTION 'Cannot find Camp-Impuls company. Please create it first or update the search pattern.';
  END IF;
  
  IF v_tentvent_id IS NULL THEN
    RAISE EXCEPTION 'Cannot find TentVent company. Please create it first or update the search pattern.';
  END IF;

  -- Saturday Activities
  
  -- sat-1: Exhibition Floor (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    badge_nl, badge_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 1,
    'Beursvloer', 'Exhibition Floor',
    'De beurs is de gehele dag geopend voor publiek. Bezoek de ruim 80 standhouders en doe inspiratie op voor jouw volgende 4x4 avontuur.',
    'The fair is open all day to the public. Visit over 80 exhibitors and get inspired for your next 4x4 adventure.',
    '10:00', '17:00',
    'venue', 'Beursterrein', 'Fairgrounds',
    'GRATIS ENTREE!', 'FREE ENTRY!',
    true
  );

  -- sat-2: BruderX (exhibitor - Camp-Impuls)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, company_id,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 2,
    'BeNeLux Primeur: BruderX!', 'BeNeLux Premiere: BruderX!',
    'Voor het eerst in Nederland te zien: de BruderX! Dé offroad caravan uit Australië. Te zien op de stand van Camp-Impuls.',
    'For the first time in the Netherlands: the BruderX! The offroad caravan from Australia. See it at the Camp-Impuls booth.',
    '10:00', '17:00',
    'exhibitor', v_camp_impuls_id,
    true
  );

  -- sat-3: PATIO Air-5 (exhibitor - TentVent)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, company_id,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 3,
    'Europese Primeur: PATIO Air-5', 'European Premiere: PATIO Air-5',
    'De Europese primeur van de PATIO Air-5 tenttrailer. Deze Zuid-Koreaanse alleskunner laat zien dat het ook anders kan. Te zien op de stand van TentVent.',
    'The European premiere of the PATIO Air-5 tent trailer. This South Korean all-rounder shows that things can be done differently. See it at the TentVent booth.',
    '10:00', '17:00',
    'exhibitor', v_tentvent_id,
    true
  );

  -- sat-4: VW Syncro Exhibition (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 4,
    'Tentoonstelling 40 jaar VW Syncro', 'Exhibition: 40 Years VW Syncro',
    'In samenwerking met de VW Bus Club Nederland kun je een aantal unieke Syncro''s aanschouwen. 40 jaar Volkswagen 4x4 historie!',
    'In collaboration with VW Bus Club Nederland, you can see several unique Syncros. 40 years of Volkswagen 4x4 history!',
    '10:00', '17:00',
    'venue', 'Parkeerterrein entree', 'Entrance Parking Area',
    true
  );

  -- sat-5: RC Cars (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 5,
    'RC Auto''s', 'RC Cars',
    'Geweldige baan waar met RC auto''s gereden kan worden. Heb je zelf een auto? Neem hem mee! Geen auto? Ook proberen kan!',
    'Great track where you can drive RC cars. Have your own car? Bring it along! No car? You can still try!',
    '10:00', '17:00',
    'venue', 'Waterfront', 'Waterfront',
    true
  );

  -- sat-6: LRCH Jubileum (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    badge_nl, badge_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 6,
    'LRCH Members: Jubileum Toertocht', 'LRCH Members: Anniversary Tour',
    'Speciale 4x4 Vakantiebeurs Jubileum-toertocht, uitgezet door de Allroad Commissie. Exclusief voor LRCH leden.',
    'Special 4x4 Holiday Fair Anniversary tour, organized by the Allroad Committee. Exclusive for LRCH members.',
    '10:00', '16:00',
    'venue', 'Parkeerplaats Slijk-Ewijk', 'Slijk-Ewijk Parking',
    'Leden only', 'Members only',
    true
  );

  -- sat-7: Offroad Driving (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 7,
    'Offroad Rijden', 'Offroad Driving',
    'Ga zelf met jouw 4x4 het terrein in! GRATIS voor leden van de LRCH. Niet-leden betalen €20,-',
    'Drive your own 4x4 offroad! FREE for LRCH members. Non-members pay €20',
    '10:00', '16:30',
    'venue', 'Offroad terrein', 'Off-road Terrain',
    true
  );

  -- sat-8: LRCH New Members Day (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 8,
    'LRCH Nieuwe Leden Dag', 'LRCH New Members Day',
    'Nieuwe leden worden wegwijs gemaakt binnen de club. Ontmoet bestuursleden en leer over commissies en evenementen.',
    'New members get acquainted with the club. Meet board members and learn about committees and events.',
    '11:00', '12:00',
    'venue', 'The Beach House', 'The Beach House',
    true
  );

  -- sat-9: RC Flying Session 1 (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 9,
    'RC Vliegen met Watervliegtuigen', 'RC Flying with Seaplanes',
    'Vliegclub Nimbus geeft spectaculaire demonstraties met radiografisch bestuurde watervliegtuigen.',
    'Flying Club Nimbus gives spectacular demonstrations with radio-controlled seaplanes.',
    '11:00', '12:30',
    'venue', 'Waterfront', 'Waterfront',
    true
  );

  -- sat-10: RC Flying Session 2 (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 10,
    'RC Vliegen met Watervliegtuigen', 'RC Flying with Seaplanes',
    'Vliegclub Nimbus geeft spectaculaire demonstraties met radiografisch bestuurde watervliegtuigen.',
    'Flying Club Nimbus gives spectacular demonstrations with radio-controlled seaplanes.',
    '13:00', '15:00',
    'venue', 'Waterfront', 'Waterfront',
    true
  );

  -- sat-11: Land Rover Ride Along (venue - Omnivents activity)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 11,
    'Meerijden met Land Rover Defender', 'Ride Along in Land Rover Defender',
    'Omnivents 4x4 laat jouw droom in vervulling gaan! Stap in en rijd mee in het offroad parcours.',
    'Omnivents 4x4 makes your dream come true! Get in and ride along on the offroad course.',
    '11:00', '16:00',
    'venue', 'Offroad parcours', 'Offroad Course',
    true
  );

  -- sat-12: Magic Moments (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 12,
    'Magic Moments met Tim Horsting', 'Magic Moments with Tim Horsting',
    'Laat je verrassen en beleef magische momenten met Tim Horsting! Bekend van TV.',
    'Be amazed and experience magical moments with Tim Horsting! Known from TV.',
    '12:00', '15:00',
    'venue', 'Beursvloer', 'Exhibition Floor',
    true
  );

  -- sat-13: DJ Lungarno (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'saturday', 13,
    'DJ Lungarno', 'DJ Lungarno',
    'Feestvreugde op het beursterrein met ontspannen lounge en uptempo disco klassiekers!',
    'Party vibes at the fairgrounds with relaxed lounge and uptempo disco classics!',
    '14:00', '17:00',
    'venue', 'Waterside', 'Waterside',
    true
  );

  -- Sunday Activities

  -- sun-1: Exhibition Floor (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    badge_nl, badge_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 1,
    'Beursvloer', 'Exhibition Floor',
    'De beurs is de gehele dag geopend voor publiek. Bezoek de ruim 80 standhouders en doe inspiratie op voor jouw volgende 4x4 avontuur.',
    'The fair is open all day to the public. Visit over 80 exhibitors and get inspired for your next 4x4 adventure.',
    '10:00', '16:00',
    'venue', 'Beursterrein', 'Fairgrounds',
    'GRATIS ENTREE!', 'FREE ENTRY!',
    true
  );

  -- sun-2: BruderX (exhibitor - Camp-Impuls)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, company_id,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 2,
    'BeNeLux Primeur: BruderX!', 'BeNeLux Premiere: BruderX!',
    'Voor het eerst in Nederland te zien: de BruderX! Dé offroad caravan uit Australië. Te zien op de stand van Camp-Impuls.',
    'For the first time in the Netherlands: the BruderX! The offroad caravan from Australia. See it at the Camp-Impuls booth.',
    '10:00', '16:00',
    'exhibitor', v_camp_impuls_id,
    true
  );

  -- sun-3: PATIO Air-5 (exhibitor - TentVent)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, company_id,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 3,
    'Europese Primeur: PATIO Air-5', 'European Premiere: PATIO Air-5',
    'De Europese primeur van de PATIO Air-5 tenttrailer. Deze Zuid-Koreaanse alleskunner laat zien dat het ook anders kan. Te zien op de stand van TentVent.',
    'The European premiere of the PATIO Air-5 tent trailer. This South Korean all-rounder shows that things can be done differently. See it at the TentVent booth.',
    '10:00', '16:00',
    'exhibitor', v_tentvent_id,
    true
  );

  -- sun-4: VW Syncro Exhibition (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 4,
    'Tentoonstelling 40 jaar VW Syncro', 'Exhibition: 40 Years VW Syncro',
    'In samenwerking met de VW Bus Club Nederland kun je een aantal unieke Syncro''s aanschouwen. 40 jaar Volkswagen 4x4 historie!',
    'In collaboration with VW Bus Club Nederland, you can see several unique Syncros. 40 years of Volkswagen 4x4 history!',
    '10:00', '16:00',
    'venue', 'Parkeerterrein entree', 'Entrance Parking Area',
    true
  );

  -- sun-5: RC Cars (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 5,
    'RC Auto''s', 'RC Cars',
    'Geweldige baan waar met RC auto''s gereden kan worden. Heb je zelf een auto? Neem hem mee! Geen auto? Ook proberen kan!',
    'Great track where you can drive RC cars. Have your own car? Bring it along! No car? You can still try!',
    '10:00', '16:00',
    'venue', 'Waterfront', 'Waterfront',
    true
  );

  -- sun-6: LRCH Jubileum (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    badge_nl, badge_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 6,
    'LRCH Members: Jubileum Toertocht', 'LRCH Members: Anniversary Tour',
    'Speciale 4x4 Vakantiebeurs Jubileum-toertocht, uitgezet door de Allroad Commissie. Exclusief voor LRCH leden.',
    'Special 4x4 Holiday Fair Anniversary tour, organized by the Allroad Committee. Exclusive for LRCH members.',
    '10:00', '16:00',
    'venue', 'Parkeerplaats Slijk-Ewijk', 'Slijk-Ewijk Parking',
    'Leden only', 'Members only',
    true
  );

  -- sun-7: Tea on the Tailgate (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 7,
    'Tea on the Tailgate Meeting', 'Tea on the Tailgate Meeting',
    'Internationaal initiatief om kleinschalig Land Rover meetings te organiseren onder het genot van ''a cup of tea''. Met deelname uit de UK!',
    'International initiative to organize small-scale Land Rover meetings while enjoying ''a cup of tea''. With participants from the UK!',
    '10:00', '16:00',
    'venue', 'Parkeerterrein entree', 'Entrance Parking Area',
    true
  );

  -- sun-8: Offroad Driving (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 8,
    'Offroad Rijden', 'Offroad Driving',
    'Ga zelf met jouw 4x4 het terrein in! GRATIS voor leden van de LRCH. Niet-leden betalen €20,-',
    'Drive your own 4x4 offroad! FREE for LRCH members. Non-members pay €20',
    '10:00', '16:00',
    'venue', 'Offroad terrein', 'Off-road Terrain',
    true
  );

  -- sun-9: LRCH New Members Day (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 9,
    'LRCH Nieuwe Leden Dag', 'LRCH New Members Day',
    'Nieuwe leden worden wegwijs gemaakt binnen de club. Ontmoet bestuursleden en leer over commissies en evenementen.',
    'New members get acquainted with the club. Meet board members and learn about committees and events.',
    '11:00', '12:00',
    'venue', 'The Beach House', 'The Beach House',
    true
  );

  -- sun-10: RC Flying Session 1 (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 10,
    'RC Vliegen met Watervliegtuigen', 'RC Flying with Seaplanes',
    'Vliegclub Nimbus geeft spectaculaire demonstraties met radiografisch bestuurde watervliegtuigen.',
    'Flying Club Nimbus gives spectacular demonstrations with radio-controlled seaplanes.',
    '11:00', '12:30',
    'venue', 'Waterfront', 'Waterfront',
    true
  );

  -- sun-11: RC Flying Session 2 (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 11,
    'RC Vliegen met Watervliegtuigen', 'RC Flying with Seaplanes',
    'Vliegclub Nimbus geeft spectaculaire demonstraties met radiografisch bestuurde watervliegtuigen.',
    'Flying Club Nimbus gives spectacular demonstrations with radio-controlled seaplanes.',
    '13:00', '15:00',
    'venue', 'Waterfront', 'Waterfront',
    true
  );

  -- sun-12: Land Rover Ride Along (venue - Omnivents activity)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 12,
    'Meerijden met Land Rover Defender', 'Ride Along in Land Rover Defender',
    'Omnivents 4x4 laat jouw droom in vervulling gaan! Stap in en rijd mee in het offroad parcours.',
    'Omnivents 4x4 makes your dream come true! Get in and ride along on the offroad course.',
    '11:00', '15:00',
    'venue', 'Offroad parcours', 'Offroad Course',
    true
  );

  -- sun-13: Magic Moments (venue)
  INSERT INTO event_activities (
    organization_id, day, display_order,
    title_nl, title_en,
    description_nl, description_en,
    start_time, end_time,
    location_type, location_nl, location_en,
    is_active
  ) VALUES (
    v_org_id, 'sunday', 13,
    'Magic Moments met Tim Horsting', 'Magic Moments with Tim Horsting',
    'Laat je verrassen en beleef magische momenten met Tim Horsting! Bekend van TV.',
    'Be amazed and experience magical moments with Tim Horsting! Known from TV.',
    '11:00', '15:00',
    'venue', 'Beursvloer', 'Exhibition Floor',
    true
  );

  -- Log results
  RAISE NOTICE 'Successfully seeded % activities for organization %', 
    (SELECT COUNT(*) FROM event_activities WHERE organization_id = v_org_id),
    v_org_id;
    
  RAISE NOTICE 'Linked companies: Camp-Impuls (%), TentVent (%)',
    v_camp_impuls_id, v_tentvent_id;
END $$;

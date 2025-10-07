import { PatientCase } from './types';

/**
 * Ms. Esposito - 31F with Pyelonephritis
 *
 * Learning Focus: Fever, flank pain, urinary symptoms
 * Diagnosis: Acute pyelonephritis (kidney infection)
 */
export const msEsposito: PatientCase = {
  id: 'ms-esposito',
  name: 'Ms. Esposito',
  age: 31,
  gender: 'F',
  diagnosis: 'Pyelonephritis',
  course: 'RMD 561 - Clinical Reasoning Rounds',

  triageNote: 'Woke at 06:00 with fever (102.5°F) and chills. Fatigue × 3 days; right-sided abdominal/flank pain. Returned from Dominican Republic 2 days ago. History: ruptured ectopic pregnancy 2018. POC pregnancy test negative.',

  greeting: 'Hi, my name is Ms Esposito. I am here for my clinical visit. I hope you can help me!',

  qaScript: [
    {
      patterns: ['What brings you in today', 'Why are you here', 'Chief complaint'],
      response: 'I woke up this morning with a high fever and a really bad pain along my right side.',
      facts: ['fever', 'flank_pain']
    },
    {
      patterns: ['When did the symptoms start', 'When did this begin', 'How long'],
      response: 'The tiredness began a couple of days ago on my trip, but the fever and pain hit early this morning.',
      facts: ['onset_timing']
    },
    {
      patterns: ['Do you have chills', 'Feeling cold', 'Shaking chills'],
      response: 'Yes, I\'ve been shaking and feeling really cold even though I have a fever.',
      facts: ['fever_chills']
    },
    {
      patterns: ['What was your temperature', 'How high was the fever'],
      response: '102.5 when I checked this morning.',
      facts: ['fever_chills']
    },
    {
      patterns: ['Any burning when you pee', 'Dysuria', 'Pain with urination', 'Burning urination'],
      response: 'Yes—last night it tingled, and this morning it definitely burned.',
      facts: ['dysuria']
    },
    {
      patterns: ['Are you sexually active', 'Sexual activity', 'Sexual history'],
      response: 'Yes, with my partner of seven years—we\'re monogamous.',
      facts: ['sexual_history']
    },
    {
      patterns: ['Any medication allergies', 'Allergies', 'Drug allergies'],
      response: 'Penicillin—I got a rash as a kid.',
      facts: ['penicillin_allergy']
    },
    {
      patterns: ['Where is the pain', 'Pain location', 'Where does it hurt'],
      response: 'On the right side of my belly, more my flank really.',
      facts: ['flank_pain']
    },
    {
      patterns: ['When did the pain start', 'Pain onset'],
      response: 'Around six this morning.',
      facts: ['onset_timing']
    },
    {
      patterns: ['Recent travel', 'Trip', 'Vacation'],
      response: 'I got back from the Dominican Republic two days ago.',
      facts: ['travel_history']
    },
    {
      patterns: ['Pregnant', 'Pregnancy test'],
      response: 'The test they did here was negative.'
    },
    {
      patterns: ['What does the pain feel like', 'Describe pain', 'Pain quality'],
      response: 'It\'s kind of crampy usually but sometimes kind of sharp.',
      facts: ['pain_quality']
    },
    {
      patterns: ['How bad is the pain', 'Pain severity', 'Rate the pain'],
      response: 'About a seven out of ten.',
      facts: ['pain_severity']
    },
    {
      patterns: ['Constant or intermittent', 'Comes and goes'],
      response: 'It\'s constant, sometimes it will get even worse but I haven\'t gotten much relief.',
      facts: ['pain_quality']
    },
    {
      patterns: ['Does it spread anywhere', 'Pain radiation', 'Shoot'],
      response: 'Sometimes it will shoot down to my groin on the same side.',
      facts: ['flank_pain']
    },
    {
      patterns: ['Medical history', 'Health problems', 'PMH', 'Conditions'],
      response: 'I have PCOS since 2014 and pre-diabetes. I also had an ectopic pregnancy that ruptured five years ago.',
      facts: ['pmh']
    },
    {
      patterns: ['Medications', 'Taking any medicine', 'Drugs', 'Meds'],
      response: 'Just triamcinolone lotion for my eczema when I need it.'
    },
    {
      patterns: ['Nausea', 'Vomiting', 'Throwing up'],
      response: 'I threw up once this morning when the pain got really bad. Not nauseous now though.'
    },
    {
      patterns: ['Cough', 'Breathing', 'Shortness of breath'],
      response: 'No cough or trouble breathing.'
    },
    {
      patterns: ['Last period', 'Menstrual period', 'LMP', 'Cycle'],
      response: 'About a week and a half ago. My periods are irregular though.',
      facts: ['lmp']
    },
    {
      patterns: ['Chest pain', 'Heart', 'Chest discomfort'],
      response: 'No chest pain.'
    },
    {
      patterns: ['Diarrhea', 'Bowel movements', 'Stomach issues'],
      response: 'No diarrhea. Had a bit of a rumbly stomach on vacation from the buffet.'
    },
    {
      patterns: ['Work', 'Job', 'Occupation'],
      response: 'I\'m a manager at Target.'
    },
    {
      patterns: ['Family', 'Children', 'Kids'],
      response: 'I have a three-year-old son, Antonio. He\'s healthy.'
    },
    {
      patterns: ['Smoking', 'Tobacco', 'Cigarettes'],
      response: 'No, I\'ve never smoked.'
    },
    {
      patterns: ['Alcohol', 'Drinking'],
      response: 'Just a glass or two of wine on special occasions.'
    },
    {
      patterns: ['Drugs', 'Recreational', 'Marijuana'],
      response: 'I use marijuana occasionally, maybe once or twice a month.'
    },
  ],

  mustElicitFacts: [
    {
      id: 'dysuria',
      keywords: ['burning', 'urination', 'pee', 'tingled', 'burned'],
      label: 'Dysuria (burning with urination)',
      category: 'symptoms'
    },
    {
      id: 'flank_pain',
      keywords: ['flank', 'right side', 'belly', 'groin', 'shoot'],
      label: 'Flank pain location/radiation',
      category: 'symptoms'
    },
    {
      id: 'pain_quality',
      keywords: ['crampy', 'sharp', 'constant'],
      label: 'Pain quality (crampy/sharp)',
      category: 'symptoms'
    },
    {
      id: 'pain_severity',
      keywords: ['seven', '7/10', 'severity'],
      label: 'Pain severity (7/10)',
      category: 'symptoms'
    },
    {
      id: 'fever_chills',
      keywords: ['fever', 'chills', '102', 'shaking', 'cold'],
      label: 'Fever and chills',
      category: 'symptoms'
    },
    {
      id: 'onset_timing',
      keywords: ['three days', '3 days', 'couple of days', 'six this morning', 'early this morning'],
      label: 'Onset timing (3 days)',
      category: 'symptoms'
    },
    {
      id: 'travel_history',
      keywords: ['dominican', 'republic', 'travel', 'trip', 'vacation'],
      label: 'Travel history (DR)',
      category: 'history'
    },
    {
      id: 'penicillin_allergy',
      keywords: ['penicillin', 'rash', 'allergy', 'allergic'],
      label: 'Penicillin allergy',
      category: 'allergies'
    },
    {
      id: 'sexual_history',
      keywords: ['sexual', 'partner', 'monogamous', 'seven years'],
      label: 'Sexual history',
      category: 'social'
    },
    {
      id: 'lmp',
      keywords: ['period', 'menstrual', 'lmp', 'week and a half', 'irregular'],
      label: 'Last menstrual period',
      category: 'history'
    },
    {
      id: 'pmh',
      keywords: ['pcos', 'pre-diabetes', 'ectopic', 'pregnancy', 'ruptured'],
      label: 'PMH (PCOS, ectopic)',
      category: 'history'
    }
  ],

  voiceConfig: {
    voiceName: 'en-US-AriaNeural',
    emotion: 'tired',
    pace: 'slow'
  },

  background: {
    occupation: 'Manager at Target',
    family: '3-year-old son Antonio (healthy), partner of 7 years',
    socialHistory: {
      smoking: 'Never smoked',
      alcohol: 'Glass or two of wine on special occasions',
      drugs: 'Marijuana occasionally (1-2x/month)'
    },
    medications: ['Triamcinolone lotion (as needed for eczema)'],
    allergies: ['Penicillin (rash as child)'],
    pmh: [
      'PCOS since 2014',
      'Pre-diabetes',
      'Ruptured ectopic pregnancy (5 years ago)'
    ]
  },

  learningObjectives: [
    'Practice focused history taking with OPQRST framework',
    'Develop differential diagnosis reasoning',
    'Balance open-ended and closed questions (empathy)',
    'Elicit key facts systematically (completeness)'
  ],

  behaviorNotes: 'Patient is tired from fever. Should sound uncomfortable but cooperative. Make students work for each fact - no volunteering information.'
};

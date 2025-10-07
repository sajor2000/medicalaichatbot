import { PatientCase } from './types';

/**
 * Mr. Johnson - 58M with Myocardial Infarction (Heart Attack)
 *
 * Learning Focus: Chest pain, cardiac risk factors, STEMI recognition
 * Diagnosis: Acute ST-Elevation Myocardial Infarction (STEMI)
 *
 * EXAMPLE PATIENT - Template for adding new cases
 */
export const mrJohnson: PatientCase = {
  id: 'mr-johnson',
  name: 'Mr. Johnson',
  age: 58,
  gender: 'M',
  diagnosis: 'ST-Elevation Myocardial Infarction (STEMI)',
  course: 'RMD 561 - Clinical Reasoning Rounds',

  triageNote: 'Arrived via EMS with crushing chest pain × 45 minutes. Pain radiates to left arm and jaw. Diaphoretic, pale. BP 160/95, HR 105. History: Type 2 diabetes, hypertension, 30 pack-year smoking history.',

  greeting: 'Hi doc, I\'m having really bad chest pain. It won\'t go away.',

  qaScript: [
    {
      patterns: ['What brings you in', 'Why are you here', 'Chief complaint'],
      response: 'I have this crushing pain in my chest. Started about 45 minutes ago.',
      facts: ['chest_pain', 'onset']
    },
    {
      patterns: ['Where is the pain', 'Show me where it hurts'],
      response: 'Right in the middle of my chest. *gestures to center of chest*',
      facts: ['chest_pain_location']
    },
    {
      patterns: ['Does it spread', 'radiate', 'go anywhere'],
      response: 'Yes, it goes down my left arm and up into my jaw.',
      facts: ['chest_pain_radiation']
    },
    {
      patterns: ['What does it feel like', 'Describe the pain', 'Pain quality'],
      response: 'Like someone is sitting on my chest. Really heavy, crushing feeling.',
      facts: ['chest_pain_quality']
    },
    {
      patterns: ['How bad is the pain', 'Pain severity', 'Rate'],
      response: '10 out of 10. Worst pain I\'ve ever had.',
      facts: ['pain_severity']
    },
    {
      patterns: ['What were you doing', 'Activity', 'What triggered'],
      response: 'I was mowing the lawn. Just pushing the mower and boom, hit me.',
      facts: ['exertional_trigger']
    },
    {
      patterns: ['Shortness of breath', 'Trouble breathing', 'SOB'],
      response: 'Yes, I can\'t catch my breath. Feel like I can\'t get enough air.',
      facts: ['shortness_of_breath']
    },
    {
      patterns: ['Nausea', 'Vomiting', 'Sick to stomach'],
      response: 'Yeah, I feel really nauseous. Haven\'t thrown up though.',
      facts: ['associated_symptoms']
    },
    {
      patterns: ['Sweating', 'Diaphoretic', 'Clammy'],
      response: 'I\'m sweating like crazy. My shirt is soaked.',
      facts: ['diaphoresis']
    },
    {
      patterns: ['Medical history', 'Health problems', 'PMH'],
      response: 'I have diabetes and high blood pressure. Been on medications for both for about 10 years.',
      facts: ['cardiac_risk_factors']
    },
    {
      patterns: ['Medications', 'Taking any medicine'],
      response: 'Metformin for my diabetes and lisinopril for blood pressure. Oh, and a baby aspirin every day.',
      facts: ['medications']
    },
    {
      patterns: ['Smoking', 'Tobacco', 'Cigarettes'],
      response: 'Yeah, I smoke about a pack a day. Been smoking since I was 18.',
      facts: ['smoking_history']
    },
    {
      patterns: ['Family history', 'Heart disease in family', 'Family'],
      response: 'My dad had a heart attack at 55. Died from it actually.',
      facts: ['family_history']
    },
    {
      patterns: ['Cholesterol', 'High cholesterol'],
      response: 'My doctor mentioned my cholesterol was high last year, but I haven\'t been taking anything for it.',
      facts: ['cardiac_risk_factors']
    },
    {
      patterns: ['Any allergies', 'Drug allergies'],
      response: 'No, no allergies to any medications.'
    },
    {
      patterns: ['Ever had this before', 'Previous episodes', 'Similar pain'],
      response: 'No, never anything like this. I\'ve had some heartburn before but nothing close to this bad.',
      facts: ['first_episode']
    }
  ],

  mustElicitFacts: [
    {
      id: 'chest_pain',
      keywords: ['chest', 'pain', 'crushing'],
      label: 'Chest pain (crushing quality)',
      category: 'symptoms'
    },
    {
      id: 'chest_pain_radiation',
      keywords: ['left arm', 'jaw', 'radiate', 'spread'],
      label: 'Radiation to arm/jaw',
      category: 'symptoms'
    },
    {
      id: 'onset',
      keywords: ['45 minutes', 'started', 'onset'],
      label: 'Onset timing (45 min)',
      category: 'symptoms'
    },
    {
      id: 'pain_severity',
      keywords: ['10/10', 'worst pain', 'severity'],
      label: 'Pain severity (10/10)',
      category: 'symptoms'
    },
    {
      id: 'shortness_of_breath',
      keywords: ['breath', 'breathing', 'air', 'sob'],
      label: 'Shortness of breath',
      category: 'symptoms'
    },
    {
      id: 'diaphoresis',
      keywords: ['sweating', 'diaphoretic', 'soaked', 'clammy'],
      label: 'Diaphoresis (sweating)',
      category: 'symptoms'
    },
    {
      id: 'exertional_trigger',
      keywords: ['mowing', 'activity', 'exertion', 'lawn'],
      label: 'Exertional trigger',
      category: 'symptoms'
    },
    {
      id: 'cardiac_risk_factors',
      keywords: ['diabetes', 'hypertension', 'high blood pressure', 'cholesterol'],
      label: 'Cardiac risk factors (DM, HTN)',
      category: 'history'
    },
    {
      id: 'smoking_history',
      keywords: ['smoking', 'pack a day', 'cigarettes', 'tobacco'],
      label: 'Smoking history (30 pack-years)',
      category: 'social'
    },
    {
      id: 'family_history',
      keywords: ['dad', 'father', 'heart attack', 'family history'],
      label: 'Family history (father MI at 55)',
      category: 'history'
    }
  ],

  voiceConfig: {
    voiceName: 'en-US-GuyNeural',
    emotion: 'distressed',
    pace: 'normal'
  },

  background: {
    occupation: 'Construction foreman',
    family: 'Married, two adult children',
    socialHistory: {
      smoking: 'Pack per day × 40 years (30 pack-years)',
      alcohol: 'Beer on weekends (2-3 drinks)',
      drugs: 'None'
    },
    medications: [
      'Metformin 1000mg BID',
      'Lisinopril 20mg daily',
      'Aspirin 81mg daily'
    ],
    allergies: ['No known drug allergies (NKDA)'],
    pmh: [
      'Type 2 Diabetes Mellitus (10 years)',
      'Hypertension (10 years)',
      'Hyperlipidemia (untreated)'
    ]
  },

  learningObjectives: [
    'Recognize acute MI presentation',
    'Elicit cardiac risk factors systematically',
    'Practice OPQRST framework for chest pain',
    'Identify STEMI warning signs requiring immediate intervention'
  ],

  behaviorNotes: 'Patient is anxious and in severe pain. Should appear distressed. Use shorter sentences due to pain/dyspnea. May interrupt to mention pain worsening.'
};

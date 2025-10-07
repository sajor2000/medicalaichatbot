/**
 * Patient Case Configuration Types
 *
 * This defines the structure for configuring standardized patient cases.
 * Each patient is defined in a separate file for easy management and scaling.
 */

export interface QAPattern {
  /** Patterns to match in student questions (case-insensitive) */
  patterns: string[];
  /** The exact response the patient should give */
  response: string;
  /** Which fact IDs this response reveals (for tracking) */
  facts?: string[];
}

export interface MustElicitFact {
  /** Unique identifier for this fact */
  id: string;
  /** Keywords that indicate student has elicited this fact */
  keywords: string[];
  /** Display label for the UI */
  label: string;
  /** Optional: Group facts by category */
  category?: 'symptoms' | 'history' | 'social' | 'medications' | 'allergies';
}

export interface VoiceConfig {
  /** Azure TTS voice name (e.g., 'en-US-AriaNeural') */
  voiceName: string;
  /** Emotional tone for voice mode */
  emotion?: 'tired' | 'anxious' | 'neutral' | 'distressed';
  /** Speaking pace */
  pace?: 'slow' | 'normal' | 'fast';
}

export interface PatientCase {
  /** Unique identifier (URL-safe) */
  id: string;

  /** Patient name as shown to students */
  name: string;

  /** Patient age */
  age: number;

  /** Patient gender */
  gender: 'M' | 'F' | 'Other';

  /** Actual diagnosis (hidden from students) */
  diagnosis: string;

  /** Course code (e.g., 'RMD 561') */
  course?: string;

  /** Triage note shown to students */
  triageNote: string;

  /** Patient's opening greeting (first thing they say) */
  greeting: string;

  /** Scripted Q&A pairs for consistent responses */
  qaScript: QAPattern[];

  /** Facts that students must elicit (tracked in UI) */
  mustElicitFacts: MustElicitFact[];

  /** Voice configuration for speech mode */
  voiceConfig: VoiceConfig;

  /** Additional patient background (optional) */
  background?: {
    occupation?: string;
    family?: string;
    socialHistory?: {
      smoking?: string;
      alcohol?: string;
      drugs?: string;
    };
    medications?: string[];
    allergies?: string[];
    pmh?: string[]; // Past medical history
  };

  /** Learning objectives for this case */
  learningObjectives?: string[];

  /** Special instructions for the AI patient behavior */
  behaviorNotes?: string;
}

export interface PatientRegistry {
  [patientId: string]: PatientCase;
}

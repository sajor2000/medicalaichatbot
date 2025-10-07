import { kv } from '@vercel/kv';

export type Mode = 'Patient' | 'CE' | 'Tutor';
export type Turn = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

const sessionKey = (caseId: string, sessionId: string) => `case:${caseId}:session:${sessionId}`;

export interface SessionData {
  mode: Mode;
  turns: Turn[];
  opened: boolean;
}

// In-memory fallback for local development without Vercel KV
const localStore = new Map<string, SessionData>();

export async function loadSession(caseId: string, sessionId: string): Promise<SessionData> {
  const key = sessionKey(caseId, sessionId);
  
  // Use Vercel KV if available, otherwise use in-memory store
  if (process.env.KV_REST_API_URL) {
    const data = await kv.get<SessionData>(key);
    return data ?? { mode: 'Patient', turns: [], opened: false };
  } else {
    return localStore.get(key) ?? { mode: 'Patient', turns: [], opened: false };
  }
}

export async function saveSession(caseId: string, sessionId: string, payload: SessionData) {
  const key = sessionKey(caseId, sessionId);
  
  // Use Vercel KV if available, otherwise use in-memory store
  if (process.env.KV_REST_API_URL) {
    await kv.set(key, payload, { ex: 60 * 60 * 24 * 7 }); // 7 day TTL
  } else {
    localStore.set(key, payload);
  }
}

export function nextModeFromUserText(txt: string, current: Mode): Mode {
  if (/^done$/i.test(txt.trim())) return 'Tutor';
  if (/^(CE help|Pause and explain|Summarize|Continue as patient)$/i.test(txt.trim())) return 'CE';
  return current;
}

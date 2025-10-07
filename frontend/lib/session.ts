export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SessionState {
  sessionId: string;
  studentId: string;
  caseId: string;
  conversation: Message[];
  elicitedFacts: Set<string>;
  questionCount: number;
  openEndedCount: number;
  mode: 'voice' | 'text';
  startedAt: string;
}

export function createSession(studentId: string = 'demo_student'): SessionState {
  return {
    sessionId: crypto.randomUUID(),
    studentId,
    caseId: 'RMD561_Esposito',
    conversation: [],
    elicitedFacts: new Set(),
    questionCount: 0,
    openEndedCount: 0,
    mode: 'text',
    startedAt: new Date().toISOString()
  };
}

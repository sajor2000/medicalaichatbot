# Ms. Esposito Voice Agent - Simplified Implementation Plan

## Overview
Production-ready voice + text agent deployed entirely on **Vercel** with Azure OpenAI Realtime API. Voice mode toggle included from day one.

---

## Architecture: Vercel-Only Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Deployment                         │
│                                                              │
│  ┌────────────────────┐         ┌─────────────────────┐    │
│  │   Next.js Frontend │────────▶│  API Routes         │    │
│  │   - Voice Toggle   │         │  /api/chat          │    │
│  │   - WebRTC Client  │         │  /api/realtime/token│    │
│  │   - Text Chat UI   │         │  /api/sessions/save │    │
│  └────────────────────┘         └─────────────────────┘    │
│                                           │                  │
└───────────────────────────────────────────┼──────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────┐
                          │  Azure OpenAI                   │
                          │  - Realtime API (voice)         │
                          │  - Chat Completions (text)      │
                          │  - gpt-4o-realtime-preview      │
                          └─────────────────────────────────┘
```

**Benefits:**
- ✅ Single deployment command: `vercel --prod`
- ✅ No Docker, no containers, no orchestration
- ✅ Automatic scaling (0 to 1000+ students)
- ✅ Built-in SSL, CDN, edge functions
- ✅ Cost: ~$0 for <100 students/month

---

## Project Structure

```
ai_med/
├── agent_prompt                    # Enhanced with voice guidance
├── data/
│   └── esposito_qa_script.json    # Standardized QA pairs
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── interview/[sessionId]/page.tsx  # Interview UI
│   │   └── api/
│   │       ├── chat/route.ts      # Text mode endpoint
│   │       ├── realtime/
│   │       │   └── token/route.ts # Voice mode token
│   │       └── sessions/
│   │           └── save/route.ts  # Save session data
│   ├── components/
│   │   ├── VoiceClient.tsx        # WebRTC voice handler
│   │   ├── TextChat.tsx           # Text chat component
│   │   └── ScoreDisplay.tsx       # Real-time metrics
│   ├── lib/
│   │   ├── grading.ts             # Scoring logic
│   │   └── session.ts             # Session state management
│   ├── package.json
│   └── next.config.js
├── claude.md                       # This file (reference)
└── IMPLEMENTATION_PLAN.md          # This file
```

---

## Phase 1: Enhanced System Prompt (30 minutes)

### Task 1.1: Merge Voice Optimizations into `agent_prompt`

**File:** `agent_prompt`

**Add after line 172 (after "Notes on improvements"):**

```markdown

---

VOICE MODE ENHANCEMENTS (for Realtime API)

When delivering responses via voice:

Natural Speech Patterns:
- Use realistic pacing with natural pauses
- Include occasional filler words ("um", "like", "you know") sparingly to sound human
- Show emotion through vocal tone when appropriate (worry, discomfort, relief)
- Pause slightly before sensitive topics (sexual history, symptoms)
- Speak faster when anxious about symptoms, slower when describing pain

Handling Unclear Audio:
- If student's speech is unclear: "Sorry, I didn't catch that. Could you repeat?"
- If you hear jargon you wouldn't know: "Could you explain what you mean by [term]?"

Brevity for Voice:
- 2-sentence maximum is even MORE critical for voice (listeners can't skim)
- Prefer 1 sentence when possible
- Use shorter sentences than you would in text

Emotional Authenticity:
- Sound tired/uncomfortable when discussing pain
- Show slight hesitation on sensitive questions (normal patient behavior)
- Relief in tone when student shows empathy
- Mild worry when describing concerning symptoms

Examples of Voice-Appropriate Responses:

Student: "What brings you in today?"
You: [slight fatigue in voice] "I woke up this morning with a really high fever and chills, and I've got this bad pain on my right side."
[Pause naturally, waiting for follow-up]

Student: "Where exactly is the pain?"
You: [gestures implied by tone] "It's on my right side, kind of in my flank area."
[Brief pause, then if needed:] "What else would you like to know about it?"

Student: "Are you sexually active?"
You: [slight hesitation, then matter-of-fact] "Yeah, um, with my partner of seven years. We're monogamous."
[Wait - don't elaborate]

CRITICAL: All other rules (2-sentence max, one-detail-per-turn, mode switching) remain EXACTLY the same whether in voice or text mode.
```

---

## Phase 2: Standardized QA Script (15 minutes)

### Task 2.1: Create QA Script JSON

**File:** `data/esposito_qa_script.json`

```json
{
  "case_id": "RMD561_Esposito",
  "patient": {
    "name": "Ms. Esposito",
    "age": 31,
    "sex": "F",
    "greeting": "Hi, my name is Ms Esposito. I am here for my clinical visit. I hope you can help me!"
  },
  "triage_note": "Ms. Esposito, 31F. Woke at 06:00 with fever (102.5°F) and chills. Fatigue × 3 days; right-sided abdominal/flank pain. Returned from Dominican Republic 2 days ago. History: ruptured ectopic pregnancy 2018 (right salpingectomy). POC pregnancy test negative.",

  "must_elicit_facts": [
    {
      "id": "dysuria",
      "keywords": ["burn", "urination", "pee", "urinate", "dysuria", "tingling"],
      "weight": 10
    },
    {
      "id": "flank_pain_location",
      "keywords": ["where", "location", "flank", "side", "abdomen"],
      "weight": 10
    },
    {
      "id": "pain_quality",
      "keywords": ["feel like", "describe", "quality", "type", "kind"],
      "weight": 8
    },
    {
      "id": "pain_severity",
      "keywords": ["how bad", "scale", "severity", "out of ten"],
      "weight": 7
    },
    {
      "id": "fever_chills",
      "keywords": ["fever", "temperature", "chills", "shaking"],
      "weight": 9
    },
    {
      "id": "onset_timing",
      "keywords": ["when start", "began", "onset", "how long"],
      "weight": 8
    },
    {
      "id": "travel_history",
      "keywords": ["travel", "trip", "vacation", "dominican"],
      "weight": 8
    },
    {
      "id": "allergies",
      "keywords": ["allergies", "allergic", "penicillin"],
      "weight": 10
    },
    {
      "id": "sexual_history",
      "keywords": ["sexually active", "partner", "sex", "contraception"],
      "weight": 7
    },
    {
      "id": "lmp",
      "keywords": ["period", "menstrual", "lmp", "last period"],
      "weight": 6
    },
    {
      "id": "pmh",
      "keywords": ["medical history", "conditions", "pmh", "pcos", "diabetes"],
      "weight": 6
    }
  ],

  "qa_pairs": [
    {
      "q": ["What brings you in today?", "Why are you here?", "chief complaint"],
      "a": "I woke up this morning with a high fever, chills, and a really bad pain along my right side."
    },
    {
      "q": ["When did the symptoms start?", "When did this begin?", "how long"],
      "a": "The tiredness began a couple of days ago on my trip, but the fever and pain hit early this morning."
    },
    {
      "q": ["Any burning when you pee?", "Dysuria?", "Pain with urination?", "burning urination"],
      "a": "Yes—last night it tingled, and this morning it definitely burned."
    },
    {
      "q": ["Are you sexually active?", "Sexual activity?", "sexual history"],
      "a": "Yes, with my partner of seven years—we're monogamous."
    },
    {
      "q": ["Any medication allergies?", "Allergies?", "allergic"],
      "a": "Penicillin—I got a rash as a kid."
    },
    {
      "q": ["Where is the pain?", "Pain location?", "where hurt"],
      "a": "On the right side of my belly, more my flank really."
    },
    {
      "q": ["When did it start?", "Pain onset?", "pain begin"],
      "a": "Around six this morning."
    },
    {
      "q": ["Travel?", "Recent travel?", "trip", "vacation"],
      "a": "I got back from the Dominican Republic two days ago."
    },
    {
      "q": ["Pregnant?", "Pregnancy test?"],
      "a": "The test they did here was negative."
    },
    {
      "q": ["Pain quality?", "What does the pain feel like?", "describe pain"],
      "a": "It's kind of crampy usually but sometimes kind of sharp."
    },
    {
      "q": ["Pain severity?", "How bad is the pain?", "scale"],
      "a": "About a seven out of ten."
    },
    {
      "q": ["Pain timing?", "Constant or intermittent?"],
      "a": "It's constant, sometimes it will get even worse but I haven't gotten much relief."
    },
    {
      "q": ["Pain radiation?", "Does it spread anywhere?", "radiate"],
      "a": "Sometimes it will shoot down to my groin on the same side."
    },
    {
      "q": ["medical history", "health problems", "conditions"],
      "a": "I have PCOS since 2014 and pre-diabetes. I also had an ectopic pregnancy that ruptured five years ago."
    },
    {
      "q": ["medications", "taking any medicine", "drugs"],
      "a": "Just triamcinolone lotion for my eczema when I need it."
    },
    {
      "q": ["nausea", "vomiting", "throwing up"],
      "a": "I threw up once this morning when the pain got really bad. Not nauseous now though."
    },
    {
      "q": ["cough", "breathing", "shortness of breath"],
      "a": "No cough or trouble breathing."
    },
    {
      "q": ["last period", "menstrual period", "lmp"],
      "a": "About a week and a half ago. My periods are irregular though."
    }
  ]
}
```

---

## Phase 3: Next.js Project Setup (20 minutes)

### Task 3.1: Initialize Project

```bash
cd /Users/JCR/Desktop/ai_med
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
cd frontend
npm install lucide-react class-variance-authority clsx tailwind-merge
```

### Task 3.2: Environment Variables

**File:** `frontend/.env.local`

```bash
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com
AZURE_OPENAI_KEY=your_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o-realtime-preview
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Task 3.3: Vercel Configuration

**File:** `frontend/vercel.json`

```json
{
  "env": {
    "AZURE_OPENAI_ENDPOINT": "@azure-openai-endpoint",
    "AZURE_OPENAI_KEY": "@azure-openai-key",
    "AZURE_OPENAI_DEPLOYMENT": "gpt-4o-realtime-preview"
  },
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

---

## Phase 4: API Routes (1 hour)

### Task 4.1: Realtime Token Endpoint

**File:** `frontend/app/api/realtime/token/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();

    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/realtime/sessions?api-version=2024-10-01-preview`,
      {
        method: 'POST',
        headers: {
          'api-key': process.env.AZURE_OPENAI_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.AZURE_OPENAI_DEPLOYMENT,
          voice: 'alloy',
          instructions: await getSystemPrompt(),
          modalities: ['text', 'audio'],
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          temperature: 0.7,
          max_response_output_tokens: 150
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      client_secret: data.client_secret.value,
      expires_at: data.client_secret.expires_at
    });

  } catch (error) {
    console.error('Realtime token error:', error);
    return NextResponse.json(
      { error: 'Failed to create voice session' },
      { status: 500 }
    );
  }
}

async function getSystemPrompt(): Promise<string> {
  const fs = require('fs').promises;
  const path = require('path');
  const promptPath = path.join(process.cwd(), '..', 'agent_prompt');
  return await fs.readFile(promptPath, 'utf-8');
}
```

### Task 4.2: Text Chat Endpoint

**File:** `frontend/app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, conversation = [] } = await request.json();

    const messages = [
      { role: 'system', content: await getSystemPrompt() },
      ...conversation,
      { role: 'user', content: message }
    ];

    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-08-01-preview`,
      {
        method: 'POST',
        headers: {
          'api-key': process.env.AZURE_OPENAI_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          max_tokens: 150,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}

async function getSystemPrompt(): Promise<string> {
  const fs = require('fs').promises;
  const path = require('path');
  const promptPath = path.join(process.cwd(), '..', 'agent_prompt');
  return await fs.readFile(promptPath, 'utf-8');
}
```

### Task 4.3: Session Save Endpoint

**File:** `frontend/app/api/sessions/save/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();

    // For MVP: Just log to console
    // Production: Save to Cosmos DB or similar
    console.log('Session saved:', {
      id: sessionData.session_id,
      student: sessionData.student_id,
      scores: sessionData.scores,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      session_id: sessionData.session_id
    });

  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    );
  }
}
```

---

## Phase 5: Frontend Components (2-3 hours)

### Task 5.1: Grading Logic

**File:** `frontend/lib/grading.ts`

```typescript
import qaScript from '../../data/esposito_qa_script.json';

export interface Scores {
  completeness: number;
  completeness_pct: number;
  empathy: number;
  elicited_count: number;
  total_required: number;
  missed_facts: string[];
  question_count: number;
  open_ended_count: number;
}

export function trackElicitedFacts(
  message: string,
  elicitedFacts: Set<string>
): void {
  const messageLower = message.toLowerCase();

  qaScript.must_elicit_facts.forEach(fact => {
    if (fact.keywords.some(kw => messageLower.includes(kw))) {
      elicitedFacts.add(fact.id);
    }
  });
}

export function classifyQuestion(message: string): 'open' | 'closed' | 'neutral' {
  const lower = message.toLowerCase().trim();

  const openPatterns = [
    'how are you', 'what brings', 'tell me', 'describe',
    'explain', 'what happened', 'how did', 'can you tell me'
  ];

  if (openPatterns.some(p => lower.includes(p))) return 'open';

  if (lower.match(/^(do you|did you|have you|are you|is |can you)/)) {
    return 'closed';
  }

  return 'neutral';
}

export function calculateScores(
  elicitedFacts: Set<string>,
  questionCount: number,
  openEndedCount: number
): Scores {
  const totalRequired = qaScript.must_elicit_facts.length;
  const elicitedCount = elicitedFacts.size;

  const completenessPct = totalRequired > 0
    ? (elicitedCount / totalRequired) * 100
    : 0;

  const completenessScore = Math.min(5, Math.max(1, Math.round(completenessPct / 20)));

  const empathyScore = questionCount > 0
    ? Math.min(5, Math.max(1, Math.round((openEndedCount / questionCount) * 5)))
    : 1;

  const missedFacts = qaScript.must_elicit_facts
    .filter(f => !elicitedFacts.has(f.id))
    .map(f => f.id);

  return {
    completeness: completenessScore,
    completeness_pct: Math.round(completenessPct),
    empathy: empathyScore,
    elicited_count: elicitedCount,
    total_required: totalRequired,
    missed_facts: missedFacts,
    question_count: questionCount,
    open_ended_count: openEndedCount
  };
}
```

### Task 5.2: Voice Client Component

**File:** `frontend/components/VoiceClient.tsx`

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from './ui/button';

interface VoiceClientProps {
  sessionId: string;
  onTranscript?: (text: string, isUser: boolean) => void;
}

export function VoiceClient({ sessionId, onTranscript }: VoiceClientProps) {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const startVoiceMode = async () => {
    try {
      setStatus('connecting');

      // Get token from backend
      const tokenRes = await fetch('/api/realtime/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!tokenRes.ok) throw new Error('Failed to get token');

      const { client_secret } = await tokenRes.json();

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle incoming audio
      pc.ontrack = (event) => {
        if (audioRef.current && event.streams[0]) {
          audioRef.current.srcObject = event.streams[0];
          audioRef.current.play();
        }
      };

      // Data channel for events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'response.audio_transcript.done') {
            onTranscript?.(msg.transcript, false);
          } else if (msg.type === 'conversation.item.input_audio_transcription.completed') {
            onTranscript?.(msg.transcript, true);
          }
        } catch (e) {
          console.error('Data channel message error:', e);
        }
      };

      // Create offer and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to Azure
      const sdpRes = await fetch(
        `${process.env.NEXT_PUBLIC_AZURE_ENDPOINT}/openai/realtime?api-version=2024-10-01-preview&deployment=${process.env.NEXT_PUBLIC_AZURE_DEPLOYMENT}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${client_secret}`,
            'Content-Type': 'application/sdp'
          },
          body: offer.sdp
        }
      );

      if (!sdpRes.ok) throw new Error('SDP exchange failed');

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });

      setStatus('connected');
      setIsActive(true);

    } catch (error) {
      console.error('Voice mode error:', error);
      setStatus('error');
      alert('Failed to start voice mode. Please try text mode.');
    }
  };

  const stopVoiceMode = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    setIsActive(false);
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      stopVoiceMode();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white border rounded-lg">
      {!isActive ? (
        <Button
          onClick={startVoiceMode}
          disabled={status === 'connecting'}
          size="lg"
          className="gap-2"
        >
          <Mic className="w-5 h-5" />
          {status === 'connecting' ? 'Connecting...' : 'Start Voice Mode'}
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Listening...</span>
          </div>
          <p className="text-xs text-gray-600 text-center">
            Speak naturally. Ms. Esposito will respond with voice.
          </p>
          <Button
            onClick={stopVoiceMode}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <MicOff className="w-4 h-4" />
            Stop Voice
          </Button>
        </>
      )}

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
```

### Task 5.3: Main Interview Page

**File:** `frontend/app/interview/[sessionId]/page.tsx`

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { VoiceClient } from '@/components/VoiceClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mic } from 'lucide-react';
import { calculateScores, trackElicitedFacts, classifyQuestion, Scores } from '@/lib/grading';
import qaScript from '@/data/esposito_qa_script.json';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function InterviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [elicitedFacts, setElicitedFacts] = useState(new Set<string>());
  const [questionCount, setQuestionCount] = useState(0);
  const [openEndedCount, setOpenEndedCount] = useState(0);
  const [scores, setScores] = useState<Scores | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: qaScript.patient.greeting,
      timestamp: new Date().toISOString()
    }]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleVoiceTranscript = (text: string, isUser: boolean) => {
    const msg: Message = {
      role: isUser ? 'user' : 'assistant',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, msg]);

    if (isUser) {
      const facts = new Set(elicitedFacts);
      trackElicitedFacts(text, facts);
      setElicitedFacts(facts);

      const qType = classifyQuestion(text);
      setQuestionCount(prev => prev + 1);
      if (qType === 'open') setOpenEndedCount(prev => prev + 1);

      setScores(calculateScores(facts, questionCount + 1, openEndedCount + (qType === 'open' ? 1 : 0)));
    }
  };

  const sendTextMessage = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);

    // Track facts
    const facts = new Set(elicitedFacts);
    trackElicitedFacts(input, facts);
    setElicitedFacts(facts);

    // Track empathy
    const qType = classifyQuestion(input);
    const newQuestionCount = questionCount + 1;
    const newOpenEndedCount = openEndedCount + (qType === 'open' ? 1 : 0);
    setQuestionCount(newQuestionCount);
    setOpenEndedCount(newOpenEndedCount);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversation: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!res.ok) throw new Error('API error');

      const { reply } = await res.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString()
      }]);

      setScores(calculateScores(facts, newQuestionCount, newOpenEndedCount));

    } catch (error) {
      console.error('Chat error:', error);
      alert('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleEndInterview = async () => {
    await fetch('/api/sessions/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        student_id: 'demo_student',
        conversation: messages,
        scores
      })
    });

    // Send "Done" to get tutor feedback
    setInput('Done');
    setTimeout(sendTextMessage, 100);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Ms. Esposito Interview</h1>
            <p className="text-sm text-gray-600">31F with fever and flank pain</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={mode === 'text' ? 'default' : 'outline'}
              onClick={() => setMode('text')}
              size="sm"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button
              variant={mode === 'voice' ? 'default' : 'outline'}
              onClick={() => setMode('voice')}
              size="sm"
            >
              <Mic className="w-4 h-4 mr-2" />
              Voice
            </Button>
          </div>
        </div>

        {/* Case Setup */}
        <div className="bg-blue-50 border-b p-4">
          <p className="text-sm text-gray-700">
            <strong>Triage Note:</strong> {qaScript.triage_note}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {msg.role === 'user' ? 'You' : 'Ms. Esposito'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        {mode === 'text' ? (
          <div className="bg-white border-t p-4">
            <div className="max-w-3xl mx-auto space-y-2">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                  placeholder="Ask Ms. Esposito a question..."
                  disabled={loading}
                />
                <Button onClick={sendTextMessage} disabled={loading || !input.trim()}>
                  Send
                </Button>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="ghost" size="sm" onClick={() => setInput('CE help')}>
                  CE Help
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setInput('Summarize')}>
                  Summarize
                </Button>
                <Button variant="ghost" size="sm" onClick={handleEndInterview}>
                  End Interview
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-t p-4">
            <div className="max-w-3xl mx-auto">
              <VoiceClient sessionId={sessionId} onTranscript={handleVoiceTranscript} />
            </div>
          </div>
        )}
      </div>

      {/* Scores Sidebar */}
      <div className="w-80 bg-white border-l p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Performance</h2>

        {scores ? (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="text-sm text-gray-600">Completeness</div>
              <div className="text-3xl font-bold">{scores.completeness}/5</div>
              <div className="text-xs text-gray-500 mt-1">
                {scores.completeness_pct}% ({scores.elicited_count}/{scores.total_required} facts)
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${scores.completeness_pct}%` }}
                />
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-gray-600">Empathy</div>
              <div className="text-3xl font-bold">{scores.empathy}/5</div>
              <div className="text-xs text-gray-500 mt-1">
                {scores.open_ended_count} open-ended questions
              </div>
            </Card>

            {scores.missed_facts.length > 0 && (
              <Card className="p-4">
                <div className="text-sm text-gray-600 mb-2">Still Need to Ask</div>
                <div className="space-y-1">
                  {scores.missed_facts.slice(0, 5).map((fact, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs block">
                      {fact}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            <div className="text-xs text-gray-500">
              Questions: {scores.question_count}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Scores will appear as you interview.
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 6: Deployment (30 minutes)

### Task 6.1: Deploy to Vercel

```bash
cd /Users/JCR/Desktop/ai_med/frontend

# Set environment variables in Vercel dashboard first:
# AZURE_OPENAI_ENDPOINT
# AZURE_OPENAI_KEY
# AZURE_OPENAI_DEPLOYMENT

# Deploy
npx vercel --prod

# Set env vars via CLI (alternative)
vercel env add AZURE_OPENAI_ENDPOINT production
vercel env add AZURE_OPENAI_KEY production
vercel env add AZURE_OPENAI_DEPLOYMENT production
```

### Task 6.2: Apply for Content Filter

**Azure Portal:**
1. Go to Azure OpenAI Studio → Content Filters
2. Create new filter: "medical-education-sp"
3. Configure:
   - **Sexual content**: High threshold, "Allow in medical education context"
   - **Self-harm**: High threshold, "Allow in clinical training context"
   - **Violence**: Medium threshold
4. Justification:
   ```
   Rush Medical College M1 standardized patient training.
   Students must discuss sexual history, STDs, substance use,
   dysuria, and pregnancy history as part of LCME-required
   clinical skills training. All content is educational and
   professionally supervised.
   ```
5. Submit for approval (expect 2-4 weeks)
6. Once approved, apply to `gpt-4o-realtime-preview` deployment

---

## Testing Protocol

### Voice Mode Test (5 minutes)

```
1. Open app → Click "Voice" → Click "Start Voice Mode"
2. Speak: "Hi Ms. Esposito, how are you feeling?"
   ✓ Expect: Brief voice response, natural tone

3. Speak: "What brings you to the emergency room today?"
   ✓ Expect: Chief complaint only, no elaboration

4. Speak: "Can you describe the pain?"
   ✓ Expect: "What would you like to know about it?"

5. Speak: "Where is the pain located?"
   ✓ Expect: Location only, natural pacing

6. Speak: "When did it start?"
   ✓ Expect: Timing only

7. Type in text: "CE help"
   ✓ Expect: Brief guidance, returns to patient mode

8. Type: "Done"
   ✓ Expect: Structured feedback with scores
```

### Acceptance Criteria

- [ ] Voice latency <600ms (p95)
- [ ] Agent never volunteers >1 fact per response
- [ ] Pain questions answered with only requested dimension
- [ ] Mode toggle works (text ↔ voice)
- [ ] CE triggers work ("CE help", "Summarize")
- [ ] "Done" triggers tutor feedback with accurate scores
- [ ] Greeting is exactly as scripted
- [ ] No diagnosis revealed in Patient mode

---

## Cost Estimates

**Azure OpenAI (Voice Mode)**:
- Input audio: $0.06 / minute
- Output audio: $0.24 / minute
- Average 15-minute interview: ~$4.50 per session
- 100 students/month: **~$450/month**

**Azure OpenAI (Text Mode)**:
- Input tokens: $0.005 / 1K tokens
- Output tokens: $0.015 / 1K tokens
- Average 50 exchanges: ~$0.10 per session
- 100 students/month: **~$10/month**

**Vercel**:
- Hobby plan: **$0/month** (5K requests/day)
- Pro plan: **$20/month** (if needed for >100 students)

**Total Estimated Cost**:
- **Text-only**: $10-30/month
- **Voice + Text**: $450-500/month

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1-2 | 1 hour | Enhanced prompt + QA script |
| 3 | 30 min | Next.js project initialized |
| 4 | 1 hour | API routes complete |
| 5 | 3 hours | Frontend UI with voice toggle |
| 6 | 30 min | Deployed to Vercel |
| **Total** | **~6 hours** | **Production MVP** |

---

## Next Steps After MVP

1. **Content filter approved** → Enable voice in production
2. **Faculty feedback** → Iterate on grading algorithm
3. **Add persistence** → Cosmos DB for session storage
4. **Multi-case support** → Add more standardized patients
5. **Analytics dashboard** → Faculty view of all sessions
6. **Mobile optimization** → Responsive design improvements

---

**Ready to build?** Start with Phase 1 (updating `agent_prompt`), then proceed sequentially through Phase 6.

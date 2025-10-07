# Ms. Esposito ED Patient Simulation Agent

## Overview
This Claude agent simulates Ms. Esposito, a 31-year-old woman presenting to the Emergency Department, designed to train early-stage medical students in focused history-taking through realistic patient interaction.

## System Prompt Configuration

**Use the complete contents of `agent_prompt` as the system prompt for this agent.**

The agent operates as a state machine with three distinct modes:

### 1. **[Patient]** Mode (Default)
- Simulates Ms. Esposito in character
- Responds only to what is asked (no volunteering information)
- Maximum 2 sentences per response (except first turn)
- Uses layperson language
- Enforces one-detail-per-turn discipline

### 2. **[CE]** Clinical Educator Mode
- Triggered by: "CE help", "Pause and explain", "Summarize", or "Continue as patient"
- Provides brief, process-oriented coaching
- Returns to [Patient] mode after response
- Does not reveal diagnosis or advance the case

### 3. **[Tutor]** Mode
- Triggered by: "Done" (case-insensitive)
- Provides end-of-case feedback with ratings (1-5):
  - Completeness
  - Empathy
  - Missed items
  - Praise
- Ends the session

## Implementation Architecture: Simplified Vercel-Only Deployment

### Architecture Overview

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
- ✅ Single deployment: `vercel --prod`
- ✅ No Docker/containers required
- ✅ Auto-scaling (0 to 1000+ students)
- ✅ Built-in SSL, CDN, edge functions
- ✅ Cost: ~$0 for <100 students/month

### Project Structure

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
│   │   └── ScoreDisplay.tsx       # Real-time metrics
│   ├── lib/
│   │   ├── grading.ts             # Scoring logic
│   │   └── session.ts             # Session state management
│   └── package.json
├── claude.md                       # This file
└── IMPLEMENTATION_PLAN.md          # Detailed implementation guide
```

### Required Components

#### 1. **Frontend (Next.js on Vercel)**
- Voice/Text mode toggle
- WebRTC client for voice mode
- Text chat interface
- Real-time scoring display
- Client-side session state

#### 2. **API Routes (Vercel Serverless)**
- `/api/chat` - Text mode (Chat Completions API)
- `/api/realtime/token` - Voice mode token generation
- `/api/sessions/save` - Session persistence

#### 3. **QA Script JSON**
```json
{
  "case_id": "RMD561_Esposito",
  "patient": {
    "name": "Ms. Esposito",
    "greeting": "Hi, my name is Ms Esposito. I am here for my clinical visit. I hope you can help me!"
  },
  "must_elicit_facts": [
    { "id": "dysuria", "keywords": ["burn", "urination", "pee"], "weight": 10 },
    { "id": "flank_pain_location", "keywords": ["where", "location", "flank"], "weight": 10 }
  ],
  "qa_pairs": [
    { "q": ["What brings you in?"], "a": "I woke up with fever, chills, and pain..." }
  ]
}
```

## Deployment Guide

### Quick Start (6 hours to production)

**Phase 1: Setup (45 min)**
1. Enhance `agent_prompt` with voice guidance
2. Create `data/esposito_qa_script.json`
3. Initialize Next.js project: `npx create-next-app@latest frontend`

**Phase 2: API Routes (1 hour)**
4. Implement `/api/realtime/token/route.ts`
5. Implement `/api/chat/route.ts`
6. Implement `/api/sessions/save/route.ts`

**Phase 3: Frontend (3 hours)**
7. Build grading logic (`lib/grading.ts`)
8. Create VoiceClient component
9. Create main interview page with toggle

**Phase 4: Deploy (30 min)**
10. Set Azure env vars in Vercel
11. Deploy: `vercel --prod`
12. Test voice + text modes

### Azure OpenAI Setup

**Step 1: Create Resource**
```bash
az login
az group create --name sp-interview-rg --location eastus

az cognitiveservices account create \
  --name sp-openai-realtime \
  --resource-group sp-interview-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Deploy model
az cognitiveservices account deployment create \
  --name sp-openai-realtime \
  --resource-group sp-interview-rg \
  --deployment-name gpt-4o-realtime-preview \
  --model-name gpt-4o-realtime-preview \
  --model-version "2024-10-01" \
  --sku-name Standard \
  --sku-capacity 10
```

**Step 2: Configure Content Filter**

⚠️ **Important:** Apply for content filter approval **before building** (2-4 week approval time)

In Azure Portal:
1. Go to Azure OpenAI Studio → Content Filters
2. Create filter: "medical-education-sp"
3. Configure:
   - Sexual content: High threshold, allow in medical context
   - Self-harm: High threshold, allow in clinical context
4. Justification:
   > Rush Medical College M1 standardized patient training. Students must discuss sexual history, STDs, substance use, dysuria per LCME clinical skills requirements. Educational context, professionally supervised.
5. Apply to `gpt-4o-realtime-preview` once approved

**Step 3: Get Credentials**
```bash
# Get endpoint
az cognitiveservices account show \
  --name sp-openai-realtime \
  --resource-group sp-interview-rg \
  --query properties.endpoint -o tsv

# Get key
az cognitiveservices account keys list \
  --name sp-openai-realtime \
  --resource-group sp-interview-rg \
  --query key1 -o tsv
```

### Vercel Environment Variables

Set in Vercel dashboard or via CLI:
```bash
vercel env add AZURE_OPENAI_ENDPOINT production
# Enter: https://YOUR-RESOURCE.openai.azure.com

vercel env add AZURE_OPENAI_KEY production
# Enter: your_key_here

vercel env add AZURE_OPENAI_DEPLOYMENT production
# Enter: gpt-4o-realtime-preview
```

## Critical Behavior Rules

### Pain Question Handling
- **Timing/Pattern**: "constant", "intermittent", "comes and goes"
- **Quality**: "sharp", "dull", "crampy", "burning"
- **Severity**: Number (0-10) only
- **One dimension per response** - if student asks multiple, request they choose one

### Session Opening (Verbatim)
```
Narrator: "You are a medical student preparing to see the next patient in the ED,
Ms. Esposito. Here's the triage note: Ms. Esposito, 31F, woke up at 0600 with
'fever and chills.' She also feels fatigued and has some right-sided abdominal pain.
She returned last week from a vacation in the Dominican Republic. PMH includes
ectopic pregnancy (5 years ago). POC pregnancy test is negative. No one has yet
taken a full history."

Narrator: "Your patient is sitting in the clinic room awaiting your arrival.
Start the visit."

Patient: "Hi, my name is Ms Esposito. I am here for my clinical visit.
I hope you can help me!"
```

### Guardrails (Strict)
- ✘ Never exceed 2 sentences (except first turn)
- ✘ Never volunteer multiple details in one response
- ✘ Never reveal diagnosis, plan, or AI nature
- ✘ Never bundle answers to multi-part questions
- ✘ Never expose hidden materials (faculty guide, QA script)

## Voice Mode Configuration

### Azure Neural Voice Options

**Recommended voices** (set in `/api/realtime/token/route.ts`):
- `alloy` - Neutral, clear (default)
- `echo` - Warm, friendly
- `nova` - Energetic, young adult

**Azure-native alternatives**:
- `en-US-JennyNeural` - Warm, conversational
- `en-US-AriaNeural` - Professional, clear

Configure in API route:
```typescript
body: JSON.stringify({
  model: process.env.AZURE_OPENAI_DEPLOYMENT,
  voice: 'alloy', // Change here
  instructions: await getSystemPrompt(),
  // ...
})
```

### Voice Optimization Settings

**Server VAD (Voice Activity Detection)**:
```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,           // Sensitivity (0.0-1.0)
  prefix_padding_ms: 300,   // Capture before speech
  silence_duration_ms: 500  // Wait before responding
}
```

**Audio Quality**:
```typescript
audio: {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
}
```

## Grading Implementation

### Automatic Fact Tracking

The system tracks 11 must-elicit facts via keyword matching:

| Fact ID | Keywords | Weight |
|---------|----------|--------|
| dysuria | burn, urination, pee, tingling | 10 |
| flank_pain_location | where, location, flank, side | 10 |
| pain_quality | feel like, describe, quality | 8 |
| pain_severity | how bad, scale, out of ten | 7 |
| fever_chills | fever, temperature, chills | 9 |
| onset_timing | when start, began, onset | 8 |
| travel_history | travel, trip, vacation | 8 |
| allergies | allergies, allergic, penicillin | 10 |
| sexual_history | sexually active, partner, sex | 7 |
| lmp | period, menstrual, lmp | 6 |
| pmh | medical history, pcos, diabetes | 6 |

### Scoring Algorithm

**Completeness** (1-5):
```
Score = min(5, max(1, round(elicited_facts / 11 * 5)))
```

**Empathy** (1-5):
```
Score = min(5, max(1, round(open_ended_questions / total_questions * 5)))
```

Open-ended patterns: "how are you", "what brings", "tell me", "describe", "explain"

### Real-Time Display

Sidebar shows live metrics:
- **Completeness**: X/5 (Y% of facts)
- **Empathy**: X/5 (Y open-ended questions)
- **Still Need to Ask**: List of missed fact IDs
- **Questions Asked**: Total count

## Monitoring & Logging

### Session Data Captured

For each session, track:
```typescript
{
  session_id: string,
  student_id: string,
  started_at: ISO timestamp,
  conversation: Message[],
  scores: {
    completeness: 1-5,
    empathy: 1-5,
    elicited_facts: string[],
    missed_facts: string[]
  },
  metadata: {
    mode: 'voice' | 'text',
    question_count: number,
    duration_seconds: number
  }
}
```

### Production Logging

Add to `/api/sessions/save/route.ts`:
```typescript
// Send to Cosmos DB, Vercel KV, or analytics service
await db.sessions.insert(sessionData);

// Log to Application Insights
logger.info('Session completed', {
  session_id: sessionData.session_id,
  completeness: sessionData.scores.completeness,
  empathy: sessionData.scores.empathy
});
```

## Cost Estimates

### Azure OpenAI Pricing

**Voice Mode (Realtime API)**:
- Input audio: $0.06/minute
- Output audio: $0.24/minute
- Average 15-min interview: ~$4.50/session
- **100 students/month**: ~$450/month

**Text Mode (Chat Completions)**:
- Input tokens: $0.005/1K
- Output tokens: $0.015/1K
- Average 50 exchanges: ~$0.10/session
- **100 students/month**: ~$10/month

**Vercel Hosting**:
- Hobby plan: $0/month (sufficient for testing)
- Pro plan: $20/month (if >100 students)

**Total Estimated Cost**:
- Text-only MVP: $10-30/month
- Voice + Text production: $450-500/month

## Testing Protocol

### Acceptance Criteria

Run these tests before faculty demo:

**Voice Mode**:
1. ✓ Latency <600ms (p95)
2. ✓ Greeting exactly matches script
3. ✓ Never volunteers >1 fact per response
4. ✓ Pain questions honor single dimension only
5. ✓ "CE help" triggers educator mode
6. ✓ "Summarize" provides recap
7. ✓ "Done" triggers tutor feedback with scores

**Text Mode**:
8. ✓ All above behaviors identical to voice
9. ✓ Quick helper buttons work (CE Help, Summarize, End)
10. ✓ Real-time scoring updates accurately

**Grading Accuracy**:
11. ✓ Completeness tracks all 11 must-elicit facts
12. ✓ Empathy scores open vs closed questions correctly
13. ✓ Missed facts list updates in real-time

### Sample Test Script

```
1. Start interview → Verify greeting
2. Ask: "What brings you in?" → Expect chief complaint only
3. Ask: "Describe the pain" → Expect: "What would you like to know?"
4. Ask: "Where is the pain?" → Expect location only
5. Ask: "Any burning with urination?" → Track dysuria fact
6. Type: "CE help" → Verify educator guidance
7. Type: "Summarize" → Verify only elicited items shown
8. Type: "Done" → Verify tutor feedback with scores
9. Check sidebar: completeness, empathy, missed facts
```

## Implementation Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1 | 45 min | Enhanced prompt + QA script |
| 2 | 1 hour | API routes (chat, token, save) |
| 3 | 3 hours | Frontend (grading, voice, UI) |
| 4 | 30 min | Vercel deployment |
| **Total** | **~6 hours** | **Production MVP** |
| + Approval | 2-4 weeks | Content filter approved |

## Next Steps After MVP

**Week 1-2** (during filter approval wait):
1. ✅ Test text mode with 3-5 students
2. ✅ Gather faculty feedback on grading accuracy
3. ✅ Iterate on empathy/completeness algorithms
4. ✅ Add session persistence (Cosmos DB or Vercel KV)

**Week 3-4** (filter approved):
5. ✅ Enable voice mode in production
6. ✅ Run pilot with 10 students (5 voice, 5 text)
7. ✅ Compare latency and student preference
8. ✅ Faculty review voice transcripts

**Month 2+**:
- Multi-case support (add more standardized patients)
- Faculty dashboard (view all sessions, analytics)
- Mobile optimization for tablet use
- Advanced grading (NLP analysis of question quality)

## Reference Documentation

**Implementation Guide**: See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for complete code

**Azure Resources**:
- [Azure OpenAI Realtime WebRTC](https://learn.microsoft.com/azure/ai-services/openai/realtime-audio)
- [Azure Speech Voice Live](https://learn.microsoft.com/azure/ai-services/speech-service/how-to-use-voice-live)
- [Content Filtering](https://learn.microsoft.com/azure/ai-services/openai/concepts/content-filter)

**Vercel Deployment**:
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## Case Context & Source Materials

### System Prompt Location
`agent_prompt` (root directory) - Use complete contents as system prompt

### Patient Memory File (RMD561_MsEsposito_Memory.docx)

**Complete QA Script for Implementation:**

```json
{
  "triage_note": "Ms. Esposito, 31F. Woke at 06:00 with fever (102.5°F) and chills. Fatigue × 3 days; right-sided abdominal/flank pain. Returned from Dominican Republic 2 days ago. History: ruptured ectopic pregnancy 2018 (right salpingectomy). POC pregnancy test negative.",

  "greeting": "Hi, my name is Ms Esposito. I am here for my clinical visit. I hope you can help me!",

  "high_yield_facts": {
    "dysuria": "Tingling last night → burning this morning",
    "pain": "Constant dull flank pain, spikes sharp → groin, 7/10",
    "vomiting": "Single episode with pain spike; no current nausea",
    "negatives": "No cough, SOB, chest pain, diarrhea",
    "pmh": "PCOS (2014); obesity; pre-diabetes (A1c 5.8)",
    "medications": "Triamcinolone 0.1% lotion PRN",
    "allergies": "Penicillin (rash)",
    "social": "Target manager, nonsmoker, rare ETOH, occasional marijuana",
    "sexual": "Monogamous 7-year partner; no contraception; LMP 1.5 weeks ago"
  },

  "qa_pairs": [
    {
      "q": ["What brings you in today?", "Why are you here?"],
      "a": "I woke up this morning with a high fever, chills, and a really bad pain along my right side."
    },
    {
      "q": ["When did the symptoms start?", "When did this begin?"],
      "a": "The tiredness began a couple of days ago on my trip, but the fever and pain hit early this morning."
    },
    {
      "q": ["Any burning when you pee?", "Dysuria?", "Pain with urination?"],
      "a": "Yes—last night it tingled, and this morning it definitely burned."
    },
    {
      "q": ["Are you sexually active?", "Sexual activity?"],
      "a": "Yes, with my partner of seven years—we're monogamous."
    },
    {
      "q": ["Any medication allergies?", "Allergies?"],
      "a": "Penicillin—I got a rash as a kid."
    },
    {
      "q": ["Where is the pain?", "Pain location?"],
      "a": "On the right side of my belly, more my flank really."
    },
    {
      "q": ["When did it start?", "Pain onset?"],
      "a": "Around six this morning."
    },
    {
      "q": ["Travel?", "Recent travel?"],
      "a": "I got back from the Dominican Republic two days ago."
    },
    {
      "q": ["Pregnant?", "Pregnancy test?"],
      "a": "The test they did here was negative."
    },
    {
      "q": ["Pain quality?", "What does the pain feel like?"],
      "a": "It's kind of crampy usually but sometimes kind of sharp."
    },
    {
      "q": ["Pain severity?", "How bad is the pain?"],
      "a": "About a seven out of ten."
    },
    {
      "q": ["Pain timing?", "Constant or intermittent?"],
      "a": "It's constant, sometimes it will get even worse but I haven't gotten much relief."
    },
    {
      "q": ["Pain radiation?", "Does it spread anywhere?"],
      "a": "Sometimes it will shoot down to my groin on the same side."
    }
  ]
}
```

### Faculty Guide Context (Clinical Reasoning Rounds)

**Educational Objectives:**
1. Train students to take focused history through patient-first encounter
2. Practice clinical reasoning with differential diagnosis
3. Fill knowledge gaps with self-directed learning
4. Prepare for Clinical Skills Assessment (CSA)

**Key Teaching Points:**

**Differential Diagnosis Approach:**
- Organize by: Head-to-toe, Organ-based, Anatomic, Infectious/Non-infectious
- Emphasize: Most likely, Least likely, Must-not-miss diagnoses
- Avoid heuristics: Anchoring, premature closure, availability bias

**History Taking Framework (CSA Requirements):**
- Chief complaint and HPI including:
  - OPQRST/OLD CARTS (prefer OQSTRP order for logical flow)
  - Associated symptoms
  - Pertinent positives/negatives
  - Patient impact
  - Patient perspective

**Clinical Educator (CE) Guidance:**
- Brief, process-oriented coaching
- Support when student stuck for 2+ consecutive turns
- Example prompts:
  - "Try narrowing with open-to-closed: start broad, then ask OPQRST/OLD CARTS"
  - "Consider travel-related exposures and right-sided abdominal pain red flags"
  - "You might ask one pain dimension at a time (timing → quality → severity)"

**Case-Specific Details:**

**True Diagnosis:** Pyelonephritis with UTI, concern for sepsis (bacteremia from E. coli)

**Key Clinical Features:**
- Classic triad: Flank pain, dysuria, fever
- Red herrings: Dominican Republic travel (common things are common)
- Vitals concerning for sepsis: BP 99/57, HR 110, Temp 102.5°F, WBC elevated
- CT finding: Wedge-shaped hypodensity in right kidney with fat stranding

**Physical Exam:**
```
Vitals: T 102.5°F, BP 99/57, HR 110, RR 18, SpO2 99% RA, BMI 31
General: Fatigued appearing, no acute distress
HEENT: No scleral icterus, no oral lesions
Neck: No lymphadenopathy, able to touch chin to chest
Heart: RRR, S1S2 No M/R/G
Lungs: Clear bilaterally
Abdomen: Soft, mild tenderness diffusely, worse RLQ
GU: Tenderness to palpation of right flank
Skin: Scaly, erythematous rash on upper chest (eczema)
```

**Lab Results:**
- UA: Positive leukocyte esterase, nitrites, WBCs, bacteria
- Blood cultures: 2/2 positive for E. coli
- CT A/P: Wedge-shaped hypodensity right kidney, fat stranding → pyelonephritis

**Treatment:**
- IV fluids: 2L NS bolus → BP normalized
- Antibiotics: Piperacillin-tazobactam → ceftriaxone → PO cefdinir (7-day course)
- Admission for sepsis management
- Defervesced ~18 hours after antibiotics

**Common Student Misconceptions to Address:**
1. **FUO vs Fever of Unclear Etiology**: FUO = fever >3 weeks, temp >100.9°F, no diagnosis after 1 week investigation
2. **WBC interpretation**: Normal WBC does NOT rule out infection; elevated WBC does NOT rule in infection
3. **LFTs**: Don't assess liver "function" but hepatocellular damage/biliary blockage
4. **UA vs BUN/Cr**: UA doesn't assess renal function (proteinuria can suggest defects)
5. **Sepsis definitions**: SIRS criteria vs Sepsis-3 (qSOFA, SOFA score)

**Self-Directed Learning Integration:**
- Ask clinical questions during case (e.g., "When checking GC/Chlamydia in females, is endocervical swab necessary or urinary specimen sufficient?")
- Discuss resource credibility (UpToDate, PubMed, Wikipedia, ChatGPT roles)
- Provide feedback on resource selection and information quality

**Grading Rubric (Tutor Mode):**
- **Completeness (1-5)**: Coverage of HPI components, associated symptoms, pertinents
- **Empathy (1-5)**: Patient-centered language, rapport building, perspective seeking
- **Missed items**: Key questions not asked (e.g., dysuria timing, sexual history, travel details)
- **Praise**: Specific positive behaviors (e.g., "Excellent use of open-ended questions to start")

---

**System Prompt Location:** `agent_prompt` (root directory)
**Case Materials:** `RMD561_MsEsposito_Memory.docx`
**Faculty Guide:** `CTEI RMD 561 Faculty Guide PRAC_EDU Clinical Reasoning Rounds with SDL (1) (1).docx`

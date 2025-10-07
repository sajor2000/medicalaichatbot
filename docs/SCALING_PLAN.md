# Scaling Plan: Adding Multiple Patients

## Current Status
- ✅ Single patient: Ms. Esposito (31F, Pyelonephritis)
- ✅ System prompt embedded in [lib/prompt.ts](frontend/lib/prompt.ts)
- ✅ Works perfectly for one patient

## Future Scaling (When Adding More Patients)

### Architecture: Patient Config Files (NO RAG/Agents Needed)

**Why This Approach:**
- ✅ Simple: Each patient is a TypeScript/JSON file
- ✅ Maintainable: Medical faculty can edit patient files
- ✅ Scalable: Supports 2-100+ patients easily
- ✅ Fast: No database queries, no RAG overhead
- ✅ Cost-effective: Just GPT-4o + system prompt
- ✅ Version control: Easy to track patient changes

### File Structure (When Scaling)

```
/lib/patients/
  ├── types.ts              # TypeScript interfaces (already created)
  ├── ms-esposito.ts        # Patient 1 config (already created)
  ├── mr-johnson.ts         # Patient 2 config (example created)
  ├── mrs-chen.ts           # Patient 3 config (future)
  └── index.ts              # Registry of all patients
```

### Each Patient File Contains:
```typescript
{
  id: 'mr-johnson',
  name: 'Mr. Johnson',
  age: 58,
  diagnosis: 'STEMI',
  triageNote: '...',
  greeting: '...',
  qaScript: [...],           // All scripted Q&A pairs
  mustElicitFacts: [...],    // 10-15 facts to track
  voiceConfig: {...},        // Voice settings
  background: {...},         // Full patient history
  learningObjectives: [...]  // Educational goals
}
```

### Implementation Steps (When Ready to Scale)

#### Phase 1: Create Patient Registry (10 minutes)
1. Create `/lib/patients/index.ts`:
```typescript
import { msEsposito } from './ms-esposito';
import { mrJohnson } from './mr-johnson';

export const patientRegistry = {
  'ms-esposito': msEsposito,
  'mr-johnson': mrJohnson,
  // Add more patients here
};

export function getPatient(patientId: string) {
  return patientRegistry[patientId];
}
```

#### Phase 2: Update Homepage to Show Patient List (30 minutes)
```typescript
// app/page.tsx
const patients = Object.values(patientRegistry);

{patients.map(patient => (
  <PatientCard
    key={patient.id}
    name={patient.name}
    diagnosis={patient.diagnosis}
    onClick={() => startInterview(patient.id)}
  />
))}
```

#### Phase 3: Dynamic Prompt Generation (20 minutes)
```typescript
// lib/prompt-generator.ts
export function generateSystemPrompt(patient: PatientCase): string {
  return `
ROLE: ED Patient Simulation — ${patient.name} (${patient.age}${patient.gender}).

[...base rules...]

GREETING: "${patient.greeting}"

QA SCRIPT:
${patient.qaScript.map(qa => `
Q: ${qa.patterns.join(' / ')}
A: "${qa.response}"
`).join('\n')}

MUST ELICIT FACTS:
${patient.mustElicitFacts.map(f => `- ${f.label}`).join('\n')}
`;
}
```

#### Phase 4: Update API Routes (15 minutes)
```typescript
// app/api/chat/route.ts
const { patientId, sessionId, message } = await req.json();
const patient = getPatient(patientId);
const systemPrompt = generateSystemPrompt(patient);

// Use dynamic prompt instead of hardcoded SYSTEM_PROMPT
```

### Migration Path (When You're Ready)

**Step 1: Keep Current System Working**
- No changes needed now
- Current implementation is solid

**Step 2: When Adding Patient #2**
1. Create new patient file (copy `ms-esposito.ts` as template)
2. Add to patient registry
3. Update homepage to show patient selector
4. Switch to dynamic prompt generation
5. Test both patients work correctly

**Step 3: When Adding Patients #3-10**
- Just create new patient files
- Add to registry
- Everything else works automatically

### Estimated Time to Scale

| Task | Time | Complexity |
|------|------|------------|
| Create patient config file | 30-60 min/patient | Low |
| Add to registry | 2 min/patient | Very Low |
| First-time setup (registry, dynamic prompts) | 1-2 hours | Medium |
| Update UI for patient selection | 1 hour | Low |
| **Total for first expansion (1→3 patients)** | **4-5 hours** | **Low-Medium** |
| **Each additional patient after that** | **30-60 min** | **Very Low** |

### What You DON'T Need

❌ **Database**: Patient configs are just TypeScript files
❌ **RAG (Retrieval Augmented Generation)**: All patient data fits in system prompt
❌ **Agents**: Single-turn Q&A doesn't need multi-step reasoning
❌ **Vector Database**: No need to search through patient data
❌ **API for Patient Management**: Medical faculty can edit TypeScript files directly

### What You DO Need

✅ **Patient Config Files**: One `.ts` file per patient
✅ **Patient Registry**: Simple object mapping patient ID → config
✅ **Dynamic Prompt Generator**: Build system prompt from patient config
✅ **Patient Selector UI**: Let students choose which patient to interview

### Benefits of This Approach

1. **Simple**: No complex infrastructure
2. **Fast**: No database queries, instant loading
3. **Maintainable**: Faculty can edit patient files
4. **Version Control**: All patients tracked in Git
5. **Type Safe**: TypeScript catches errors
6. **Testable**: Easy to test each patient config
7. **Portable**: Works anywhere (local, Vercel, AWS, etc.)
8. **Cost Effective**: No extra services needed

### Example: Adding a New Patient

**Time: 30 minutes**

1. Copy `ms-esposito.ts` → `new-patient.ts`
2. Update patient info (name, age, diagnosis, etc.)
3. Write new QA script (10-15 Q&A pairs)
4. Define facts to track (10-15 facts)
5. Add to registry in `index.ts`
6. Test in UI

Done! No database migrations, no RAG setup, no agent configuration.

### When You WOULD Need RAG/Database

Only if you have:
- **100+ patients**: Then consider database for management
- **Dynamic patient generation**: AI creates new patients on the fly
- **External medical knowledge**: Need to pull from textbooks/journals
- **Real EHR integration**: Pulling from actual patient records

**For educational simulations with 2-50 patients**: Config files are perfect.

### Current Implementation Files

Already created for future scaling:
- ✅ `/lib/patients/types.ts` - TypeScript interfaces
- ✅ `/lib/patients/ms-esposito.ts` - Ms. Esposito config
- ✅ `/lib/patients/mr-johnson.ts` - Example second patient

When ready to scale, you have:
- Complete type definitions
- Working patient config example
- Second patient example to copy from
- This scaling plan document

### Summary

**Now**: Single patient, hardcoded system prompt ✅ Perfect for MVP

**Future (When Adding Patients)**:
1. Create patient config file (30 min)
2. Add to registry (2 min)
3. First time only: Setup dynamic prompts (1-2 hours)
4. Update homepage UI (1 hour)

**Total**: 4-5 hours one-time setup, then 30 min per additional patient

**No RAG, no agents, no database needed** for 2-100 patients.

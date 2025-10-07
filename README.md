# Ms. Esposito Standardized Patient Interview System

> Voice + Text AI-powered standardized patient simulation for Rush Medical College M1 students

## 🎯 Overview

This system provides an interactive standardized patient interview experience where medical students practice focused history-taking with **Ms. Esposito**, a 31-year-old female patient with pyelonephritis. The system uses Azure OpenAI to simulate realistic patient responses and provides real-time grading on completeness and empathy.

### Key Features

- ✅ **Dual Mode**: Text chat and voice conversation (voice pending Azure approval)
- ✅ **Real-Time Grading**: Tracks 11 must-elicit facts and calculates completeness/empathy scores
- ✅ **State Machine**: Three modes - [Patient], [CE Clinical Educator], [Tutor]
- ✅ **Direct Prompt Injection**: No RAG needed - QA script embedded in system prompt
- ✅ **Vercel-Ready**: Simple one-click deployment
- ✅ **Session Persistence**: 7-day session storage with Vercel KV

## 📁 Project Structure

```
ai_med/
├── agent_prompt                    # Core system prompt with behavioral rules
├── data/
│   └── esposito_qa_script.json    # 11 must-elicit facts + 25 QA pairs
├── frontend/                       # Next.js application
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts      # Text mode API (gpt-4o)
│   │   │   └── realtime/token/route.ts  # Voice mode token endpoint
│   │   ├── interview/[sessionId]/page.tsx  # Main interview interface
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── VoiceClient.tsx         # Azure Realtime WebRTC integration
│   │   └── ui/                     # Reusable UI components
│   ├── lib/
│   │   ├── grading.ts              # Fact tracking & scoring logic
│   │   ├── prompt.ts               # System prompt with QA script
│   │   └── state.ts                # Session management (Vercel KV)
│   └── public/
├── VERCEL_DEPLOYMENT_CHECKLIST.md  # Step-by-step deployment guide
└── README.md                        # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- Azure OpenAI resource with:
  - `gpt-4o` deployment (text mode) ✅
  - `gpt-4o-realtime-preview` deployment (voice mode - pending approval)
- Vercel account ([sign up](https://vercel.com/))

### Local Development

```bash
# Install dependencies
cd frontend
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Azure credentials

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

Create `frontend/.env.local`:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your_api_key_here
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o
AZURE_OPENAI_REALTIME_DEPLOYMENT=gpt-4o-realtime-preview

# Client-side (for voice mode)
NEXT_PUBLIC_AZURE_ENDPOINT=https://your-resource.openai.azure.com
NEXT_PUBLIC_AZURE_REALTIME_DEPLOYMENT=gpt-4o-realtime-preview
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Deploy to Vercel

See [VERCEL_DEPLOYMENT_CHECKLIST.md](./VERCEL_DEPLOYMENT_CHECKLIST.md) for detailed instructions.

Quick deploy:
```bash
cd frontend
npm install -g vercel
vercel --prod
```

## 🎓 How It Works

### Text Mode (Available Now)

1. Student clicks "Start Interview"
2. System shows triage note and narrator context
3. Student types questions → Azure OpenAI gpt-4o responds
4. Real-time grading tracks 11 key facts
5. Student types "Done" → System provides feedback

### Voice Mode (Code Complete, Pending Azure Approval)

1. Student toggles to voice mode
2. WebRTC connection to Azure Realtime API
3. Student speaks naturally → Ms. Esposito responds with voice
4. Same grading logic as text mode
5. Full duplex audio conversation

### Grading System

**Completeness (1-5 scale)**
- Tracks 11 must-elicit facts via keyword matching
- 90%+ = 5, 75%+ = 4, 60%+ = 3, 40%+ = 2, <40% = 1

**Empathy (1-5 scale)**
- Analyzes open-ended vs. closed questions
- 40%+ open-ended = 5, 30%+ = 4, 20%+ = 3, 10%+ = 2, <10% = 1

### State Machine

```
[Patient] → Default mode, one detail per turn, ≤2 sentences
    ↓
[CE] → Process coaching when student says "CE help"
    ↓
[Tutor] → Final feedback when student says "Done"
```

## 📊 Cost Estimates

### Text Mode (100 students/month, 15-min sessions)
- **Azure OpenAI gpt-4o**: ~$22/month
- **Vercel Hosting**: Free tier
- **Vercel KV**: Free tier
- **Total**: ~$22/month

### Voice Mode (when approved)
- **Azure Realtime API**: ~$100-150/month
- **Total with Text**: ~$122-172/month

## 🧪 Testing

### Test Text Mode Locally
```bash
# Start server
npm run dev

# In browser:
http://localhost:3000

# Test API directly:
curl -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "caseId":"RMD561_Esposito",
    "sessionId":"test123",
    "userText":"What brings you in today?"
  }'
```

Expected response: `"I woke up this morning with a high fever, chills, and a really bad pain along my right side."`

### Production Build Test
```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### API 500 Errors
- Verify `AZURE_OPENAI_KEY` is set
- Check deployment names match Azure
- Ensure Vercel KV is linked

### Voice Mode Not Working
- Verify content filter approval status
- Check `NEXT_PUBLIC_` env vars are set
- Test with: `console.log(process.env.NEXT_PUBLIC_AZURE_ENDPOINT)`

## 📝 Development Notes

### No RAG Architecture Decision
- QA script is small (~2,500 tokens)
- Direct prompt injection maintains perfect consistency
- Critical for fair grading across students
- Cost negligible (~$0.01 per session)

### Why Two Azure Deployments?
- **gpt-4o**: Text mode, Chat Completions API
- **gpt-4o-realtime-preview**: Voice mode, Realtime API with WebRTC

### Session Management
- Local: In-memory Map (dev only)
- Production: Vercel KV (7-day TTL)
- Auto-saves after each turn

## 🔒 Security Considerations

- API keys stored in environment variables (never committed)
- Edge runtime for API routes (low latency)
- Content filtering via Azure (pending approval)
- Session data encrypted at rest (Vercel KV)

## 📚 Resources

- **Azure OpenAI Docs**: https://learn.microsoft.com/azure/ai-services/openai/
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel KV Docs**: https://vercel.com/docs/storage/vercel-kv

## 📧 Support

For issues or questions:
1. Check [VERCEL_DEPLOYMENT_CHECKLIST.md](./VERCEL_DEPLOYMENT_CHECKLIST.md)
2. Review Azure Portal logs
3. Check Vercel Function Logs

## 🏗️ Built With

- [Next.js 15.5.4](https://nextjs.org/) - React framework
- [Azure OpenAI](https://azure.microsoft.com/products/ai-services/openai-service) - LLM provider
- [Vercel](https://vercel.com/) - Hosting & deployment
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

**Version**: 1.0
**Status**: Text Mode Production Ready | Voice Mode Code Complete (Pending Azure Approval)
**Last Updated**: 2025-10-06

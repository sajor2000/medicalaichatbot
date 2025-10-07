# Vercel Deployment Checklist - Ms. Esposito Interview System

## ✅ Pre-Deployment Requirements

### 1. Azure OpenAI Setup
- [x] Azure OpenAI resource created
- [x] Endpoint configured: `https://prodkmnlpopenaieastus.openai.azure.com`
- [x] API key obtained
- [x] **Text Mode**: `gpt-4o` deployment created ✅
- [ ] **Voice Mode**: `gpt-4o-realtime-preview` deployment (pending 2-4 week approval)

### 2. Vercel KV Database
- [ ] Create Vercel KV database in Vercel dashboard
- [ ] Link KV to project (auto-populates `KV_REST_API_URL` and `KV_REST_API_TOKEN`)

### 3. Environment Variables
Set these in Vercel dashboard → Settings → Environment Variables:

```bash
# Required for Text Mode
AZURE_OPENAI_ENDPOINT=https://prodkmnlpopenaieastus.openai.azure.com
AZURE_OPENAI_KEY=your_api_key_here
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o

# Required for Voice Mode (when approved)
AZURE_OPENAI_REALTIME_DEPLOYMENT=gpt-4o-realtime-preview

# Client-side (auto-exposed with NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_AZURE_ENDPOINT=https://prodkmnlpopenaieastus.openai.azure.com
NEXT_PUBLIC_AZURE_REALTIME_DEPLOYMENT=gpt-4o-realtime-preview

# Vercel KV (auto-populated when you link KV database)
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## 🚀 Deployment Steps

### Step 1: Connect GitHub Repository
```bash
# In Vercel dashboard:
1. New Project
2. Import Git Repository
3. Select your GitHub repo
```

### Step 2: Configure Build Settings
```
Framework Preset: Next.js
Root Directory: frontend/
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Step 3: Add Environment Variables
```
1. Go to Settings → Environment Variables
2. Add all variables from section above
3. Set for: Production, Preview, Development
```

### Step 4: Create Vercel KV Database
```
1. In Vercel dashboard → Storage
2. Create Database → KV
3. Name: ms-esposito-sessions
4. Region: Same as your deployment (us-east-1)
5. Link to project (auto-adds KV env vars)
```

### Step 5: Deploy
```bash
# Automatic deployment on git push, or manual:
cd /Users/JCR/Desktop/ai_med/frontend
vercel --prod
```

## 🔍 Post-Deployment Verification

### Test Checklist
- [ ] Landing page loads: `https://your-app.vercel.app`
- [ ] Click "Start Interview" creates session
- [ ] Text mode: Send message receives streaming response
- [ ] Sidebar: Facts tracker updates in real-time
- [ ] Session persistence: Refresh page maintains conversation
- [ ] API routes: `/api/chat` returns 200
- [ ] API routes: `/api/realtime/token` (after voice approval)

### Manual Test Script
```bash
# Test landing page
curl https://your-app.vercel.app | grep "Ms. Esposito"

# Test chat API
curl -N -X POST https://your-app.vercel.app/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "caseId":"RMD561_Esposito",
    "sessionId":"test123",
    "userText":"What brings you in today?"
  }'
```

## 📊 Expected Costs (Monthly)

### Text Mode Only (100 students, 15-minute sessions)
- **Azure OpenAI gpt-4o**: ~$22/month
  - 100 sessions × 30 turns × 150 tokens/turn = 450K tokens
  - Input: $5/1M tokens × 0.45M = $2.25
  - Output: $15/1M tokens × 0.45M = $6.75
  - Total with overhead: ~$22
- **Vercel Hosting**: Free tier (Edge Functions: 100GB-hrs/month)
- **Vercel KV**: Free tier (256MB storage, 3K requests/day)

### Text + Voice Mode (when approved)
- **Azure OpenAI gpt-4o-realtime-preview**: ~$100-150/month
  - Audio input: $100/1M tokens
  - Audio output: $200/1M tokens
  - Text: $5/$20 per 1M tokens
- **Total estimated**: $122-172/month for 100 students

## ⚠️ Known Limitations

### Current State
- ✅ **Text mode**: Fully functional
- ⏳ **Voice mode**: Code complete, pending Azure approval (2-4 weeks)
- ✅ **Grading**: Real-time fact tracking operational
- ✅ **Session persistence**: Works with Vercel KV

### Azure Content Filter
- Status: **Pending approval** (2-4 week process)
- Required for: Realtime API voice mode
- Workaround: Text mode available immediately

## 🔧 Troubleshooting

### Build Fails
```bash
# Check Node version (requires 18+)
node --version

# Clear cache and rebuild
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Loading
```bash
# Verify in Vercel dashboard:
Settings → Environment Variables → Redeploy
```

### KV Connection Errors
```bash
# Verify KV linked:
Vercel dashboard → Storage → Check database connection
# Re-link if needed:
Disconnect → Link to Project
```

### API Route 500 Errors
```bash
# Check Vercel Function Logs:
Deployment → Functions → View Logs
# Common issues:
- Missing AZURE_OPENAI_KEY
- Wrong deployment name
- KV not connected
```

## 🎯 Performance Expectations

### Text Mode
- **Response time**: 1-3 seconds (streaming)
- **Concurrent users**: 100+ (Edge Functions)
- **Session TTL**: 7 days (Vercel KV)

### Voice Mode (when enabled)
- **Latency**: 200-500ms (WebRTC)
- **Audio quality**: 24kHz, 16-bit
- **Concurrent connections**: Limited by Azure quota

## 📝 Next Steps After Deployment

1. **Monitor initial usage** (Vercel Analytics)
2. **Apply for Azure content filter approval** (if not done)
3. **Test with 5-10 students** before full rollout
4. **Set up alerts** for API errors (Vercel Integrations)
5. **Document student feedback** for iteration

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Azure Portal**: https://portal.azure.com
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel KV Docs**: https://vercel.com/docs/storage/vercel-kv
- **Azure OpenAI Realtime**: https://learn.microsoft.com/azure/ai-services/openai/realtime-audio-quickstart

---

**Last Updated**: 2025-10-06
**System Version**: 1.0 (Text Mode Production Ready)
**Voice Mode**: Code complete, pending Azure approval

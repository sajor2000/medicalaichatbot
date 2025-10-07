# Vercel Deployment Guide
## Medical Student AI Patient Interview - Production Deployment

## ✅ Pre-Deployment Checklist

### Build Status
- ✅ Production build passing (0 errors)
- ✅ TypeScript types valid
- ✅ ESLint checks passing
- ✅ All components working locally

### Features Ready
- ✅ **Text Mode**: Full chat interface with GPT-4o
- ✅ **Voice Mode**: Azure Speech Services integration
- ✅ **Patient Simulation**: Ms. Esposito (31F, Pyelonephritis)
- ✅ **Fact Tracking**: 11 facts monitored in real-time
- ✅ **Grading System**: Completeness & Empathy scores
- ✅ **Session Persistence**: Vercel KV ready (with local fallback)

---

## Step 1: Create GitHub Repository

### Option A: Using GitHub Website
1. Go to https://github.com/new
2. Repository name: `medical-ai-patient`
3. Description: `AI-powered standardized patient interview simulation for medical students`
4. **Keep it Private** (contains API keys in history)
5. **DO NOT** initialize with README (we have one)
6. Click "Create repository"

### Option B: Using Command Line
```bash
cd /Users/JCR/Desktop/ai_med

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Medical AI Patient Interview System

Features:
- Text and voice mode patient interviews
- Azure OpenAI GPT-4o integration
- Azure Speech Services for voice mode
- Real-time fact tracking (11 facts)
- Grading system (Completeness & Empathy)
- Ms. Esposito case (Pyelonephritis)
- Vercel KV session persistence
- Production-ready deployment"

# Create GitHub repo and push
gh repo create medical-ai-patient --private --source=. --push
```

**IMPORTANT:** Repository **must be private** because:
- Contains Azure API keys in `.env.local` (gitignored, but safe to keep private)
- Educational content proprietary to your institution
- Patient case scripts may be copyrighted

---

## Step 2: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with GitHub

2. **Import Repository**
   - Click "Import Git Repository"
   - Select `medical-ai-patient`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

4. **Add Environment Variables**
   Click "Environment Variables" and add these:

   ```
   # Azure OpenAI Configuration
   AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
   AZURE_OPENAI_KEY=your_azure_openai_key_here
   AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o

   # Azure Speech Services Configuration
   AZURE_SPEECH_KEY=your_azure_speech_key_here
   AZURE_SPEECH_REGION=eastus2

   # Client-side Environment Variables (NEXT_PUBLIC_)
   NEXT_PUBLIC_AZURE_SPEECH_KEY=your_azure_speech_key_here
   NEXT_PUBLIC_AZURE_SPEECH_REGION=eastus2
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   ```

   **Note:** Copy actual values from `VERCEL_ENV_VARIABLES.txt` file (not committed to git)

   **Important:**
   - Set environment for: **Production, Preview, and Development**
   - Update `NEXT_PUBLIC_APP_URL` after deployment with your actual Vercel URL

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd /Users/JCR/Desktop/ai_med/frontend
vercel

# Follow prompts:
# - Link to existing project? N
# - What's your project's name? medical-ai-patient
# - In which directory is your code located? ./
# - Want to override the settings? N

# Add environment variables
vercel env add AZURE_OPENAI_ENDPOINT
# (paste value, select Production + Preview + Development)
# Repeat for all variables above

# Deploy to production
vercel --prod
```

---

## Step 3: Configure Vercel KV (Session Storage)

1. **Create KV Database**
   - Go to your Vercel project dashboard
   - Click "Storage" tab
   - Click "Create Database"
   - Select "KV (Durable Redis)"
   - Database name: `medical-ai-sessions`
   - Region: `Washington, D.C., USA (iad1)` (closest to eastus2)
   - Click "Create"

2. **Link to Project**
   - Vercel automatically adds KV environment variables:
     - `KV_URL`
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
   - These are automatically available in production

3. **Verify Connection**
   - No code changes needed
   - App uses Vercel KV in production, local fallback in development

---

## Step 4: Post-Deployment Configuration

### 1. Update App URL
After deployment, update the environment variable:
```bash
vercel env add NEXT_PUBLIC_APP_URL
# Enter: https://your-actual-deployment-url.vercel.app
# Select: Production, Preview, Development
```

### 2. Configure Custom Domain (Optional)
1. Go to project settings → Domains
2. Add domain: `medical-ai-patient.yourdomain.com`
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to match custom domain

### 3. Enable Vercel Analytics (Optional)
```bash
cd /Users/JCR/Desktop/ai_med/frontend
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## Step 5: Test Production Deployment

### Text Mode Test
1. Visit: `https://your-app.vercel.app`
2. Click "Start Interview"
3. Ask patient: "What brings you in today?"
4. Verify AI responds correctly
5. Check fact tracking updates
6. Verify grading scores appear

### Voice Mode Test
1. Switch to "Voice" tab
2. Click "Start Voice Mode"
3. Allow microphone access
4. Say: "Hi, can you tell me about your pain?"
5. Verify:
   - Speech recognition works
   - AI patient responds with voice
   - Transcripts appear in chat
   - Facts are tracked

### Session Persistence Test
1. Start an interview
2. Ask a few questions
3. Copy the session URL
4. Open in new tab/browser
5. Verify conversation history is preserved

---

## Troubleshooting

### Build Fails
**Error:** `Module not found`
**Fix:** Ensure all dependencies in `package.json`
```bash
cd frontend
npm install
npm run build  # Test locally first
```

### Voice Mode Not Working
**Error:** `Failed to get speech token`
**Fix:** Check environment variables
- Verify `NEXT_PUBLIC_AZURE_SPEECH_KEY` is set
- Verify `NEXT_PUBLIC_AZURE_SPEECH_REGION` is `eastus2`
- Redeploy after adding variables

### Sessions Not Persisting
**Error:** Sessions lost on reload
**Fix:** Verify Vercel KV is linked
- Check Storage tab in Vercel dashboard
- Ensure KV database is linked to project
- Environment variables auto-added

### API Rate Limits
**Error:** `429 Too Many Requests`
**Fix:** Azure OpenAI rate limits
- Check Azure OpenAI quota
- Upgrade Azure tier if needed
- Implement request throttling

---

## Cost Estimates

### Azure OpenAI (GPT-4o)
- **Text Mode**: ~$0.02-0.05 per interview
- **Estimated**: 100 students = $2-5/month

### Azure Speech Services
- **Voice Mode**: ~$0.02-0.05 per interview
- **Estimated**: 100 students (50% use voice) = $1-2.50/month

### Vercel Hosting
- **Hobby Plan**: $0 (free tier, 100GB bandwidth)
- **Pro Plan**: $20/month (if exceeding free tier)

### Vercel KV (Session Storage)
- **Free Tier**: 256MB, 10k commands/month
- **Estimated**: Sufficient for 100-500 students
- **Upgrade**: $1/month for 1GB

**Total Monthly Cost (100 students):** ~$3-8/month

---

## Monitoring & Maintenance

### 1. Check Deployment Logs
```bash
vercel logs your-deployment-url.vercel.app
```

### 2. Monitor Usage
- Vercel Dashboard → Analytics
- Azure Portal → OpenAI metrics
- Azure Portal → Speech Services usage

### 3. Update Application
```bash
git add .
git commit -m "Update: [description]"
git push

# Auto-deploys to Vercel on push
```

### 4. Rollback if Needed
- Vercel Dashboard → Deployments
- Click previous deployment
- Click "Promote to Production"

---

## Security Checklist

✅ **Environment Variables**
- All API keys stored in Vercel environment variables
- No secrets in code
- `.env.local` in `.gitignore`

✅ **API Security**
- Azure OpenAI endpoint restricted to your subscription
- Vercel KV only accessible to your project
- No public API endpoints exposing keys

✅ **Access Control**
- Repository is private
- Vercel project private (team access only)
- Can add password protection via Vercel settings

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test text and voice modes
3. ✅ Share URL with students
4. 📊 Monitor usage and performance
5. 🔄 Collect feedback and iterate
6. 🎯 Add more patient cases (see [SCALING_PLAN.md](SCALING_PLAN.md))

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Azure OpenAI**: https://learn.microsoft.com/en-us/azure/ai-services/openai/
- **Azure Speech**: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/

---

## Quick Deploy Command

```bash
# One-command deployment (after git setup)
cd /Users/JCR/Desktop/ai_med/frontend
vercel --prod

# Then add environment variables via dashboard
```

**Your app is ready for deployment!** 🚀

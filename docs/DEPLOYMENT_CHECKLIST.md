# Deployment Checklist
## Medical AI Patient - Ready for Vercel

---

## ✅ Pre-Deployment Status

### Code Quality
- [x] **Build passing** - Zero errors, zero warnings
- [x] **TypeScript valid** - All types correct
- [x] **ESLint passing** - Code quality verified
- [x] **Dependencies installed** - All packages up to date

### Features Tested
- [x] **Text mode working** - Chat interface functional
- [x] **Voice mode working** - Speech recognition + synthesis
- [x] **Fact tracking working** - 11 facts monitored correctly
- [x] **Grading system working** - Completeness & Empathy scores
- [x] **Session persistence** - Local fallback + Vercel KV ready

### Documentation Complete
- [x] **README.md** - Project overview
- [x] **SCALING_PLAN.md** - How to add more patients
- [x] **VERCEL_DEPLOYMENT_GUIDE.md** - Step-by-step deployment
- [x] **PROJECT_SUMMARY.md** - Complete summary
- [x] **.gitignore** - Proper ignore rules

---

## 📝 Deployment Steps

### Step 1: Initialize Git Repository
```bash
cd /Users/JCR/Desktop/ai_med
git init
git add .
git commit -m "Initial commit: Medical AI Patient Interview System"
```

### Step 2: Create GitHub Repository
**Option A: GitHub CLI**
```bash
gh repo create medical-ai-patient --private --source=. --push
```

**Option B: GitHub Website**
1. Go to https://github.com/new
2. Name: `medical-ai-patient`
3. **Private repository** ✅
4. Create and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/medical-ai-patient.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel
1. Go to https://vercel.com/new
2. Import `medical-ai-patient` repository
3. **Root Directory:** `frontend`
4. Click "Deploy"

### Step 4: Add Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables:

```
AZURE_OPENAI_ENDPOINT=https://prodkmnlpopenaieastus.openai.azure.com
AZURE_OPENAI_KEY=your_azure_openai_key_here
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o

AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=eastus2

NEXT_PUBLIC_AZURE_SPEECH_KEY=your_azure_speech_key_here
NEXT_PUBLIC_AZURE_SPEECH_REGION=eastus2
NEXT_PUBLIC_APP_URL=https://YOUR_APP.vercel.app
```

**Important:** Select all three environments (Production, Preview, Development)

### Step 5: Setup Vercel KV
1. Vercel Dashboard → Storage → Create Database
2. Select "KV (Durable Redis)"
3. Name: `medical-ai-sessions`
4. Region: Washington D.C. (iad1)
5. Create and link to project

### Step 6: Update App URL
After deployment, update environment variable:
```
NEXT_PUBLIC_APP_URL=https://your-actual-url.vercel.app
```

---

## 🧪 Post-Deployment Testing

### Test 1: Homepage
- [ ] Visit production URL
- [ ] Page loads correctly
- [ ] "Start Interview" button visible
- [ ] Patient information displays

### Test 2: Text Mode
- [ ] Click "Start Interview"
- [ ] Session ID created
- [ ] Type: "What brings you in today?"
- [ ] AI responds correctly
- [ ] Fact tracker updates
- [ ] Grading scores appear

### Test 3: Voice Mode
- [ ] Click "Voice" tab
- [ ] Click "Start Voice Mode"
- [ ] Allow microphone access
- [ ] Say: "Can you tell me about your pain?"
- [ ] AI responds with voice
- [ ] Transcript appears
- [ ] Facts tracked correctly

### Test 4: Session Persistence
- [ ] Ask a few questions
- [ ] Copy session URL
- [ ] Open in new browser tab
- [ ] Verify conversation history preserved

### Test 5: Multiple Students
- [ ] Open in incognito window
- [ ] Start new interview
- [ ] Verify independent session
- [ ] Both sessions work simultaneously

---

## 📊 Monitoring Setup

### Week 1: Monitor Closely
- Check Vercel logs daily
- Monitor Azure OpenAI usage
- Monitor Azure Speech Services usage
- Check for any error reports from students

### Ongoing: Weekly Checks
- Review Vercel analytics
- Check Azure costs
- Review student feedback
- Update patient scripts if needed

---

## 🔧 Common Issues & Fixes

### Issue: Build Fails on Vercel
**Symptom:** Deployment fails during build
**Fix:**
1. Check Vercel build logs
2. Verify all environment variables are set
3. Ensure `frontend` is set as root directory
4. Test build locally: `cd frontend && npm run build`

### Issue: Voice Mode Not Working
**Symptom:** "Failed to get speech token"
**Fix:**
1. Verify `NEXT_PUBLIC_AZURE_SPEECH_KEY` is set
2. Verify `NEXT_PUBLIC_AZURE_SPEECH_REGION` is `eastus2`
3. Check browser console for detailed errors
4. Test in Chrome/Edge (best browser support)

### Issue: Sessions Not Persisting
**Symptom:** Conversation lost on page refresh
**Fix:**
1. Verify Vercel KV is created and linked
2. Check Storage tab in Vercel dashboard
3. Ensure KV environment variables are set
4. Redeploy if needed

### Issue: API Rate Limits
**Symptom:** "429 Too Many Requests"
**Fix:**
1. Check Azure OpenAI quota in Azure Portal
2. Upgrade Azure tier if needed
3. Implement request throttling if necessary

---

## 🎯 Success Metrics

### Technical Metrics
- ✅ Build time: < 3 minutes
- ✅ Page load time: < 2 seconds
- ✅ Text mode response: < 1.5 seconds
- ✅ Voice mode response: < 3 seconds
- ✅ Uptime: > 99.9%

### Usage Metrics (Week 1)
- [ ] Number of students using system: ___
- [ ] Average interview length: ___
- [ ] Text vs Voice mode usage: ___
- [ ] Average facts elicited: ___/11
- [ ] Average completeness score: ___/5
- [ ] Average empathy score: ___/5

### Cost Metrics (Month 1)
- [ ] Azure OpenAI cost: $___
- [ ] Azure Speech cost: $___
- [ ] Vercel hosting cost: $___
- [ ] Total monthly cost: $___

---

## 📞 Support Contacts

### Technical Issues
- **Vercel Support**: https://vercel.com/support
- **Azure Support**: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
- **Documentation**: See project `/docs` folder

### Content Issues
- **Update patient scripts**: Edit `frontend/lib/prompt.ts`
- **Add new patients**: See `SCALING_PLAN.md`
- **Modify grading**: Edit `frontend/lib/grading.ts`

---

## 🎓 Student Instructions

Share this with students after deployment:

```
Medical AI Patient Interview System

Access: https://your-app.vercel.app

Instructions:
1. Click "Start Interview"
2. Choose Text or Voice mode
3. Conduct history-taking interview with Ms. Esposito
4. Elicit all 11 key facts
5. Review your Completeness and Empathy scores

Tips:
- Ask specific questions (not "tell me everything")
- Use OPQRST framework for pain assessment
- Be empathetic (introduce yourself, acknowledge symptoms)
- Voice mode: Speak clearly, wait for AI to finish before speaking

Technical Requirements:
- Modern browser (Chrome, Edge, Safari, Firefox)
- Microphone access required for voice mode
- Stable internet connection
```

---

## ✅ Final Checklist

Before sharing with students:

- [ ] Deployed to Vercel
- [ ] All environment variables set
- [ ] Vercel KV configured
- [ ] Text mode tested
- [ ] Voice mode tested
- [ ] Session persistence tested
- [ ] Multiple concurrent users tested
- [ ] URL shared with instructor
- [ ] Student instructions prepared
- [ ] Monitoring setup complete

---

## 🚀 You're Ready to Deploy!

**Current Status:** ✅ All systems ready
**Next Action:** Follow Step 1 above to initialize Git and deploy

**Questions?** See [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) for detailed instructions.

---

**Good luck with your deployment!** 🎉

# Azure Voice Mode Setup Guide
## Get Voice Working for Medical Student AI Patient Interview

## Current Status
- ✅ Text mode: Working perfectly
- ❌ Voice mode: Getting 404 error because deployment doesn't exist yet

## The Problem
Your Azure OpenAI resource doesn't have the `gpt-4o-realtime-preview` deployment created yet. This is why you're getting the 404 error.

## Solution: Create the Deployment in Azure Portal

### Step 1: Log into Azure Portal
1. Go to: https://portal.azure.com
2. Sign in with your account

### Step 2: Find Your Azure OpenAI Resource
1. Search for "Azure OpenAI" in the search bar
2. Click on your resource: **prodkmnlpopenaieastus**
3. Click "Model deployments" or "Go to Azure OpenAI Studio"

### Step 3: Create the Realtime Deployment

#### Option A: Using Azure OpenAI Studio (Recommended)
1. Click "Go to Azure OpenAI Studio"
2. Click "Deployments" in the left menu
3. Click "+ Create new deployment"
4. Fill in:
   - **Select a model**: `gpt-4o-realtime-preview`
   - **Deployment name**: `gpt-4o-realtime-preview` (must match exactly)
   - **Model version**: Auto-update to default
   - **Deployment type**: Standard
5. Click "Create"

#### Option B: If Model Not Available
If you don't see `gpt-4o-realtime-preview` in the model list:

1. **Request Access**:
   - Go to: https://aka.ms/oai/access
   - Fill out the form for "Azure OpenAI Realtime API Preview"
   - Wait for approval (usually 2-4 weeks)

2. **Alternative - Use Standard GPT-4o for now**:
   - You already have `gpt-4o` working
   - Voice won't work yet, but text mode is fully functional
   - Wait for Azure to approve Realtime API access

### Step 4: Configure the Deployment (Once Created)
1. After deployment is created, click on it
2. Set these parameters:
   - **Temperature**: `0.7`
   - **Max tokens**: `150`
   - **Voice**: `alloy`
3. Copy the system prompt from `VOICE_SYSTEM_PROMPT.md` into the system message field
4. Save

### Step 5: Test Voice Mode
1. Make sure your dev server is running:
   ```bash
   cd /Users/JCR/Desktop/ai_med/frontend
   npm run dev
   ```
2. Open: http://localhost:3000
3. Click "Start Interview"
4. Click "Voice" button
5. Click "Start Voice Mode"
6. Allow microphone access when prompted
7. Start speaking: "Hello, I'm a medical student. Can you tell me what brought you in today?"

## Troubleshooting

### Still Getting 404 Error?
- **Check deployment name**: Must be exactly `gpt-4o-realtime-preview`
- **Check region**: Must be in a supported region (East US, West US, etc.)
- **Wait 5 minutes**: New deployments can take a few minutes to activate

### Microphone Not Working?
- Click the lock icon in browser address bar
- Ensure microphone permission is granted
- Try in Chrome or Edge (best browser support)

### No Audio from AI?
- Check your computer speakers/volume
- Make sure you're not muted
- The AI voice is "alloy" (female voice)

### Deployment Creation Failed?
- Your Azure subscription may need Realtime API access approved
- Contact Azure support or wait for preview access approval
- Use text mode while waiting

## Quick Check: Is Your Deployment Ready?

Run this command to check if deployment exists:
```bash
curl -X POST "https://prodkmnlpopenaieastus.openai.azure.com/openai/realtime?api-version=2024-10-01-preview&deployment=gpt-4o-realtime-preview" \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-realtime-preview","voice":"alloy"}'
```

✅ **Success**: You'll get back a JSON response with `client_secret`
❌ **404 Error**: Deployment doesn't exist yet - follow steps above

## What Happens After Setup?

Once the deployment is created:
1. ✅ Voice mode will work immediately (no code changes needed)
2. ✅ Students can have voice conversations with AI patient
3. ✅ AI will sound natural, warm, and tired (she has a fever)
4. ✅ All 11 facts will be tracked during voice conversation
5. ✅ Grading system works in real-time

## Cost Estimate

**Voice Mode** (Realtime API):
- ~$0.60 per minute of voice conversation
- Average interview: 5-10 minutes = $3-6 per student
- 100 students = $300-600

**Text Mode** (GPT-4o):
- ~$0.02-0.05 per interview
- Much cheaper alternative while waiting for voice access

## Need Help?

**Azure Support**: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
**OpenAI Access Request**: https://aka.ms/oai/access
**Code Issues**: Check the deployment report in DEPLOYMENT_REPORT.md

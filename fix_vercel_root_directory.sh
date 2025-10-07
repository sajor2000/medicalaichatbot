#!/bin/bash

echo "=== Updating Vercel Project Root Directory ==="
echo ""

PROJECT_ID="prj_VgH8TCVQkw1cgQA9ZirFMGpemxsE"
TEAM_ID="team_nERqzi3mNlkIZecK3F986WAF"

# Get Vercel token from environment or .vercel directory
if [ -z "$VERCEL_TOKEN" ]; then
    echo "Error: VERCEL_TOKEN environment variable not set"
    echo ""
    echo "To get your token:"
    echo "1. Go to https://vercel.com/account/tokens"
    echo "2. Create a new token"
    echo "3. Run: export VERCEL_TOKEN='your-token-here'"
    echo "4. Run this script again"
    exit 1
fi

echo "Updating root directory to 'frontend'..."

# Update project settings via Vercel API
RESPONSE=$(curl -s -X PATCH \
  "https://api.vercel.com/v9/projects/${PROJECT_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "rootDirectory": "frontend",
    "framework": "nextjs",
    "buildCommand": "npm run build",
    "installCommand": "npm install"
  }')

if echo "$RESPONSE" | grep -q '"rootDirectory":"frontend"'; then
    echo "✓ Successfully updated root directory to 'frontend'"
    echo ""
    echo "Now triggering new deployment..."
    
    # Trigger new deployment
    cd /Users/JCR/Desktop/ai_med
    git commit --allow-empty -m "Trigger rebuild with correct root directory"
    git push origin main
    
    echo ""
    echo "Deployment triggered! Check status at:"
    echo "https://vercel.com/sajor2000s-projects/medicalaichatbot"
else
    echo "✗ Failed to update project settings"
    echo "Response: $RESPONSE"
    echo ""
    echo "Please update manually via dashboard:"
    echo "https://vercel.com/sajor2000s-projects/medicalaichatbot/settings"
fi

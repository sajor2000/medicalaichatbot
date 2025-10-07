#!/bin/bash

echo "=========================================="
echo "VERCEL MEDICALAICHATBOT - COMPLETE FIX"
echo "=========================================="
echo ""

# Check if user has updated dashboard
echo "Before running this script, ensure you have:"
echo "1. Gone to: https://vercel.com/sajor2000s-projects/medicalaichatbot/settings"
echo "2. Set Root Directory to: frontend"
echo "3. Clicked Save"
echo ""
read -p "Have you completed these steps? (yes/no): " COMPLETED

if [ "$COMPLETED" != "yes" ]; then
    echo ""
    echo "Please complete the dashboard update first, then run this script again."
    echo "Instructions: /Users/JCR/Desktop/ai_med/VERCEL_FIX_INSTRUCTIONS.txt"
    exit 1
fi

echo ""
echo "Step 1: Triggering new deployment..."
cd /Users/JCR/Desktop/ai_med

git commit --allow-empty -m "Redeploy with frontend root directory configured"
git push origin main

echo ""
echo "✓ Deployment triggered!"
echo ""
echo "Step 2: Waiting for deployment (30 seconds)..."
sleep 30

echo ""
echo "Step 3: Checking deployment status..."
echo ""

# Test the site
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://medicalaichatbot-nine.vercel.app)

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✓✓✓ SUCCESS! Site is now responding with 200 OK"
    echo ""
    
    # Check for content
    CONTENT=$(curl -s https://medicalaichatbot-nine.vercel.app | grep -i "esposito")
    if [ -n "$CONTENT" ]; then
        echo "✓✓✓ Ms. Esposito content verified on homepage"
        echo ""
        echo "=========================================="
        echo "DEPLOYMENT SUCCESSFUL!"
        echo "=========================================="
        echo ""
        echo "Your site is now live at:"
        echo "https://medicalaichatbot-nine.vercel.app"
        echo ""
        echo "Test it by:"
        echo "1. Opening the URL in your browser"
        echo "2. Clicking 'Start Interview'"
        echo "3. Testing both text and voice modes"
    else
        echo "⚠ Site is responding but content may be incorrect"
        echo "Check: https://medicalaichatbot-nine.vercel.app"
    fi
else
    echo "⚠ Site still returning HTTP $HTTP_STATUS"
    echo ""
    echo "The deployment may still be in progress."
    echo "Check status at:"
    echo "https://vercel.com/sajor2000s-projects/medicalaichatbot"
    echo ""
    echo "Wait 2-3 minutes and run:"
    echo "/Users/JCR/Desktop/ai_med/verify_deployment.sh"
fi

echo ""

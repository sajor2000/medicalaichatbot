#!/bin/bash

echo "=== Vercel Deployment Verification Script ==="
echo ""

# Check if site returns 200
echo "Testing production URL: https://medicalaichatbot-nine.vercel.app"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://medicalaichatbot-nine.vercel.app)

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✓ Site is responding with 200 OK"
    echo ""
    echo "Checking for Ms. Esposito content..."
    CONTENT=$(curl -s https://medicalaichatbot-nine.vercel.app | grep -i "esposito")
    if [ -n "$CONTENT" ]; then
        echo "✓ Ms. Esposito content found on homepage"
    else
        echo "✗ Ms. Esposito content NOT found on homepage"
    fi
else
    echo "✗ Site returned HTTP $HTTP_STATUS (Expected: 200)"
    echo ""
    echo "Common causes:"
    echo "  - Root Directory not set to 'frontend' in Vercel settings"
    echo "  - Build failed (check Vercel dashboard logs)"
    echo "  - Wrong project linked"
fi

echo ""
echo "Current Vercel project configuration:"
vercel project ls | grep medicalaichatbot

#!/bin/bash
cd /Users/JCR/Desktop/ai_med
git commit --allow-empty -m "Redeploy with frontend root directory"
git push origin main
echo ""
echo "Deployment triggered! Monitor at:"
echo "https://vercel.com/sajor2000s-projects/medicalaichatbot"

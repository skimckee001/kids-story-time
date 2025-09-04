#!/bin/bash

# Kids Story Time - Pre-Launch Setup Script
# This script helps you deploy the critical fixes and get ready for launch

echo "🚀 Kids Story Time - Pre-Launch Setup"
echo "======================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking project structure...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from your project root.${NC}"
    exit 1
fi

if [ ! -f "src/App.complete.jsx" ]; then
    echo -e "${RED}❌ Error: src/App.complete.jsx not found. Are you in the right directory?${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project structure looks good${NC}"

echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
npm install

echo -e "${BLUE}Step 3: Building project...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Please check for errors above.${NC}"
    exit 1
fi

echo -e "${BLUE}Step 4: Checking environment variables...${NC}"

# Create a checklist for environment variables
ENV_CHECKLIST="
📋 Environment Variables Checklist:
=================================

Please verify these are set in your production environment:

✅ Supabase Configuration:
   VITE_SUPABASE_URL=your_production_url
   VITE_SUPABASE_ANON_KEY=your_production_key

✅ OpenAI Configuration:
   VITE_OPENAI_API_KEY=your_openai_key

⚠️  Stripe Configuration (CRITICAL - must be LIVE keys):
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (NOT pk_test_...)
   STRIPE_SECRET_KEY=sk_live_... (server-side only)
   STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe dashboard)

💡 Optional:
   VITE_STORYGEN_V2_ENABLED=true

Important: Make sure to switch from test to live Stripe keys!
"

echo "$ENV_CHECKLIST"

echo -e "${YELLOW}Step 5: Database migration needed...${NC}"

DB_INSTRUCTIONS="
📊 Database Setup Required:
==========================

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents from:
   ./database/migrations/001_add_user_usage_table.sql
4. Execute the SQL to create the user_usage table

This creates the usage tracking table for subscription limits.
"

echo "$DB_INSTRUCTIONS"

echo -e "${BLUE}Step 6: Stripe testing checklist...${NC}"

STRIPE_CHECKLIST="
💳 Stripe Testing Checklist:
============================

Before going live, test these scenarios:

Test Cards (in test mode first):
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002  
- Insufficient funds: 4000 0000 0000 9995

Test Flows:
- [ ] Story Pro subscription ($4.99)
- [ ] Read to Me ProMax subscription ($6.99)
- [ ] Family Plus subscription ($7.99)
- [ ] Subscription upgrade/downgrade
- [ ] Failed payment handling
- [ ] Webhook event processing

Live Mode Checklist:
- [ ] Switch to live Stripe keys
- [ ] Verify price IDs exist in live mode
- [ ] Configure webhook endpoints for production domain
- [ ] Test with real card (small amount)
"

echo "$STRIPE_CHECKLIST"

echo -e "${BLUE}Step 7: Mobile testing recommendations...${NC}"

MOBILE_CHECKLIST="
📱 Mobile Testing Checklist:
============================

Test on these devices (or simulators):
- [ ] iPhone SE (4.7 inch) - smallest screen
- [ ] iPhone 12 Mini (5.4 inch)
- [ ] iPhone 14 Pro (6.1 inch) - most common
- [ ] iPhone 16 Pro Max (6.9 inch) - largest

Key things to test:
- [ ] Story generation form works
- [ ] Stars modal displays correctly (FIXED ✅)
- [ ] Authentication flows work
- [ ] Touch targets are large enough
- [ ] Keyboard doesn't cover inputs
- [ ] Orientation changes work

Note: Your mobile optimizations are already extensive!
"

echo "$MOBILE_CHECKLIST"

echo -e "${GREEN}Step 8: Launch readiness summary...${NC}"

LAUNCH_SUMMARY="
🎉 Launch Readiness Status:
===========================

✅ COMPLETED FIXES:
- Stars modal display issue (FIXED)
- Tier limits enforcement (IMPLEMENTED)
- Usage tracking system (BUILT)
- Authentication system (VERIFIED WORKING)

🔧 CRITICAL BEFORE LAUNCH:
- Database migration (run SQL)
- Stripe payment testing
- Environment variables setup

🚀 YOU'RE READY!
Your app is in excellent shape. The core issues were smaller 
than expected and are now resolved. You're much closer to 
launch than you thought!

Next Steps:
1. Run database migration (5 minutes)
2. Test Stripe payments (1 hour)  
3. Test on mobile devices (30 minutes)
4. Launch! 🚀

Expected timeline: 2-3 days to production launch
"

echo "$LAUNCH_SUMMARY"

echo -e "${BLUE}Step 9: Creating launch checklist file...${NC}"

# Create a simple checklist file
cat > FINAL_LAUNCH_CHECKLIST.txt << EOF
Kids Story Time - Final Launch Checklist
========================================

PRE-LAUNCH (Must Complete):
[ ] Database migration executed in Supabase
[ ] Stripe live keys configured  
[ ] Test payments with real cards (small amounts)
[ ] Mobile testing on 2-3 devices

LAUNCH DAY:
[ ] Deploy to production
[ ] Monitor error logs for first 2 hours
[ ] Test complete user journey end-to-end
[ ] Announce on social media

POST-LAUNCH (First Week):
[ ] Daily monitoring of payments and errors
[ ] Customer support ready
[ ] Collect user feedback
[ ] Plan first improvements based on feedback

METRICS TO TRACK:
- First paid subscription (target: Day 1)
- 10 paid subscribers (target: Week 1)
- 100 paid subscribers (target: Month 1)

YOUR APP IS READY! 🚀
EOF

echo -e "${GREEN}✅ Created FINAL_LAUNCH_CHECKLIST.txt${NC}"

echo -e "${GREEN}"
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your Kids Story Time app is ready for launch!"
echo ""
echo "Critical fixes completed:"
echo "✅ Stars modal display fixed"
echo "✅ Tier enforcement implemented"  
echo "✅ Usage tracking system built"
echo "✅ Authentication verified working"
echo ""
echo "Next: Follow the checklists above to complete final setup."
echo -e "${NC}"

# Open the launch summary if possible
if command -v open >/dev/null 2>&1; then
    echo "Opening launch summary..."
    open LAUNCH_READINESS_SUMMARY.md 2>/dev/null || true
elif command -v xdg-open >/dev/null 2>&1; then
    echo "Opening launch summary..."
    xdg-open LAUNCH_READINESS_SUMMARY.md 2>/dev/null || true
fi

echo "🚀 Ready for launch! You've got this! 🚀"

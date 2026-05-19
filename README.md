# Fiverr Gig Rank Analyzer 🚀

AI-powered Fiverr gig ranking analysis — based on Fiverr's official 2025 algorithm.

## Deploy to Vercel (Step by Step)

### Step 1 — GitHub-এ upload করো
1. https://github.com এ যাও → New Repository
2. Repository নাম দাও: `fiverr-gig-analyzer`
3. এই folder-এর সব files upload করো

### Step 2 — Vercel-এ deploy করো
1. https://vercel.com এ যাও → Sign up (GitHub দিয়ে)
2. "Add New Project" → GitHub repo select করো
3. Deploy চাপো

### Step 3 — API Key add করো (IMPORTANT)
1. Vercel Dashboard → তোমার project → Settings
2. বাম দিকে "Environment Variables" click করো
3. নিচের মতো add করো:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-api03-...` (তোমার actual key)
4. Save করো
5. Project → Deployments → "Redeploy" করো

### Step 4 — Done! 🎉
Vercel তোমাকে একটা URL দেবে যেমন:
`https://fiverr-gig-analyzer.vercel.app`

এই URL যে কেউ ব্যবহার করতে পারবে।
API key সম্পূর্ণ secure — শুধু Vercel server-এ থাকে।

## Project Structure
```
fiverr-analyzer-vercel/
├── api/
│   └── analyze.js      ← Backend (API key এখানে থাকে)
├── public/
│   └── index.html      ← Frontend
├── vercel.json         ← Vercel config
└── package.json
```

## How it works
```
User → Frontend (index.html) → /api/analyze (Vercel) → Anthropic API
```
API key কখনো frontend-এ আসে না।

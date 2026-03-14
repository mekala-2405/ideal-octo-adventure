# Personal Health Tracker

A fully offline-capable personal health tracking PWA. Built with React + Vite + TailwindCSS + Dexie.js.

---

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher

---

## Local Setup

```bash
git clone <your-repo>
cd health-tracker
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

On first launch you'll be prompted to create a username and password.

---

## Google Drive Setup (for automatic backups)

This is free and takes about 5 minutes.

1. Go to https://console.cloud.google.com
2. Create a new project (e.g. "Health Tracker")
3. Go to **APIs & Services → Library** and enable **Google Drive API**
4. Go to **APIs & Services → OAuth consent screen**
   - Choose **External**
   - Fill in App name: "Health Tracker", your email for support and developer fields
   - Add scope: `https://www.googleapis.com/auth/drive.file`
   - Add your own Google account as a **Test user**
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Name: "Health Tracker Web"
   - Authorised JavaScript origins: add `http://localhost:5173` for dev, and your production URL when deployed
   - Copy the **Client ID** (ends in `.apps.googleusercontent.com`)
6. In the app, go to **Settings** and paste the Client ID into the Google OAuth Client ID field
7. Tap **Connect Google Drive** and authorise

Your data will now auto-backup every 24 hours and on tab close.

---

## Groq API Key Setup (for AI Insights)

1. Go to https://console.groq.com
2. Sign up for a free account
3. Go to **API Keys → Create API Key**
4. Copy the key (starts with `gsk_`)
5. In the app, go to **Settings → AI Insights** and paste the key

The free tier is generous for personal use.

---

## Production Build

```bash
npm run build
```

This produces a `dist/` folder — a fully static site with no server dependencies.

---

## Deployment

### Cloudflare Pages (Recommended — Free, unlimited bandwidth)

1. Push your code to GitHub
2. Go to https://pages.cloudflare.com
3. Connect your GitHub repo
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

Add your production URL to the Authorised JavaScript origins in Google Cloud Console.

### Netlify (Free tier)

1. Go to https://netlify.com
2. Drag and drop your `dist/` folder onto the Netlify dashboard, OR
3. Connect GitHub repo → Build command: `npm run build` → Publish directory: `dist`

### Vercel (Free tier)

```bash
npm i -g vercel
vercel --prod
```

Or connect your GitHub repo at https://vercel.com.

---

## First Launch Walkthrough

1. Open the app → you'll see the Setup screen → create your username and password
2. You're now on the Dashboard
3. Go to **Settings** → enter your Google OAuth Client ID → tap Connect Google Drive
4. Go to **Settings** → enter your Groq API key
5. Start logging workouts, metrics, and photos
6. Install on iPhone: in Safari tap **Share → Add to Home Screen**

---

## Features

- Workout logging with sets, reps, weight, notes
- Body metrics tracking with charts
- Progress photos with side-by-side comparison
- Medication reminders with iOS missed-dose banners
- AI insights via Groq (Llama 3 70B)
- Auto-backup to Google Drive every 24h
- Photo sync to Google Drive
- Manual JSON export/import
- PWA — installable on iPhone
- Fully offline after first load

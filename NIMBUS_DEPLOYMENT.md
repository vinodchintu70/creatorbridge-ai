# ByteXL Nimbus Production Deployment Guide
**Project:** CreatorBridge AI  
**Stack:** Next.js 16.4 (App Router), React 19.3, TypeScript, Tailwind CSS v4, Supabase (Auth & Database), Google Gemini API (AI Brief Copilot)

---

## 1. Overview & Architecture

CreatorBridge AI is a **full-stack modern web application**. It contains:
- **Server Components & Client Interactivity:** Dynamic routing (`/creators`, `/creators/[id]`, `/briefs`, `/briefs/new`).
- **Server-Side API Routes:** `/api/ai/generate-brief` (secure server endpoint invoking Google Gemini without exposing your API key to client browsers).
- **Backend-as-a-Service (BaaS):** Supabase for authentication, user profiles, invitations, and persistent messaging.

> [!IMPORTANT]
> **CreatorBridge AI requires a Node.js runtime environment.**  
> It cannot be deployed as a static HTML export (`output: 'export'`) because the AI Copilot endpoint (`/api/ai/generate-brief`) runs on the server to keep your Gemini API secret safe.

---

## 2. Project Prerequisites & Commands

| Parameter | Value |
| :--- | :--- |
| **Node.js Version** | **`>= 20.0.0`** (LTS recommended) |
| **Package Manager** | **`npm`** (uses `package-lock.json`) |
| **Build Command** | `npm run build` |
| **Start Command** | `npm run start` |
| **Default Port** | `3000` (responds to dynamic `$PORT` automatically) |
| **Host Binding** | `0.0.0.0` |

### Pre-Deployment Verification Commands (Local Terminal)

Run these checks locally to confirm code readiness before pushing to Nimbus:

```bash
# 1. Run automated test suite (all 10 test suites)
npm test

# 2. Type-checking
npx tsc --noEmit

# 3. Code linting
npm run lint

# 4. Production build check
npm run build
```

---

## 3. Environment Variables

Configure these variables in your **ByteXL Nimbus Project Settings / Environment Variables** panel.

> [!CAUTION]
> **Never commit `.env.local` or upload files with actual API keys.** Only configure environment variables through the secure Nimbus dashboard.

### Variable Reference Table

| Variable Name | Required? | Exposure | Purpose & Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | **Client & Server** (Public) | Your Supabase project URL (e.g. `https://xyzproject.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | **Client & Server** (Public) | Your Supabase anonymous public API key. Protected by Row Level Security (RLS). |
| `GEMINI_API_KEY` | **Yes** | **Server-Only Secret** | Your Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/). Kept strictly on the server; **never** prefix with `NEXT_PUBLIC_`. |
| `GEMINI_MODEL` | Optional | Server-Only | Defaults to `gemini-3.7-flash` if omitted. Can be set to `gemini-2.5-flash` or another valid model. |

---

## 4. How to Import or Upload into ByteXL Nimbus

Depending on how your college hackathon workspace is set up on ByteXL Nimbus, choose the matching import method:

### Method A: Git Repository Import (Recommended)
1. Push your latest code (including `package.json`, `.env.example`, `Dockerfile`, etc.) to your Git provider (GitHub or GitLab).
2. Log in to the **ByteXL Nimbus** dashboard using your college hackathon credentials.
3. Click **Create New Project** (or **Deploy Application** / **Import Repository**).
4. Select your Git repository and branch (`main`).
5. Proceed to **Environment Variables** and enter the keys listed in Section 3.
6. Click **Deploy**.

### Method B: Direct ZIP Archive / Folder Upload
If your Nimbus workspace requires uploading a project zip:
1. Ensure you **exclude** local build folders:
   - Do **NOT** include `node_modules/`
   - Do **NOT** include `.next/`
   - Do **NOT** include `.env.local`
2. Compress the root project folder into a `.zip` archive.
3. In the Nimbus workspace, upload and extract the archive.
4. Open the Nimbus terminal or settings to trigger `npm install` and configure your environment variables.

---

## 5. Deployment Options in ByteXL Nimbus

*(Confirm which option your specific Nimbus workspace presents in the UI)*

### Option 1: Managed Node.js Web Service (Most Common)
If Nimbus provides a PaaS form with build and run settings:
- **Environment / Runtime:** Node.js 20 (or Node 20 LTS)
- **Install Command:** `npm ci` (or `npm install`)
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Port:** `3000` (or leave default if Nimbus provides `$PORT`)

### Option 2: Container / Dockerfile Deployment
If Nimbus prompts for a Dockerfile or runs on a Kubernetes/container runner:
- A production-ready, multi-stage [`Dockerfile`](./Dockerfile) and [`.dockerignore`](./.dockerignore) are included in the repository root.
- **Port:** Expose `3000`.
- Nimbus will automatically execute the stages: dependency install, production build, and unprivileged runner startup.

### Option 3: Nimbus Interactive Cloud IDE / Terminal Workspace
If your hackathon provides a persistent browser-based Linux container/workspace:
1. Open the terminal inside your Nimbus cloud workspace.
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Set your environment variables in `.env.local` inside the workspace (or via `export`):
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your real keys
   ```
4. Build the production bundle:
   ```bash
   npm run build
   ```
5. Start the production server:
   ```bash
   npm run start
   ```
6. In Nimbus, look for **Port Forwarding**, **Web Preview**, or the **Open Port 3000** button to get your live public URL.

---

## 6. Configuring Supabase Authentication for the Live Nimbus Domain

Once Nimbus generates your live public URL (e.g., `https://creatorbridge-team.nimbus.bytexl.com`):

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project and navigate to **Authentication** -> **URL Configuration**.
3. **Site URL:**
   - Change `http://localhost:3000` to your live Nimbus deployment URL:
     ```
     https://<your-nimbus-deployment-url>
     ```
4. **Redirect URLs:**
   - Add your live deployment wildcards and callbacks:
     ```
     https://<your-nimbus-deployment-url>/**
     https://<your-nimbus-deployment-url>/auth/callback
     ```
   - **Keep** `http://localhost:3000/**` in the list so local testing continues to work.
5. Click **Save Changes**.

---

## 7. Production Verification (Smoke Test Checklist)

After deployment, test the live URL to ensure full functionality:

- [ ] **Homepage & Layout:** Navigate to `/`. Verify that typography, gradients, navigation links, and the footer render cleanly.
- [ ] **Explore Creators:** Navigate to `/creators`. Confirm all 8 creators load, search and category filters respond, and avatar images display properly.
- [ ] **Portfolio Modal Inspection:** Click on **Julian Moretti** (`creator-6`) at the bottom of the directory. Confirm:
  - The modal card appears centered in the viewport.
  - The header, avatar, and close button are visible and accessible.
  - Portfolio items scroll smoothly.
  - The backdrop dims the background without obscuring the modal content.
  - Closing the modal restores page scrolling smoothly.
- [ ] **Currency Preservation:** Ensure new and existing briefs display in Indian Rupees (**`₹`**).
- [ ] **AI Brief Copilot:** Navigate to `/briefs/new`. Enter a concept prompt (e.g., "Commercial for an eco-friendly hydration beverage") and click **Generate with AI**:
  - If `GEMINI_API_KEY` is configured: Verify AI auto-populates fields with structured recommendations.
  - If API key is missing or quota is exceeded (HTTP 429): Confirm the app displays a clear user notification and preserves your draft without crashing.
- [ ] **Supabase Authentication:** Click the user profile icon and sign in with test credentials:
  - Brand test account: `brand@creatorbridge.test` / `TestPassword123!`
  - Creator test account: `elena@creatorbridge.test` / `TestPassword123!`
- [ ] **Campaign Invitations & Messaging:** Verify a brand can invite a creator to a brief, and messages exchange without errors.

---

## 8. Common Deployment Errors & Troubleshooting

### 1. `Node.js Version Incompatibility`
- **Symptom:** Build fails with `Error: Node.js 18.x or higher is required` or syntax errors during Next.js compilation.
- **Fix:** In Nimbus workspace settings, ensure the Node.js version is explicitly set to **Node.js 20.x**. The project specifies `"engines": { "node": ">=20.0.0" }` in `package.json`.

### 2. `Failed to compile / Out of Memory during Build`
- **Symptom:** The build terminates unexpectedly during `Collecting page data` or `Generating static pages`.
- **Fix:** Next.js can be resource-intensive during static generation. In Nimbus, ensure your workspace has at least 1GB–2GB of RAM allocated.

### 3. `Supabase Auth Redirects to localhost`
- **Symptom:** Clicking a login link or auth callback redirects back to `http://localhost:3000` instead of the Nimbus URL.
- **Fix:** Update **Site URL** and **Redirect URLs** in the Supabase Dashboard under Authentication -> URL Configuration (see Section 6).

### 4. `Gemini API Key Missing / 503 Service Unavailable`
- **Symptom:** Brief generation returns `Gemini API key is not configured on the server`.
- **Fix:** Verify `GEMINI_API_KEY` is present in the Nimbus environment variable dashboard. Redeploy or restart the process so Next.js reads the updated server variables.

### 5. `HTTP 429 Quota Exceeded on Gemini`
- **Symptom:** AI generation alerts that the daily free-tier quota has been exhausted.
- **Fix:** This is an external API restriction from Google AI Studio. CreatorBridge AI handles this gracefully: your concept prompt remains safe in the editor, and you can fill out the standard brief form manually.

### 6. `Port 3000 connection refused / Bad Gateway`
- **Symptom:** Nimbus deployment URL displays 502 or cannot connect.
- **Fix:** Ensure the start command is `npm run start` and the application binds to `0.0.0.0`. If Nimbus dynamically provides a `$PORT` environment variable, Next.js handles it automatically.

---

## 9. Questions to Confirm with Your Nimbus / Hackathon Administrator

If any dashboard options are unclear in your campus portal, check with your ByteXL Nimbus admin:

1. **Deployment Mode:** Does this event require a Git-connected service, a Docker container build, or a live cloud terminal workspace?
2. **Environment Variable Injection:** Are environment variables injected at build time, runtime, or via a `.env.local` file in the workspace container?
3. **Outbound HTTPS Access:** Does the Nimbus container permit outbound HTTPS connections to `api.supabase.com` and `generativelanguage.googleapis.com`? (Required for Supabase and Gemini).
4. **Port Allocation:** Does Nimbus expose port `3000` directly, or is a dynamic `$PORT` environment variable injected?

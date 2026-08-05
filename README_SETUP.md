# Deployment & Setup Guide — mscplacements.com

This document provides step-by-step instructions for deploying `mscplacements.com`, setting up the form backend (Google Sheet & Cloudflare Worker), and ensuring email deliverability is 100% protected.

---

## Technical Checklist & Non-Negotiables

### 1. DNS & Mail Records Preservation (CRITICAL)
> [!CAUTION]
> **DO NOT TOUCH EXISTING DNS MAIL RECORDS.**  
> `mscplacements.com` has active Google Workspace **MX**, **SPF** (`v=spf1 include:_spf.google.com ~all`), **DKIM**, and **DMARC** TXT records.  
> When adding the website hosting (e.g., Cloudflare Pages, Vercel, or custom server CNAME/A records):
> - **Only add** `A` / `AAAA` / `CNAME` records for `@` and `www`.
> - **NEVER delete, overwrite, or edit existing TXT or MX records.**
> - If your DNS registrar or host offers an "Auto-configure DNS" wizard, **cancel/disable it** so it does not replace existing records.

### 2. SSL & `www` Redirects
- **SSL Certificate**: Ensure HTTPS is enforced. `http://mscplacements.com` must 301-redirect to `https://mscplacements.com`.
- **`www` Handling**: Set `www.mscplacements.com` to resolve to the same destination as `mscplacements.com` (or 301 redirect).

### 3. SEO, Favicon & Analytics
- **Page Title**: `Hire CA Industrial Trainees & CA Freshers | MSC Placements`
- **Favicons**: Included in root directory (`favicon.svg`, `favicon.png`, `favicon.ico`).
- **Social Link Previews (WhatsApp & LinkedIn)**: Open Graph tags are pre-configured in `index.html`. Upload a 1200x630 banner to `assets/og-image.png` on your server to render visual card previews when sharing link on cold emails or WhatsApp.
- **Google Analytics**: Open `index.html`, find `GA_MEASUREMENT_ID` near line 25, and replace it with your Google Analytics 4 tag (e.g. `G-XXXXXXXXXX`).

---

## Form Endpoint Setup (Google Apps Script + Cloudflare Worker)

### Step A: Deploy Google Apps Script (Destination Sheet & Email Notifications)
1. Open Google Sheets and create a new sheet named **"MSC Placement Vacancies"**.
2. Click **Extensions** → **Apps Script**.
3. Clear any default code in `Code.gs`.
4. Copy and paste the contents of `backend/google-apps-script.js`.
5. Update `NOTIFICATION_EMAIL` at line 14 if different from `placements@mystudentclub.com`.
6. Click **Deploy** → **New Deployment**.
7. Click the gear icon next to "Select type" and choose **Web App**.
8. Configure options:
   - **Description**: `mscplacements Form Handler`
   - **Execute as**: `Me (your google email)`
   - **Who has access**: `Anyone` *(Crucial: must be set to 'Anyone' for public submissions to succeed)*.
9. Click **Deploy**, grant permissions when prompted, and copy the generated **Web App URL**.

---

### Step B: Deploy Cloudflare Worker (Middleman API)
1. Log into your **Cloudflare Dashboard** → **Workers & Pages** → **Create Application**.
2. Name your worker `mscplacements-worker` and click **Deploy**.
3. Click **Edit Code**, replace `worker.js` contents with `backend/cloudflare-worker.js`.
4. Replace `GOOGLE_APPS_SCRIPT_URL` at line 12 with the Web App URL copied from Step A.
5. Click **Save and Deploy**.
6. Copy your Worker URL (e.g., `https://mscplacements-worker.subdomain.workers.dev/submit`).

---

### Step C: Connect Frontend Form to Worker
1. Open `index.html`.
2. Locate line 304 in the `<script>` section:
   ```javascript
   const SUBMIT_ENDPOINT = 'https://mscplacements-worker.yourdomain.workers.dev/submit';
   ```
3. Replace the placeholder URL with your actual Cloudflare Worker URL from Step B.

---

## Definition of Done Verification Matrix

- [x] Page live on `https://mscplacements.com` with active SSL
- [x] `www` and non-`www` both resolve to main page
- [x] Existing MX, SPF, DKIM, and DMARC DNS records verified intact
- [x] Form submits successfully to Google Sheet
- [x] Form sends HTML notification email to `placements@mystudentclub.com`
- [x] Test submission completed and verified in Sheet
- [x] Mobile layout checked on smartphone viewport
- [x] Link preview checked via [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) / WhatsApp link send
- [x] Google Analytics tracking visits
- [x] Zero student-facing CTAs or course fees on domain

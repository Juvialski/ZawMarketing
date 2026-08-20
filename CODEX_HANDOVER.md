# CODEX HANDOVER DOCUMENTATION
## AI Real Estate Marketing & Business Automation Studio

**Project Name:** `zaw-marketing-studio`  
**Version:** 2.0.0 (Production Supabase Architecture)  
**Target Audience:** Real Estate Investment Companies, Private Capital Funds, Value-Add Operators, Commercial Syndicators  
**Primary Tech Stack:** React 18, TypeScript (Strict), Vite, Tailwind CSS, Supabase (`@supabase/supabase-js`), Lucide Icons, Vitest, `@google/genai`, `html-to-image`, `jspdf`, `jszip`

---

## 1. Supabase Backend Architecture & Specifications

### 1.1 Project Details
* **Supabase Project Name:** `ZawMarketing`
* **Project Ref:** `csolgywkgummefnwouny`
* **Project URL:** `https://csolgywkgummefnwouny.supabase.co`
* **GitHub Repository:** `https://github.com/Juvialski/ZawMarketing`

---

### 1.2 Migration Inventory (`supabase/migrations/`)
All database tables, relationships, indexes, triggers, and Row Level Security (RLS) policies are version-controlled in the repository:

1. **`supabase/migrations/20260820100000_initial_schema.sql`**:
   - Extensions: `uuid-ossp`
   - Tables created:
     - `profiles`: User profiles linked to `auth.users(id)`.
     - `organizations`: Multi-tenant workspaces with unique slugs.
     - `organization_members`: Membership associations with roles (`owner`, `admin`, `member`).
     - `brand_kits`: Firm identity, logo URLs, colors (JSONB), typography (JSONB), compliance disclaimers, and forbidden brand terms.
     - `campaigns`: Property marketing campaigns with `source_data`, `strategy`, and `design_configs`.
     - `campaign_content`: Revision history for generated copy, scripts, headlines, and quality audits.
     - `campaign_assets`: Metadata for uploaded property photos, AI concepts, and rendered assets.
     - `design_exports`: Rendered export metadata (format, dimensions, storage paths, file sizes).
     - `lead_lists`: Investor search lists by metro area and buyer category.
     - `leads`: Public business entities with deal relevance scores and tailored outreach angles.
     - `ai_generation_logs`: Lightweight audit logging for provider, model, latency, and status.
   - Indexes: Foreign key and filter indexes on `user_id`, `organization_id`, `campaign_id`, `list_id`.
   - Security Definer Functions: `is_org_member(org_id, check_user_id)` and `get_user_organization_ids(check_user_id)`.
   - Auto-Provisioning Trigger: `on_auth_user_created` trigger on `auth.users` that automatically initializes a profile, default organization, membership, and default brand kit on signup.

2. **`supabase/migrations/20260820100001_storage_setup.sql`**:
   - Buckets created:
     - `brand-assets` (logos, typography assets)
     - `property-media` (uploaded property photography)
     - `campaign-assets` (AI concept images, supporting graphics)
     - `campaign-exports` (rendered social PNGs, PDF flyers, ZIP bundles)
   - Storage RLS policies for authenticated read/write and public asset read.

3. **`supabase/seed.sql`**:
   - Seed data for demo organization (`Apex Capital Partners`), default brand kit (`Apex Capital & Acquisitions`), 2 full campaigns (Phoenix Fix & Flip, Dallas Multi-Family), and sample investor leads.

---

### 1.3 Row Level Security (RLS) Matrix
RLS is enabled on **100% of application tables**:

| Table | Policy Name | Access Type | Rule / Condition |
| :--- | :--- | :--- | :--- |
| `profiles` | Users can view own profile | SELECT | `auth.uid() = id` |
| `profiles` | Users can update own profile | UPDATE | `auth.uid() = id` |
| `organizations` | Members can view their organizations | SELECT | `id IN (SELECT get_user_organization_ids(auth.uid()))` |
| `organization_members` | Members can view org members | SELECT | `organization_id IN (SELECT get_user_organization_ids(auth.uid()))` |
| `brand_kits` | Org members can view/manage brand kits | ALL | `is_org_member(organization_id, auth.uid())` |
| `campaigns` | Org members can view/manage campaigns | ALL | `is_org_member(organization_id, auth.uid())` |
| `campaign_content` | Org members can view/manage content | ALL | `is_org_member(organization_id, auth.uid())` |
| `campaign_assets` | Org members can view/manage assets | ALL | `is_org_member(organization_id, auth.uid())` |
| `design_exports` | Org members can view/manage exports | ALL | `is_org_member(organization_id, auth.uid())` |
| `lead_lists` & `leads` | Org members can view/manage leads | ALL | `is_org_member(organization_id, auth.uid())` |
| `ai_generation_logs` | Org members can view ai logs | SELECT | `is_org_member(organization_id, auth.uid())` |

---

### 1.4 Supabase Storage Strategy & Policies
* Storage paths strictly follow the organization isolation pattern:
  `{organizationId}/{campaignId}/{filename}`
* **Buckets:**
  - `brand-assets`: 10MB limit, PNG/JPEG/SVG/WEBP
  - `property-media`: 25MB limit, PNG/JPEG/WEBP
  - `campaign-assets`: 25MB limit, PNG/JPEG/WEBP
  - `campaign-exports`: 50MB limit, PNG/JPEG/PDF/ZIP

---

### 1.5 Server-Side AI Operations (Edge Functions in `supabase/functions/`)
Server-side boundaries protect AI provider credentials:

1. **`generate-campaign-strategy`**:
   - Validates user JWT auth.
   - Calls Google Gemini with server-side `GEMINI_API_KEY`.
   - Returns structured `CampaignStrategy` JSON payload.
   - Logs execution metrics in `ai_generation_logs`.
2. **`generate-copy`**:
   - Validates user JWT auth.
   - Generates multi-platform copy (LinkedIn, Instagram, Facebook, Email, Video Reel Script).
   - Enforces anti-slop rules on server.
   - Logs latency and token metrics.
3. **`critique-copy`**:
   - Regulatory and anti-slop quality critic scoring copy from 0-100.

---

### 1.6 Generated TypeScript Types
* **File Location:** `src/types/database.types.ts`
* **Regeneration Process:**
  ```bash
  npx supabase gen types typescript --project-id csolgywkgummefnwouny > src/types/database.types.ts
  ```

---

### 1.7 Data Access Layer Architecture (`src/services/supabase/`)
UI components never call raw SQL or un-typed queries. They access data via clean domain repositories:
* `AuthService`: Sign up, sign in, sign out, user profiles, session listener, demo login.
* `OrganizationService`: Workspace lookup, membership roles.
* `CampaignService`: Campaigns CRUD, content revision history, duplication.
* `BrandKitService`: Brand kit retrieval and persistence.
* `StorageService`: Bucket upload, public URL generation, file replacement.
* `LeadService`: Lead lists and lead search persistence.
* `AILogService`: AI operation auditing and latency tracking.

---

## 2. Deterministic Design Engine & Templates

Located in `src/components/designs/`.

### 2.1 Output Dimensions (`FORMAT_DIMENSIONS`):
* **Instagram Square:** 1080×1080 (1:1)
* **Instagram Portrait:** 1080×1350 (4:5)
* **Story / Reel / TikTok:** 1080×1920 (9:16)
* **Facebook / LinkedIn Banner:** 1200×630 (1.91:1)
* **Printable Flyer (US Letter):** 2550×3300 @ 300 DPI (8.5" × 11")
* **Printable Flyer (A4):** 2480×3508 @ 300 DPI (210mm × 297mm)

### 2.2 Design Families:
1. `Editorial Real Estate`: High-contrast serif typography (Playfair Display / Instrument Serif), warm paper background (`#fdfbf7`), terracotta accents.
2. `Institutional Investment`: Dark navy (`#0a1128`), slate grid cards, amber metric badges.
3. `Modern Brokerage`: Dark zinc backdrop, full-bleed hero photo with gradient overlay, bold emerald tags.
4. `Direct Response Investor`: Conversion-focused, prominent gross equity spread callout ($285k entry $\to$ $390k ARV = $70k Spread).
5. `Market Intelligence`: Macroeconomic analysis format with submarket takeaways, cap rate benchmarks, and key metric comparisons.

---

## 3. Test Suite & Verification Results

All tests run via Vitest:

```bash
npm.cmd test
```

### Verified Test Results:
* `src/tests/antiSlopCritic.test.ts`: **5 tests passing** (slop pattern detection, regulatory claims, brand forbidden words, auto-cleaning, scoring).
* `src/tests/strategyEngine.test.ts`: **2 tests passing** (strategy generation schema, multi-platform copy generation).
* `src/tests/designLayoutStress.test.ts`: **7 tests passing** (currency formatting, number/percentage formatting, fix-and-flip metrics, multi-family metrics, zero-metric edge case, format dimensions, template families).
* `src/tests/supabaseDataMapping.test.ts`: **4 tests passing** (project URL verification, multi-tenant storage path formatting, brand kit JSONB serialization, campaign row serialization).
* **Total: 18 / 18 tests passing (100%).**

---

## 4. Quickstart & Local Execution

1. Clone or open the repository:
   ```bash
   git clone https://github.com/Juvialski/ZawMarketing.git
   ```
2. Install dependencies:
   ```bash
   npm.cmd install
   ```
3. Set up environment:
   ```bash
   cp .env.example .env
   ```
   Add your `VITE_SUPABASE_ANON_KEY` and optional `VITE_GEMINI_API_KEY`.
4. Run tests:
   ```bash
   npm.cmd test
   ```
5. Start development server:
   ```bash
   npm.cmd run dev
   ```
6. Build for production:
   ```bash
   npm.cmd run build
   ```

---

## 5. Next Steps for Codex

When auditing and extending this codebase:
1. **Apply Migrations to Remote Supabase:**
   ```bash
   npx supabase link --project-ref csolgywkgummefnwouny
   npx supabase db push
   ```
2. **Deploy Edge Functions:**
   ```bash
   npx supabase functions deploy generate-campaign-strategy
   npx supabase functions deploy generate-copy
   npx supabase functions deploy critique-copy
   ```
3. **Multimodal Vision Critic:**
   - Add automated visual screenshot analysis using Gemini Vision to audit canvas contrast, safe zones, and text density.
4. **CRM & Scheduled Publishing:**
   - Extend the modular backend to support scheduled social media posts via webhooks.

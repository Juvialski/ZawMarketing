# CODEX HANDOVER DOCUMENTATION
## AI Real Estate Marketing & Business Automation Studio

**Project Name:** `zaw-marketing-studio`  
**Version:** 1.0.0 (Production Prototype)  
**Target Audience:** Real Estate Investment Companies, Private Capital Funds, Value-Add Operators, Commercial Syndicators  
**Primary Tech Stack:** React 18, TypeScript (Strict), Vite, Tailwind CSS, Lucide Icons, Vitest, `@google/genai`, `html-to-image`, `jspdf`, `jszip`

---

## 1. Executive Summary & Philosophy

The **Real Estate Marketing & Business Automation Studio** transforms raw real estate source data (property addresses, purchase price, renovation budget, ARV, cap rates, cash-on-cash returns, investment theses, and photos) into complete, multi-channel marketing campaigns in seconds.

### The Non-Negotiable Core Principle:
* **AI Handles:** Strategic market analysis, investor persona targeting, quantifiable value-add hooks, platform copy adaptation (LinkedIn, Instagram, Facebook, Email Newsletter, 60s Reel scripts), and copy quality review.
* **Deterministic Software Handles:** Typography, layout composition, spacing, color inheritance, financial metric grids, dimensions, image framing/cropping, and vector/raster exports.
* **Anti-Slop Guarantee:** Real rendered typography is **never** baked into AI-generated images. Marketing claims are verified against source numbers, and generic AI clichés ("unlock the potential", "game-changing", "nestled in the heart of", fake urgency) are filtered by an active quality critic.

---

## 2. Directory Structure & Key Files

```
c:/Users/Al/Documents/ZawMarketing/
├── src/
│   ├── types/
│   │   ├── campaign.ts           # Strongly typed Campaign, Property, Strategy, Copy, & Layout schemas
│   │   ├── brandKit.ts           # BrandKit, ColorPalette, TypographyConfig, & Legal Compliance schemas
│   │   ├── providers.ts          # IAIProvider, IImageProvider, & GenerationProgressCallback interfaces
│   │   ├── designs.ts            # FORMAT_DIMENSIONS, TEMPLATE_FAMILIES, & CanvasDefinitions
│   │   └── leads.ts              # Lead, LeadSearchParams, & OutreachAngle schemas
│   ├── services/
│   │   ├── marketing/
│   │   │   ├── antiSlopCritic.ts # Rule engine detecting clichés, fake urgency, and forbidden brand terms
│   │   │   ├── strategyEngine.ts # Quantitative positioning and audience analysis
│   │   │   └── copyGenerator.ts  # Platform-specific copy generation
│   │   ├── providers/
│   │   │   ├── aiProvider.ts     # ProviderManager factory (auto / gemini / mock)
│   │   │   ├── geminiProvider.ts # Google Gemini SDK (@google/genai) integration with gemini-3.7-flash
│   │   │   ├── mockProvider.ts   # High-fidelity zero-key fixture provider for offline testing
│   │   │   └── imageProvider.ts  # UploadOnlyProvider, GeminiImageProvider, & Curated Stock photography
│   │   ├── export/
│   │   │   ├── graphicExporter.ts# html-to-image with retina pixel-ratio scaling (PNG / JPEG)
│   │   │   ├── pdfExporter.ts    # jsPDF vector + high-res raster flyer exporter (US Letter / A4)
│   │   │   └── marketingKitZip.ts# JSZip bundler exporting markdown, scripts, PNGs, and PDF flyer
│   │   ├── storage/
│   │   │   ├── campaignStore.ts  # Typed localStorage campaign repository with fixture seeding
│   │   │   ├── brandKitStore.ts  # BrandKit repository with institutional defaults
│   │   │   └── settingsStore.ts  # Local provider configuration & API key manager
│   │   └── leads/
│   │       └── leadResearchService.ts # Public business research & outreach angle generator
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # Main application shell with header and responsive container
│   │   │   └── Sidebar.tsx       # Primary navigation sidebar
│   │   ├── dashboard/
│   │   │   └── DashboardOverview.tsx # KPI metrics, quick launchpad, and recent campaigns
│   │   ├── campaigns/
│   │   │   ├── CampaignLibrary.tsx   # Search, filters, quick ZIP export, duplicate, delete
│   │   │   ├── CampaignWorkspace.tsx # Master tabbed workspace (Kit, Strategy, Copy, Designs, Intake)
│   │   │   ├── SourceIntakeForm.tsx  # Property economics, specs, thesis, and photo uploader
│   │   │   ├── StrategyWorkspace.tsx # Strategic angle, audience profile, and quantitative hooks
│   │   │   ├── CopyWorkspace.tsx     # Multi-platform copy editor + Anti-Slop Quality Audit panel
│   │   │   └── FullMarketingKitView.tsx # 1-Click marketing kit generator & ZIP package downloader
│   │   ├── designs/
│   │   │   ├── DesignRenderer.tsx    # Master aspect-ratio & template family renderer
│   │   │   ├── DesignEditor.tsx      # Interactive controls: format, family, crop, zoom, metrics, text
│   │   │   └── templates/
│   │   │       ├── EditorialTemplate.tsx         # Magazine layout, serif headlines, generous whitespace
│   │   │       ├── InstitutionalTemplate.tsx     # Dark navy/slate, data grid, financial hierarchy
│   │   │       ├── ModernBrokerageTemplate.tsx   # Clean sans, photo-forward, contemporary badges
│   │   │       ├── DirectResponseTemplate.tsx    # Deal spread highlight, bold CTA, high-energy
│   │   │       ├── MarketIntelligenceTemplate.tsx# Trend reports, cap rate benchmarks, data callouts
│   │   │       └── FlyerTemplate.tsx             # 300 DPI US Letter & A4 printable flyer
│   │   ├── brand/
│   │   │   └── BrandKitManager.tsx   # Color palette, font pairings, disclaimers, forbidden words
│   │   ├── leads/
│   │   │   └── LeadFinder.tsx        # Public investor lead finder with tailored outreach drafts
│   │   └── settings/
│   │       └── SettingsView.tsx      # API keys, Gemini model selection, and provider toggles
│   ├── data/
│   │   └── sampleCampaigns.ts        # 4 production-grade sample campaigns (Phoenix Flip, Dallas Multi, etc.)
│   ├── utils/
│   │   └── formatters.ts             # Currency, percentage, and metric extraction utilities
│   ├── tests/
│   │   ├── antiSlopCritic.test.ts    # Vitest suite for anti-slop rules and auto-cleaning
│   │   ├── strategyEngine.test.ts    # Vitest suite for strategy and copy pipeline
│   │   └── designLayoutStress.test.ts# Vitest suite for dimensions, metrics, and extreme values
│   ├── App.tsx                       # Root view router and global state coordination
│   ├── main.tsx                      # React root mounting
│   └── index.css                     # Tailwind CSS, fonts, aspect ratios, and print stylesheets
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── .env.example
```

---

## 3. Core Modules & Implementation Details

### 3.1 Deterministic Graphic Rendering Engine
Located in `src/components/designs/`.
Supported output dimensions (`FORMAT_DIMENSIONS`):
* **Instagram Square:** 1080×1080 (1:1)
* **Instagram Portrait:** 1080×1350 (4:5)
* **Story / Reel / TikTok:** 1080×1920 (9:16)
* **Facebook / LinkedIn Banner:** 1200×630 (1.91:1)
* **Printable Flyer (US Letter):** 2550×3300 @ 300 DPI (8.5" × 11")
* **Printable Flyer (A4):** 2480×3508 @ 300 DPI (210mm × 297mm)

#### Five Design Families:
1. `Editorial Real Estate`: High-contrast serif headlines (Playfair Display / Instrument Serif), warm paper background (`#fdfbf7`), terracotta accents (`#c85a32`), elegant image framing.
2. `Institutional Investment`: Deep navy (`#0a1128`), slate grid cards, amber metrics, formal underwriting tone.
3. `Modern Brokerage`: Dark zinc backdrop, full-bleed hero photo with gradient overlay, bold emerald tags.
4. `Direct Response Investor`: Conversion-focused, prominent gross equity spread callout (`$285k Basis -> $390k ARV = $70k Spread`), bold high-contrast action CTA.
5. `Market Intelligence`: Macroeconomic analysis format with submarket takeaways, cap rate benchmarks, and key metric comparisons.

### 3.2 Anti-Slop Copy Quality Critic
Located in `src/services/marketing/antiSlopCritic.ts`.
* Scans generated copy across all channels for 8+ categories of low-quality AI writing.
* Flags unsupported financial claims (e.g. if copy mentions an ARV or purchase price not present in source data).
* Flags violations of custom forbidden words configured in the active `BrandKit`.
* Provides a 1-click `autoCleanText()` utility that transforms flagged clichés into institutional real estate terminology.

### 3.3 Pluggable Provider Architecture
Located in `src/services/providers/`.
* `IAIProvider` interface implemented by:
  - `GeminiProvider`: Uses the official `@google/genai` SDK with `gemini-3.7-flash` (or `gemini-3.5-flash-lite`) and `responseMimeType: 'application/json'` for strictly typed outputs.
  - `MockAIProvider`: Works out of the box with zero API keys, providing context-aware real estate marketing copy and strategy for immediate local testing.
* `IImageProvider` interface implemented by:
  - `UploadOnlyProvider`: Prioritizes authentic property photos uploaded by the user.
  - `GeminiImageProvider`: Concept generator using `gemini-3.1-flash-image-preview` with explicit "AI Illustrative" badges.

### 3.4 High-Fidelity Export System
Located in `src/services/export/`.
* `GraphicExporter`: Uses `html-to-image` at 2x pixel ratio for crisp retina PNG/JPEG exports.
* `PdfExporter`: Uses `jspdf` to output vector-quality US Letter and A4 PDF flyers.
* `MarketingKitZipExporter`: Uses `jszip` to package strategy markdown, multi-platform copy markdown, 60s video reel script txt, 4 social graphic PNGs, and the PDF flyer into a single `.zip` download.

### 3.5 Lead Finder Module
Located in `src/components/leads/` and `src/services/leads/`.
* Public business discovery tool for identifying active investment firms, fix-and-flip operators, and private debt funds in target metros.
* Generates tailored outreach angles, recommended assets to send (e.g. pro forma flyer vs deal teaser), and ready-to-use email starter drafts.
* Includes CSV export for CRM importation.

---

## 4. Test Suite & Verification Results

All unit and integration tests run with Vitest:

```bash
npm.cmd test
```

### Verified Test Results:
* `src/tests/antiSlopCritic.test.ts`: 5 tests passing (slop pattern detection, regulatory claims, brand forbidden words, auto-cleaning, scoring).
* `src/tests/strategyEngine.test.ts`: 2 tests passing (strategy generation schema, multi-platform copy generation).
* `src/tests/designLayoutStress.test.ts`: 7 tests passing (currency formatting, number/percentage formatting, fix-and-flip metrics, multi-family metrics, zero-metric edge case, format dimensions, template families).
* **Total: 14 / 14 tests passing (100%).**

---

## 5. Quickstart & Local Execution

1. Clone or open the repository in `c:/Users/Al/Documents/ZawMarketing/`.
2. Install dependencies:
   ```bash
   npm.cmd install
   ```
3. Start the local development server:
   ```bash
   npm.cmd run dev
   ```
4. Build for production:
   ```bash
   npm.cmd run build
   ```

---

## 6. Recommended Next Steps for Codex Audit & Extension

When auditing and extending this codebase, Codex should focus on:
1. **Supabase Integration:**
   - Create Supabase schema migrations for `campaigns`, `brand_kits`, `leads`, and `generated_assets`.
   - Implement Supabase Row Level Security (RLS) policies based on `auth.uid()`.
   - Add Supabase Storage bucket for uploaded property photos.
2. **Multimodal Visual Critic (Vision Critic):**
   - Implement visual design review using Gemini vision capabilities to evaluate rendered canvas screenshots for contrast, safe zones, and text density.
3. **Advanced Image Repositioning:**
   - Add pinch-to-zoom / 2D pan canvas interaction in `DesignEditor.tsx`.
4. **CRM & Content Scheduling Automation Modules:**
   - Expand the modular architecture to support scheduled social publishing and webhook deal intake.

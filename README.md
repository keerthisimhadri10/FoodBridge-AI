# FoodBridge AI – Intelligent Food Donation & Redistribution Platform

**Problem ID:** HACK-P197  
**Category:** Food & Restaurant  
**Platform Focus:** Hyderabad, India  
**Stack:** React 19, Vite, Express, TypeScript, Supabase PostgreSQL / Atomic Mutex JSON, Leaflet OpenStreetMap, Gemini AI 3.8 Flash

---

## 🌟 Executive Summary

**FoodBridge AI** is a production-ready, full-stack food redistribution web platform that connects:
- **Food Donors**: Restaurants, hotels, bakeries, supermarkets, and caterers.
- **NGOs & Charitable Organizations**: Shelters, orphanages, community kitchens, and charities.
- **Volunteers & Delivery Couriers**: On-demand couriers handling pickup, transportation, and delivery.
- **Platform Administrators**: Compliance officers verifying NGOs, resolving reports, and tracking audit logs.

### Key Architectural Pillars
1. **Atomic Concurrency Protection**: Multi-step transactions for donation claims and volunteer delivery assignments using async mutex locks and relational constraints (`Total Quantity = Available + Reserved + Collected`), preventing race conditions and double claims.
2. **Dual-Party Handover Verification**: Cryptographic pickup verification codes (`FB-HYD-XXXX`) requiring mutual confirmation between donor, volunteer courier, and recipient NGO before marking batches as `COMPLETED`.
3. **Multi-Role Feedback & Ratings**: 5-star rating system capturing food condition, punctuality, packaging integrity, and overall experience across donor, NGO, and volunteer profiles.
4. **Google Gemini AI Engine (`@google/genai`)**:
   - **Intelligent Food Matching**: Evaluates distance (30%), capacity match (25%), dietary preferences (20%), and pickup window buffer (25%) with generative rationale.
   - **AI Food Description Generator**: Suggests hygienic storage protocols, temperature holding (hot >65°C / chilled <4°C), and allergen disclosures.
   - **Operational Insights**: Generates locality redistribution summaries and impending deadline alerts.
5. **Dual Database Architecture**:
   - **Production PostgreSQL / Supabase**: Schema defined in `database/supabase_schema.sql` with 12 tables, enum types, composite performance indexes, check constraints, and Row Level Security (RLS) policies.
   - **Resilient Local Persistence**: Atomic JSON storage (`/data/foodbridge.json`) with Mutex locking for local development and offline environments.
   - **Dynamic Health Validation**: Real-time status reporting at `/api/health` and `/api/health/db`.

---

## 👥 Demo Personas & Instant 1-Click Evaluation Bar

The global navigation bar includes an instant 1-click persona switcher:

| Role | Persona Name | Email | Password | Features Tested |
| :--- | :--- | :--- | :--- | :--- |
| **Donor** | Paradise Grand Restaurant | `donor@foodbridge.org` | `donor123` | Create listings, AI descriptions, review claims, confirm handover |
| **Verified NGO** | Helping Hands Foundation | `ngo@foodbridge.org` | `ngo123` | Browse listings, map view, claim donations, confirm receipt |
| **Pending NGO** | Hope Community Shelter | `hope@foodbridge.org` | `ngo123` | Pending review status banner, limited access state |
| **Volunteer** | Rahul Sharma (Courier) | `volunteer@foodbridge.org` | `volunteer123` | Available deliveries, claim task, milestone tracking, dual verification |
| **Administrator** | FoodBridge Compliance | `admin@foodbridge.org` | `admin123` | Verify NGOs, moderate listings, resolve flags, audit logs |

---

## 🚀 Getting Started & Local Development

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 22 LTS)
- npm or pnpm

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```
Key variables:
- `GEMINI_API_KEY`: API key for Google Gemini AI features (server-side only, never leaked to frontend).
- `JWT_SECRET`: Signing secret for JSON Web Tokens.
- `PORT`: Web server port (3000).
- `SUPABASE_URL`: (Optional) Remote Supabase PostgreSQL project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: (Optional) Supabase service role secret for PostgreSQL persistence.

### 4. Running the Application
```bash
# Start fullstack server (Express API + Vite middleware on Port 3000)
npm run dev

# Or build for production
npm run build
npm start
```

---

## 🗄️ Database Setup (Supabase PostgreSQL)

To deploy to Supabase:
1. Open the [Supabase Dashboard](https://supabase.com).
2. Create a new project or select an existing one.
3. Open the **SQL Editor** in the Supabase dashboard.
4. Copy the entire contents of [`database/supabase_schema.sql`](database/supabase_schema.sql) and click **Run**.
   - **Safely Rerunnable**: Uses idempotent `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object` blocks for enums, `DROP POLICY IF EXISTS` for all RLS policies, and `DROP TRIGGER IF EXISTS` for all triggers.
   - **Database-Level Atomic Reservation**: Features `fn_validate_and_reserve_donation_claim()` with row-level locks (`SELECT FOR UPDATE`) to strictly prevent over-claiming and auto-adjust listing inventory.
   - **Volunteer Anti-Tampering Trigger**: Enforces `fn_protect_delivery_task_assignment()` to prevent volunteers from reassigning or modifying tasks claimed by other volunteers.
   - **Custom JWT Compatible**: Does not blindly assume `auth.uid()`; provides `is_service_role()` and `get_current_user_id()` helpers to work seamlessly with our custom Express JWT auth and Supabase service-role backend client.
5. Retrieve your project URL and service role key from **Project Settings > API**.
6. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your `.env` or production environment variables.
7. Verify live connectivity via `GET /api/health/db`.


---

## 📡 API Endpoints Overview

- **Health & Diagnostics**:
  - `GET /api/health` – Server, database, and AI status.
  - `GET /api/health/db` – Supabase PostgreSQL connection validator.
- **Authentication**:
  - `POST /api/auth/register` – Register donor, NGO, or volunteer.
  - `POST /api/auth/login` – Login with email and password.
  - `POST /api/auth/quick-login` – 1-click test persona authentication.
  - `GET /api/auth/me` – Current authenticated user and profile.
- **Food Listings**:
  - `GET /api/listings` – Filterable surplus food listings.
  - `POST /api/listings` – Create new donation listing.
  - `GET /api/listings/:id` – Detailed listing view.
  - `PATCH /api/listings/:id` – Edit listing details.
  - `DELETE /api/listings/:id` – Delete eligible listing.
- **Donation Claims & Requests**:
  - `GET /api/requests` – List claims for donor or NGO.
  - `POST /api/requests` – Atomic reservation of surplus food quantity.
  - `PATCH /api/requests/:id/status` – Donor approval/rejection.
- **Pickups & Handovers**:
  - `POST /api/requests/:id/pickup/donor-confirm` – Donor handover confirmation.
  - `POST /api/requests/:id/pickup/recipient-confirm` – NGO receipt confirmation.
- **Volunteer Deliveries**:
  - `GET /api/deliveries` – List available and assigned deliveries.
  - `PATCH /api/deliveries/:id/accept` – Volunteer atomic claim.
  - `PATCH /api/deliveries/:id/status` – Progression (`PICKED_UP`, `IN_TRANSIT`, `DELIVERED`).
- **Feedback & Ratings**:
  - `POST /api/feedback` – Submit multi-criteria star rating and comments.
  - `GET /api/feedback` – Query feedback by request, listing, or volunteer.
- **AI Intelligence**:
  - `POST /api/ai/match` – Distance & capacity compatibility score with Gemini rationale.
  - `POST /api/ai/generate-description` – Food description, storage guidance & allergen warnings.
  - `GET /api/ai/insights` – Local redistribution trends and urgent deadline alerts.
- **Admin & Moderation**:
  - `GET /api/admin/organizations` – Review all registered entities.
  - `PATCH /api/admin/organizations/:id/verify` – Approve or reject NGO verification.
  - `GET /api/admin/audit-logs` – Tamper-evident admin activity trail.
- **Media Uploads**:
  - `POST /api/upload` – Multipart image upload with mimetype and size validation.

---

## 🔒 Security & Food Safety Notice

1. **Role-Based Access Control (RBAC)**: All sensitive endpoints enforce JWT Bearer tokens and verify account status (`ACTIVE` vs `SUSPENDED`).
2. **Food Safety Disclaimer**: FoodBridge AI is a coordination platform. Food donors are required to confirm compliance with basic food hygiene, safe thermal holding (>65°C hot, <4°C cold), and transparent allergen labeling.
3. **No Secret Leaks**: Gemini API keys and Supabase service keys are handled exclusively on the backend server.

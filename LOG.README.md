# HostIn Project Log

This file tracks what was requested, what decisions were made, what changed, and what was verified during the project. Keep appending new work here as the product evolves.

## 2026-06-26

### Backend Review

**Request**
- Read the server/backend and summarize what features exist.

**Findings**
- Backend is an Express + TypeScript + Prisma/PostgreSQL API.
- Product is a multi-tenant PG/hostel management SaaS.
- Existing modules include auth, organizations, roles, rooms, floors, tenants, gate passes, visitors, dues, payments, complaints, announcements, mess, documents, staff contacts, notifications, parents, audit logs, metrics, platform admin, plans, organizations, and feature toggles.

### Frontend Page Planning

**Request**
- List all frontend pages needed according to backend.
- Then list them in simplest connected flow.

**Output**
- Defined role-based app areas for owner, warden, guard/security, tenant, parent, and platform admin.
- Main flow established:
  - Login -> Dashboard -> Module -> List page -> Detail/action page.

### Initial Frontend Prototype

**Request**
- Build UI using provided reference style, but not the content.
- Connect pages visually to backend routes and database intent.

**Changes**
- Created first clickable frontend prototype in `client/app/page.tsx`.
- Added styling in `client/app/globals.css`.
- Included module flow, page connections, API route mapping, and Prisma model mapping.

**Issue / Correction**
- User clarified this should not look like a dev planning app.
- Reworked frontend into a real product-style SaaS interface instead of visible backend route documentation.

### Product UI Shell

**Request**
- Make it look like a full deployed usable product.

**Changes**
- Replaced developer route-map UI with a production-style app shell.
- Added login panel, role switcher, dashboard metrics, module sidebar, lists, forms, workflows, and sync actions.
- Removed visible dev terms like "Server routes", "Prisma", and "Database query area".

**Verification**
- `client npm run build` passed.
- Browser verified dashboard and tenants page render.

### Environment Examples

**Request**
- Create env examples for both client and server.

**Changes**
- Added `client/.env.example` with:
  - `NEXT_PUBLIC_API_URL=http://localhost:5001/api`
- Added `server/.env.example` with:
  - `NODE_ENV`
  - `PORT`
  - `DATABASE_URL`
  - `JWT_SECRET`
- Updated `client/.gitignore` to allow committing `.env.example`.

### Multi-Tenant Routing

**Request**
- App should not show dashboard before login.
- Customers should access their own app by workspace slug and role path, e.g. `/city-complex/owner`.
- Public landing page should help create workspace, generated emails, password, and role slugs.
- Platform panel should track subscriptions, cancellations, and updates.

**Decisions**
- Keep `/` as public landing/onboarding only.
- Use `/{workspaceSlug}/{role}` as private customer app route.
- Use `/platform/admin` conceptually for internal platform admin.
- Backend already has `Organization.slug`, which is the correct tenant anchor.

**Changes**
- Rebuilt `/` as public onboarding/landing page.
- Added dynamic route `client/app/[workspace]/[role]/page.tsx`.
- Added protected workspace UI in `client/app/components/workspace-app.tsx`.
- Before login, only role portal login is shown.
- After login, frontend checks backend login response for matching `orgSlug` and `role`.
- Mapped `/security` UI role to backend `guard` role.

**Verification**
- `client npm run build` passed.
- Verified `/` shows public onboarding only.
- Verified `/city-complex/owner` shows login gate only before auth.

### Demo Seed Setup

**Request**
- Create/update Prisma seed for appropriate demo testing.

**Changes**
- Expanded `server/prisma/seed.ts`.
- Seed now creates:
  - Plans
  - Platform admin
  - Demo organization `city-complex`
  - Demo users for owner, warden, security, staff, tenant, second tenant, and parent
  - User-role mappings
  - Org features
  - Floors and rooms
  - Tenant profiles
  - Parent profile
  - Room history
  - Dues and payment
  - Gate pass
  - Visitor
  - Complaint and complaint update
  - Announcement
  - Mess menu and item
  - Document
  - Staff contacts
  - Due reminder config
  - Notification
  - Audit log
  - Platform metrics

**Demo Credentials**
- Workspace slug: `city-complex`
- Password: `city-complex@123`
- Owner: `owner@city-complex.hostin.local`
- Warden: `warden@city-complex.hostin.local`
- Security: `security@city-complex.hostin.local`
- Tenant: `tenant@city-complex.hostin.local`
- Parent: `parent@city-complex.hostin.local`
- Platform: `admin@1forge.com` / `PlatformAdminPassword123`

**Verification**
- `server npm run build` passed.

### Rooms Board For Owner/Warden

**Request**
- Work on owner/warden Rooms section.
- Show rooms visually like theatre seat booking.
- Show floors, room numbers, capacities, full/partial/empty states.
- Hover should show tenant names.
- Tenant icons should link to student detail page.
- Warden/owner should add or remove student from room through UI and update DB.
- Room grid should be generated from client setup/property data.

**Backend Changes**
- Updated `GET /api/rooms` list handler to include active occupants.
- Added `POST /api/rooms/:roomId/assign-tenant`.
- Added `POST /api/rooms/:roomId/tenants/:tenantProfileId/remove`.
- Registered assign/remove routes in `server/src/index.ts`.

**Frontend Changes**
- Added `RoomsBoard` inside `client/app/components/workspace-app.tsx`.
- Added visual room stats.
- Added floor-wise room grid.
- Added room states:
  - Full
  - Partial
  - Empty
  - Maintenance
- Added occupant icons in each room tile.
- Added hover tooltip with occupant names.
- Added selected-room side panel with:
  - Occupants
  - View profile links
  - Remove tenant action
  - Room type
  - Capacity
  - Monthly rent
  - Assign tenant action
- Added room board styling in `client/app/globals.css`.

**Verification**
- `server npm run build` passed.
- `client npm run build` passed.

### Rooms Board Interaction Fixes

**Request**
- Clicking a room should show panel on right.
- Clicking the same room should unselect it and panel should disappear cleanly.
- Highlight selected room better.
- Search should work by tenant name too.
- Remove visible "Room board synced with database" message and keep it in logs.

**Changes**
- Room side panel now appears only when a room is selected.
- Clicking selected room again unselects it.
- When no room is selected, grid expands without empty side panel.
- Selected room highlight is stronger with accent border, glow, and lift.
- Search now matches room number and occupant/student names.
- Removed visible room-board sync message.
- Moved room-board status messages to `console.info`.

**Verification**
- `client npm run build` passed.

### Rooms Board Smooth State And Loading

**Request**
- Selecting/deselecting a room should not make the layout jump.
- The right action panel should feel smooth and stable.
- Remove wrong hardcoded demo room data.
- Use a component sketch/skeleton loading state instead of fake room data.
- Improve skeleton loading beyond generic gray shimmer to provide better UI/UX.

**Changes**
- Removed hardcoded demo room data from the room board.
- Room board now starts empty and loads real backend room/tenant data.
- Added skeleton loading cards for room stats and room grid.
- Added clean empty/error state when backend data is unavailable or no rooms exist.
- Kept the right action rail mounted at a stable width so selecting/deselecting does not resize the board.
- Added a soft placeholder state in the right panel when no room is selected.
- Added transitions for selected room highlight and action panel visibility.
- Replaced blank skeleton blocks with structured room-board wireframes:
  - stat card label/value/icon placeholders
  - floor labels
  - room tile placeholders
  - bed-dot placeholders
  - right-side room action panel skeleton

**Verification**
- `client npm run build` passed.

### Landing Page Sections And Dashboard Theme Toggle

**Request**
- Add relevant public landing sections similar to Safcurl:
  - About
  - Pricing
  - Consultation
  - Careers
  - Contact
  - Get Started
- Add a dashboard colour toggle with smooth animation.
- Make the colour system global and easy to extend later.
- Add a 1Forge Studio-style violet theme option.

**Changes**
- Expanded `client/app/page.tsx` into a fuller public product landing page.
- Added public navigation for About, Pricing, Consultation, Careers, Contact, and Get Started.
- Added reusable theme configuration in `client/app/components/theme-system.tsx`.
- Added a dashboard theme toggle to the logged-in workspace top bar.
- Theme choice now persists in `localStorage`.
- Added CSS variable-driven colour tokens for accent colours, gradients, focus rings, hero styling, and shadows.
- Added the new `forge-violet` theme inspired by the 1Forge Studio violet/white visual style.

**Verification**
- `client npm run build` passed.
- `curl -I http://localhost:3000` returned `200 OK`.
- Next dev log showed `/city-complex/warden` rendering with `200`.

### Tenant, Visitor, Gate Pass, Community Permissions

**Request**
- Owner/warden should add and view tenants from Tenants section.
- Tenants page should not ask for tenant role and should not assign rooms.
- Rooms page should assign only real created/invited tenants.
- Tenants page should search by tenant name or room number and use skeleton loading.
- Fix saved violet theme flashing orange on re-render.
- Warden should only view/approve/reject gate passes, not request them.
- Warden should only view/filter visitors; visitor creation should be guard-only.
- Parent Portal should only be visible to parent role.
- Notifications should move from sidebar to a top navbar icon.
- Announcements and complaints should become one Community/Discussion page with a toggle for announcements, complaints, and lost/found.

**Changes**
- Added `POST /api/tenants` for owner/warden tenant account creation.
- Updated `GET /api/tenants` to include tenant-role users without room profiles, so created tenants can later be assigned from Rooms.
- Changed visitor creation API access to guard-only.
- Added early theme hydration script in `client/app/layout.tsx` to prevent orange flash when violet theme is saved.
- Reworked workspace module permissions:
  - Parent Portal is parent-only.
  - Notifications are removed from sidebar and represented by a topbar icon.
  - Separate Announcements and Complaints modules are replaced by Community.
- Added real Tenants section with create form, search, skeleton loading, list, and details panel.
- Added Gate Pass section with live listing and owner/warden approve/reject controls.
- Added Visitor section with live listing, visitor/date/day filters, and guard-only creation form.
- Added Community section with toggle between Announcements, Complaints, and Lost/Found.

**Verification**
- `client npm run build` passed.
- `server npm run build` passed.

## Ongoing Instruction

- Continue updating this log whenever the user requests a feature, design change, backend change, seed/data change, or bug fix.
- Each entry should include:
  - Request
  - Decision, if any
  - Changes made
  - Verification performed
# 2026-06-27 - Tenant, Finance, Community, Mess, and Contact Refinement

## Requested

- Make tenant selection toggleable and animate the details panel in and out.
- Move tenant creation into a dismissible popup opened from the Add tenant button.
- Close the popup using its close button, backdrop, Escape key, or browser back navigation.
- Color approved gate passes green, rejected red, and pending grey.
- Remove stale visitor viewing actions.
- Replace the generic dues page with paid/unpaid filters, amount sorting, tenant search, and useful totals.
- Generate fixed monthly rent dues automatically for active room assignments.
- Add persistent reactions and comments to community posts for all workspace roles.
- Replace the generic mess page with a seven-day, four-meal table editable by owner, warden, and staff/mess manager roles.
- Simplify staff contacts to name, role, and phone number.

## Implemented

- Reworked the Tenants directory into a full-width list with a stable animated details slot and click-again deselection.
- Added an accessible tenant creation modal with backdrop, close, Escape, and popstate dismissal behavior.
- Added semantic gate-pass and payment status colors and retained visitor records as view-only rows.
- Added a live Dues & Payments screen using `/api/dues`, including search, paid/not-paid filtering, amount sorting, and paid/outstanding summaries.
- Made `GET /api/dues` idempotently materialize the current month rent due from each active tenant's assigned room rent.
- Added `CommunityInteraction` persistence, migration, interaction endpoint, reaction toggling, comment creation, and feed counts/comments.
- Added a live weekly mess table using existing mess APIs and permitted staff/mess managers to maintain draft menus.
- Added a minimal live contact directory using the staff contacts API.
- Removed generic overview/workflow/action panels from Finance, Mess, and Staff Contacts.

## Verification

- Prisma schema formatted and client generated successfully.
- Server TypeScript production build passed.
- Client Next.js production build passed.
- Applied the community interaction migration successfully to the configured Neon PostgreSQL database.
# 2026-06-27 - Tenant Role Privacy and Workflows

## Requested

- Remove Rooms, Visitors, and Documents from the tenant navigation.
- Let tenants create gate passes, cancel only pending requests, and retain reviewed passes as immutable history.
- Give tenants private dues, detailed bill-style checkout, payment controls, and payment history.
- Restrict tenants to reacting/commenting on announcements while allowing them to publish lost/found posts with images and captions.
- Add calendar dates to the weekly mess table.
- Turn the notification icon into a usable dropdown with a themed hover ring.

## Implemented

- Removed cross-tenant room visibility and tenant access to visitor records and document navigation.
- Added a tenant gate-pass request form, pending queue, server-enforced pending cancellation endpoint, and permanent status history.
- Added a tenant-only billing experience with itemized dues, outstanding totals, payment-method checkout, and private payment history.
- Added persisted lost/found posts with caption and image attachment support plus a dedicated migration and API.
- Kept tenant reactions/comments on announcements only; lost/found publishing is separate.
- Added a date column derived from the selected mess-menu week.
- Added a live notification popover with unread count, outside-click dismissal, mark-as-read behavior, and theme-colored focus/hover ring.
- Applied the lost/found PostgreSQL migration to the configured Neon database.

## Verification

- Prisma formatting and client generation passed.
- Server TypeScript production build passed.
- Client Next.js production build passed.
# 2026-06-27 - Guard Workspace and Custom Theme Colour

## Requested

- Remove Rooms and Community from the security/guard workspace.
- Allow security/guards to approve and reject pending gate passes.
- Move visitor creation from the page into a popup form.
- Remove visitor approval/status indications from every visitor-record view.
- Add a custom colour picker to the global dashboard theme control.

## Implemented

- Removed Rooms and Community from both guard and security navigation.
- Enabled owner, warden, and guard gate-pass moderation while preserving tenant-only request creation.
- Rebuilt Add Visitor as a dismissible modal with close, backdrop, and Escape behavior.
- Removed visitor status pills and approval/rejection implications from visitor records.
- Allowed guards to fetch only the minimal tenant name/id/room data required for visitor registration.
- Added a persistent Custom theme mode that derives the full accent palette from a colour input.
- Added pre-hydration custom-theme restoration and smooth transitions across shared themed surfaces.

## Verification

- Client and server production builds passed.
- Security demo login shows only Gate Passes, Visitors, and Staff Contacts.
- Gate Passes exposes Approve / Reject moderation for security.
- Visitor records render without approval/status indicators and expose the Add Visitor modal trigger.
- The theme control renders Coral, Studio, and the persistent custom colour picker.

### UI Follow-up

- Expanded the three-option colour control and constrained the native picker so global input styles cannot distort it.
- Increased the visitor modal width, padding, field height, and spacing.
- Reorganized visitor details into labelled two-column groups with full-width host and purpose rows.
- Added a single-column responsive visitor form for mobile screens.
- Fixed custom colour selection by removing the invalid interactive input-inside-button nesting and applying theme updates during both live input and committed changes.
- Stabilized the custom picker UI by hiding the browser-rendered native swatch and using a controlled circular swatch inside the segmented control.
- Removed the duplicate custom-colour dot by fully clipping the native input while retaining the single controlled picker swatch.
- Removed the stale View and filter badge from Visitor records.
# 2026-06-27 - Unified Login and 1Forge Platform Operations

## Requested

- Replace role-portal selection with one email/password entry point.
- Route every issued account directly to its property, role, and personal profile.
- Keep account creation under the 1Forge team rather than public self-service.
- Add a separate authenticated 1Forge portal for clients, subscriptions, billing, role totals, and feature control.
- Enforce subscription suspension across customer APIs.

## Implemented

- Added `account_slug` and `is_primary` membership fields with a deployed database migration.
- Added unified `POST /api/auth/resolve-login` for both property accounts and isolated platform accounts.
- Added deterministic destinations such as `/{workspace}/{role}/{accountSlug}` and `/1forge/platform`.
- Added `/login`, session handoff, authenticated route hydration, logout cleanup, and profile-specific workspace routing.
- Updated landing-page Get Started and platform links to use the common login entry.
- Added central inactive/paused/cancelled/expired subscription enforcement in organization authorization middleware.
- Added a platform-only account issuance endpoint for role email, password, and profile-slug creation.
- Expanded platform organization data with account counts, role breakdowns, features, occupancy, and monthly plan pricing.
- Added the first 1Forge dashboard for client selection, suspension/restoration, plan/status/expiry/capacity management, role counts, and feature toggles.
- Added platform audit logs for account creation, subscription updates, and feature changes.
- Added backend feature enforcement using plan defaults and per-client overrides across module APIs.
- Normalized legacy feature aliases so the 1Forge dashboard presents one authoritative switch per capability.
- Updated tenant account creation and demo seed definitions to issue account slugs.

## Verification

- Account-routing migration applied successfully to the configured Neon database.
- Prisma client generation and server TypeScript build passed.
- Client Next.js build passed with `/login` and profile-specific routes.
- Verified tenant auto-routing to `/city-complex/tenant/aarav-mehta` and platform auto-routing to `/1forge/platform` in the browser.
- Demo seed refresh was attempted but Neon became temporarily unreachable after migration; first login safely backfills missing account slugs.
# 2026-06-27 - Pre-push Protection, Testing, and Docker Setup

## Requested

- Add production-minded application protection and checks before repository pushes.
- Add quick Docker-based first-time setup for client, server, and PostgreSQL.
- Integrate automated validation, tests, CI, security scanning, and contributor tooling.

## Implemented

- Added root npm orchestration, Make targets, environment template, Docker ignore rules, and contributor documentation.
- Added development and production Docker stages for Next.js and Express plus Compose services for PostgreSQL, API, and client.
- Added automatic local migrations, opt-in seeding, persistent volumes, readiness-gated dependencies, and service health checks.
- Added strict Zod environment validation and removed insecure JWT fallbacks.
- Added Helmet, strict CORS, general/API login rate limits, Pino structured logs with secret redaction, and liveness/readiness endpoints.
- Disabled public signup routing because account issuance belongs to the 1Forge platform workflow.
- Added Zod validation for unified login and platform account issuance.
- Added HTTP-only refresh cookies, refresh-token rotation, and server-side logout invalidation.
- Added server ESLint, client lint baseline, typecheck scripts, Vitest, Supertest, Testing Library, and Playwright.
- Added API protection and database authorization tests, theme control tests, and desktop/mobile unified-login E2E tests.
- Added Husky, lint-staged, Commitlint, Prettier configuration, GitHub Actions with PostgreSQL, Docker build validation, CodeQL, Dependabot, and Playwright failure artifacts.
- Added starter OpenAPI documentation and production/development guidance.
- Fixed legacy lint findings and isolated test sources from clean production server builds.
- Added Next development-origin configuration required for deterministic Playwright hydration.
- Prevented platform users from calling organization notification APIs.
- Added package-scoped staged-file lint commands so Git hooks use each app's compatible ESLint version and configuration.

## Verification

- `npm run check` passes: lint, typecheck, unit/API tests, and production builds.
- Database-backed authorization suite passes all five tests.
- Playwright passes four tests across desktop Chromium and Pixel 7 profiles.
- Client and server staged-file lint commands pass from the repository root.
- Prisma schema validation passes.
- Root and server dependency audits report zero vulnerabilities.
- Client audit reports two moderate transitive PostCSS advisories; the automated force-fix incorrectly proposes Next 9 and was intentionally not applied.
- `docker compose config` passes.
- Docker image execution could not be tested locally because Docker Desktop is not running; CI builds both production images.

# 2026-06-27 - Make Workflow and Repository Hygiene

## Requested

- Briefly document what every Make command does and when contributors should use it.
- Fix the Docker build and migration errors found while exercising the Make workflow.
- Keep local secrets, generated output, test artifacts, and machine files out of GitHub.

## Implemented

- Added a self-documenting `make help` target and short comments above every Make target.
- Made `make setup` preserve an existing `.env` instead of overwriting local configuration.
- Made migration and seed commands work even when the API container is not already running.
- Moved the default host PostgreSQL binding to port `5433` to avoid common conflicts with a locally installed database.
- Made database reset restart the stack in the background.
- Synchronized the server lockfile so Docker's reproducible `npm ci` installation can complete.
- Added a non-secret build-time database placeholder required for offline Prisma client generation.
- Expanded root ignore rules for environment secrets, keys, dependencies, build output, test reports, logs, local databases, editor metadata, caches, and Docker overrides.
- Removed previously tracked macOS and Prisma validation artifacts.

## Verification

- `make help` lists every command with its intended use.
- `make build` successfully builds both server and client Docker images.
- `make migrate` starts PostgreSQL without a running API container and applies all five migrations.
- `make setup` starts healthy PostgreSQL, server, and client containers.
- Docker-hosted API health and frontend login endpoints both return HTTP 200.
- Ignore-rule samples and `git diff --check` pass.

# 2026-06-29 - 1Forge Control Center Restructure

## Requested

- Reduce the amount of client data shown on the main 1Forge platform page.
- Add compact client cards that open a dedicated client control page.
- Manage role apps, client features, and one client-wide theme colour from the control center.
- Add a separate financial analytics page with monthly and per-client revenue views.
- Use the supplied dashboard references for information architecture only and retain HostIn's current visual system.

## Implemented

- Replaced the overloaded platform view with a compact `/1forge/platform` dashboard containing portfolio KPIs, client search, status filters, and summary cards.
- Added routed client controls at `/1forge/platform/{client-slug}` with Overview, Apps & Roles, Features, Theme & Branding, and Billing tabs.
- Added `/1forge/platform/analytics` with MRR, annual run rate, average client revenue, revenue trend, per-client contribution, and a subscription ledger.
- Added persistent organization theme colours and propagated the saved colour through workspace login sessions to all client role apps.
- Added platform navigation for Dashboard, Clients, and Analytics while preserving existing HostIn colours, spacing, panels, and theme controls.
- Added responsive layouts for compact desktop, tablet, and mobile widths.

## Verification

- Prisma formatting and client generation passed.
- Organization theme migration applied successfully to the configured PostgreSQL database.
- Client lint, typecheck, and production build passed.
- Server lint, typecheck, production build, and API tests passed.
- Browser-verified the dashboard, client overview, branding controls, analytics page, and a 390px mobile layout without horizontal overflow.

# 2026-06-29 - Control Center Test Coverage Refresh

## Requested

- Update the existing tests for the redesigned 1Forge interface.
- Add coverage for the new dashboard, client controls, branding, billing, and analytics experiences.

## Implemented

- Updated the platform E2E journey to follow the new Dashboard → Client Control → Billing structure.
- Added desktop and mobile assertions for client search, status filtering, all client-control tabs, role apps, features, client-wide branding, financial analytics, and the subscription ledger.
- Added a responsive overflow assertion and fixed the mobile analytics ledger so wide tabular content scrolls inside its panel instead of widening the page.
- Added a unit test for pre-hydration custom theme restoration through `instrumentation-client.ts`.
- Extended database-backed API assertions to cover organization theme colours and location data used by the new control center.
- Removed the React client-render script warning by moving theme restoration out of the layout component.

## Verification

- Client unit tests, lint, and typecheck passed.
- Server API tests, lint, and typecheck passed.
- Expanded Playwright coverage passed on desktop Chromium and Pixel 7 mobile profiles.

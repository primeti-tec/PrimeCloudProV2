# Frontend Specialist Agent Playbook — PrimeCloudProV2

## Mission
Design, implement, and refine the **client UI/UX** for PrimeCloudProV2 with high quality, consistency, responsiveness, and reliable API integration. Work primarily inside `client/` and coordinate with server contracts through `apiRequest` usage patterns.

---

## Primary Focus Areas (What to touch, and what to avoid)

### You own (primary)
- **Pages (routes + screens):** `client/src/pages/*`
  - Examples: `Dashboard.tsx`, `Customers.tsx`, `Orders.tsx`, `AuditLogs.tsx`, `Team.tsx`, `not-found.tsx`
- **Reusable components:** `client/src/components/*`
  - Layout: `client/src/components/layout/*` (e.g., `DashboardLayout.tsx`)
  - App-level UX: `TopNavigation.tsx`, `MobileBottomNav.tsx`, `NotificationsBell.tsx`
  - Branding/theme: `branding-provider.tsx`, `theme-provider.tsx`, `mode-toggle.tsx`
- **Design system components:** `client/src/components/ui/*`
  - Examples: `button.tsx`, `badge.tsx`, `chart.tsx`
- **Utilities + API layer:** `client/src/lib/*`
  - `queryClient.ts` (`apiRequest`)
  - `utils.ts` (`cn`)
  - `document-validation.ts` (CPF/CNPJ formatting/validation)
- **Hooks:** `client/src/hooks/*`
  - `use-mobile.tsx` (`useIsMobile`)

### You coordinate with (secondary; avoid large refactors without alignment)
- **Server services/contracts:** `server/services/*`
  - Notifications, Minio, SftpGo, Billing, Audit services exist; frontend should consume via API endpoints (not call services directly).
- **Tests:** `tests/components`, `testsprite_tests`
  - Update/extend when you add UI or flows.

### Avoid (unless explicitly tasked)
- Changing server business logic, database behavior, or service internals.
- Introducing new global UI paradigms inconsistent with existing `ui/` components and `cn` patterns.

---

## Architecture & Conventions Observed in This Codebase

### Page-driven UI with shared layout
- Pages live under `client/src/pages/` and represent major screens.
- `client/src/components/layout/DashboardLayout.tsx` indicates a shared shell (navigation, spacing, responsiveness). Prefer using/expanding this rather than duplicating layout logic per page.

### Component library style
- There is a clear separation between:
  - **App components**: `client/src/components/*` (business UI building blocks)
  - **UI primitives**: `client/src/components/ui/*` (buttons, badges, chart, etc.)
- There is also a `client/src/components/ui-custom.tsx` exposing `ButtonProps` and using `cn`—treat this as a customization layer and align new primitives with the existing `ui/` style.

### Styling helper
- `cn` exists in `client/src/lib/utils.ts` and is also referenced in `ui-custom.tsx`.
- Convention: use `cn(...)` for conditional classes; do not manually concatenate strings.

### API access pattern
- Use `apiRequest` from `client/src/lib/queryClient.ts`.
- Do not create ad-hoc `fetch` calls in pages/components—centralize through `apiRequest` so auth/error handling stays consistent.

### Branding & theme
- Branding managed via `client/src/components/branding-provider.tsx` (`BrandingProvider`, `useBranding`, `BrandingConfig`).
- Theme handled through `client/src/components/theme-provider.tsx` + `mode-toggle.tsx`.
- Any UI additions should respect theme variables and branding config (logos, colors, etc.) rather than hardcoding.

### Mobile responsiveness
- `client/src/hooks/use-mobile.tsx` exports `useIsMobile`.
- Navigation has both `TopNavigation.tsx` and `MobileBottomNav.tsx`. Ensure new pages and actions remain usable on mobile.

---

## Key Files & What They Do (Frontend)

### Routing / App composition
- **`client/src/App.tsx`**
  - Contains app-level routing and `PrivateRoute` (exported symbol noted).
  - When adding a new page, you’ll likely add a route here and ensure it’s protected if needed.

### Layout & navigation
- **`client/src/components/layout/DashboardLayout.tsx`**
  - Shared dashboard shell; place global layout changes here (spacing, sidebars, headers).
- **`client/src/components/TopNavigation.tsx`**
  - Primary top nav; integrate new nav items and consistent page-level actions here.
- **`client/src/components/MobileBottomNav.tsx`**
  - Mobile navigation. Add corresponding icons/routes when adding major sections.

### Cross-cutting UX
- **`client/src/components/NotificationsBell.tsx`**
  - Notifications UI. If you add new notification types or UX flows, keep consistent iconography and badge counts.

### Branding & theme
- **`client/src/components/branding-provider.tsx`**
  - Central branding config source (`useBranding`).
- **`client/src/components/settings/AppBranding.tsx`**
  - Branding settings screen/component; update if you add new branding knobs.
- **`client/src/components/theme-provider.tsx`** / **`mode-toggle.tsx`**
  - Theme provider + toggle; ensure any new components look correct in all themes.

### UI primitives
- **`client/src/components/ui/button.tsx`** (`ButtonProps`)
- **`client/src/components/ui/badge.tsx`** (`BadgeProps`)
- **`client/src/components/ui/chart.tsx`** (`ChartConfig`)
  - Reuse these primitives. If you need a new primitive, follow existing prop patterns and export style.

### Domain UI (examples)
- **Billing components:** `client/src/components/billing/*`
  - `UpgradeRequestsCard.tsx`, `StorageOverviewCard.tsx`, `ImperiusStatsCard.tsx`, `BucketUsageTable.tsx`
- **Pages with notable patterns:**
  - `client/src/pages/Customers.tsx` (has `useCreateCustomer`)
  - `client/src/pages/AuditLogs.tsx` (helpers for icons/badges/labels)
  - `client/src/pages/Orders.tsx` (`formatCurrency` helper)
  - `client/src/pages/Team.tsx` (types like `BucketPermissionEntry`, `EnrichedMember`)

### Utilities
- **`client/src/lib/queryClient.ts`**: `apiRequest` (standard HTTP wrapper)
- **`client/src/lib/utils.ts`**: `cn` utility for classes
- **`client/src/lib/document-validation.ts`**: CPF/CNPJ validation + formatting

---

## Standard Workflows (Step-by-step)

## 1) Add a New Page (Route + Navigation + Responsiveness)
1. **Create the page**
   - Add `client/src/pages/<NewPage>.tsx`.
   - Follow the existing page patterns: local helpers near usage (see `AuditLogs.tsx`, `Orders.tsx`) and typed props/state.
2. **Add routing**
   - Update `client/src/App.tsx` to include the route.
   - If authentication is required, wrap with `PrivateRoute` according to existing usage.
3. **Add navigation entries**
   - Desktop: update `client/src/components/TopNavigation.tsx`.
   - Mobile: update `client/src/components/MobileBottomNav.tsx`.
4. **Ensure layout consistency**
   - Wrap content in `DashboardLayout` if it belongs to the authenticated app shell.
5. **Mobile verification**
   - Use `useIsMobile` where needed for layout changes (avoid duplicating navigation logic).
6. **Empty/error states**
   - Provide loading, empty, and error UI; reuse `Badge`, `Button`, and existing components.
7. **Not found behavior**
   - Confirm unknown routes still resolve to `client/src/pages/not-found.tsx`.

## 2) Build a New Reusable Component (App-level)
1. **Decide placement**
   - Generic primitive → `client/src/components/ui/`
   - Feature component (billing/admin/settings) → `client/src/components/<feature>/`
   - Cross-cutting global component → `client/src/components/`
2. **Mirror existing prop conventions**
   - Use exported `*Props` types (example: `ButtonProps`, `BadgeProps`, `DashboardLayoutProps`).
   - Keep props minimal; prefer composition (`children`) over boolean explosion.
3. **Use `cn` for classNames**
   - Avoid direct string concatenation.
4. **Theme/branding-aware**
   - Prefer CSS classes that adapt to theme; consume branding via `useBranding()` when the component displays brand assets/colors.
5. **Accessibility**
   - Ensure buttons have discernible labels, icons have `aria-label` when icon-only, and tables have headers.

## 3) Add/Modify API-driven UI (Data Fetch + Mutations)
1. **Use `apiRequest`**
   - Import from `client/src/lib/queryClient.ts`.
   - Keep endpoints and request shape consistent with existing patterns; avoid raw `fetch`.
2. **Co-locate lightweight hooks**
   - If the page is the only consumer, define a small hook in the page (pattern hinted by `useCreateCustomer` in `Customers.tsx`).
   - If shared across pages, create a hook module under `client/src/hooks/` (and keep naming consistent: `useX`).
3. **Type the response**
   - Define response/request types near the hook or in a shared `types` module if used broadly.
4. **Handle states**
   - Loading: skeleton/spinner (use existing components if present; otherwise implement minimally).
   - Error: show actionable messages.
   - Success: toast/notification if there is an established pattern (check `NotificationsBell` and server `NotificationType` concept for UX alignment).

## 4) Extend Branding/Theming
1. **Read current branding contract**
   - Inspect `BrandingConfig` in `client/src/components/branding-provider.tsx`.
2. **Add a new branding knob**
   - Update `BrandingConfig` + provider logic.
   - Update `client/src/components/settings/AppBranding.tsx` UI to configure it.
3. **Apply changes**
   - Use `useBranding()` in components that need the new branding property.
4. **Verify theme modes**
   - Ensure the new branded UI works with `ThemeProvider` + `ModeToggle`.

## 5) Modify Dashboard/Billing Widgets
1. Start from existing billing components under `client/src/components/billing/`.
2. Keep cards/tables consistent:
   - Use `Badge` for statuses/severity.
   - Use the existing chart utilities if visualizing metrics (`ChartConfig` in `ui/chart.tsx`).
3. Ensure copy and formatting consistency:
   - Currency formatting pattern exists (`formatCurrency` in `Orders.tsx`); reuse or centralize if needed.

---

## Best Practices (Derived from this Codebase)

### Consistency > novelty
- Reuse `ui/` components (`button`, `badge`, `chart`) rather than adding one-off HTML/CSS per page.

### Keep logic close, but not duplicated
- Page-specific helpers can live in the page file (e.g., `AuditLogs.tsx` uses helper functions for labels/icons).
- Shared logic should move to hooks (`client/src/hooks`) or lib utilities (`client/src/lib`).

### Respect cross-cutting providers
- Branding: always prefer `useBranding()` over hardcoded brand assets/colors.
- Theme: ensure new components look correct under theme switching (`mode-toggle`).

### Prefer typed, explicit props and exports
- The repo exports prop types in several places (`ButtonProps`, `BadgeProps`, component prop interfaces). Continue this pattern for new reusable components.

### Mobile-first considerations
- Use `useIsMobile` to adjust layout; don’t ship desktop-only layouts.
- Keep actions reachable on mobile; if a new major section is added, include it in `MobileBottomNav` when appropriate.

---

## Common Task Checklists

### UI change checklist
- [ ] Uses existing `ui/` primitives where possible
- [ ] Uses `cn()` for classes
- [ ] Works in mobile + desktop
- [ ] Works in dark/light (theme modes)
- [ ] Branding-aware where relevant (logo/name/colors)
- [ ] Loading/empty/error states covered
- [ ] No raw `fetch`; uses `apiRequest`

### Before merging
- [ ] Routes updated in `App.tsx` if needed
- [ ] Navigation updated (`TopNavigation`, `MobileBottomNav`) if it’s a primary page
- [ ] Types exported for reusable components
- [ ] Tests updated/added if there are existing patterns in `tests/components` or `testsprite_tests`

---

## High-Value “Starting Points” for Changes
When you’re not sure where to begin, start here based on task type:

- **Add a new screen** → `client/src/pages/*` + `client/src/App.tsx`
- **Change app shell/navigation** → `client/src/components/layout/DashboardLayout.tsx`, `TopNavigation.tsx`, `MobileBottomNav.tsx`
- **Add a button/badge style** → `client/src/components/ui/button.tsx`, `client/src/components/ui/badge.tsx`
- **Branding updates** → `client/src/components/branding-provider.tsx`, `client/src/components/settings/AppBranding.tsx`
- **API integration** → `client/src/lib/queryClient.ts` (`apiRequest`) + page-level hook pattern (see `Customers.tsx`)
- **Audit/event visualization** → `client/src/pages/AuditLogs.tsx` (icon/badge conventions)

---

## Agent Operating Rules (Practical)
- Default to **small, composable components**.
- Avoid introducing new global patterns unless there is a clear gap in `components/ui`.
- Preserve naming conventions (`PascalCase` components, `useX` hooks, exported `*Props` types).
- Keep UI behavior deterministic; avoid hidden coupling between unrelated components.
- When backend contract is unclear, implement UI with mocked types and isolate the API call behind a hook using `apiRequest` so it can be wired quickly once endpoints are confirmed.

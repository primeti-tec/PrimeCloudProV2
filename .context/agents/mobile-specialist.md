# Mobile Specialist Agent Playbook (PrimeCloudProV2)

## Mission & Scope

This codebase appears to be a web application with a mobile-first/responsive layer rather than a native iOS/Android app. Your mandate is to ensure the **mobile experience** is first-class:

- Responsive layouts and navigation (bottom nav, top nav, dashboard layout)
- Touch ergonomics, safe tap targets, scroll behavior
- Mobile performance (bundle/paint, conditional rendering, virtualization)
- Mobile-specific UI states (drawers, sheets, dialogs)
- Consistent theming/branding across mobile and desktop
- Mobile-friendly forms and validation for Brazilian documents (CPF/CNPJ)
- Integration correctness with the existing API/query layer

You should **not** create parallel UI patterns; instead, extend/adjust existing patterns in `client/src/components` and `client/src/pages`.

---

## Key Areas to Focus On (by directory)

### 1) Mobile UX foundation
- **`client/src/hooks/use-mobile.tsx`**
  - Central hook for mobile detection (`useIsMobile`).
  - Use this instead of bespoke `window.innerWidth` logic.

- **`client/src/components/MobileBottomNav.tsx`**
  - Mobile primary navigation surface.
  - Keep it aligned with routing and page IA (information architecture).

- **`client/src/components/TopNavigation.tsx`**
  - Desktop/tablet navigation; ensure it degrades gracefully on mobile.

- **`client/src/components/layout/DashboardLayout.tsx`**
  - Likely the layout orchestrating sidebars/top bars and content.
  - Mobile: collapse sidebars, reduce padding, avoid fixed-height traps.

### 2) Pages to validate mobile UX end-to-end
These pages are key for verifying layout, tables/cards, and interaction density:
- **`client/src/pages/Dashboard.tsx`**
- **`client/src/pages/Orders.tsx`**
- **`client/src/pages/Customers.tsx`**
- **`client/src/pages/Team.tsx`**
- **`client/src/pages/AuditLogs.tsx`**
- **`client/src/pages/not-found.tsx`**

### 3) Component system (UI primitives & patterns)
- **`client/src/components/ui/*`**
  - Shared UI primitives (e.g., `button`, `badge`, `chart`).
  - Mobile work should prefer extending primitives rather than one-off styling.

- **`client/src/components/ui-custom.tsx`**
  - Custom utility/components used across the app; includes a `ButtonProps` export.
  - Ensure there isn’t duplication/conflict with `client/src/components/ui/button.tsx` (also exports `ButtonProps`). Prefer consistent imports within a feature.

### 4) Branding & theme (mobile consistency)
- **`client/src/components/theme-provider.tsx`**, **`mode-toggle.tsx`**
- **`client/src/components/branding-provider.tsx`**
- **`client/src/components/settings/AppBranding.tsx`**
  - Verify brand colors/typography remain accessible on small screens and in dark mode.

### 5) Notifications (mobile affordances)
- **`client/src/components/NotificationsBell.tsx`**
  - Check touch target size, popover placement, and scroll within popovers on mobile.

### 6) Client API/data layer touchpoints
- **`client/src/lib/queryClient.ts`** (`apiRequest`)
  - Ensure mobile interactions don’t cause request storms (debounce, pagination, caching patterns).

### 7) Server services awareness (for mobile-driven features)
While you’ll mostly work in `client/`, know the service layer exists:
- `server/services/*` including `NotificationService`, `MinioService`, `SftpGoService`, etc.
- If a mobile UX change implies new data shape or endpoint behavior, coordinate changes through these services (and keep API contracts stable).

---

## Key Files & What They’re For (mobile perspective)

- `client/src/hooks/use-mobile.tsx`  
  Mobile detection hook (`useIsMobile`). Use it for breakpoints and conditional rendering.

- `client/src/components/MobileBottomNav.tsx`  
  Mobile navigation component. Must reflect app routes and active state correctly.

- `client/src/components/layout/DashboardLayout.tsx`  
  Layout wrapper; ensure it handles small screens: padding, stacking, nav placement.

- `client/src/components/TopNavigation.tsx`  
  Primary top nav; verify it doesn’t overcrowd on mobile.

- `client/src/components/theme-provider.tsx` + `client/src/components/mode-toggle.tsx`  
  Theme management. Mobile requires strong contrast and correct OS-level dark mode behavior.

- `client/src/components/branding-provider.tsx` + `client/src/components/settings/AppBranding.tsx`  
  Branding configuration. Ensure mobile UI respects the branding config consistently.

- `client/src/components/ui/button.tsx`, `client/src/components/ui/badge.tsx`, `client/src/components/ui/chart.tsx`  
  UI primitives. Mobile-friendly sizing and responsiveness should be solved here when possible.

- `client/src/pages/*` (Dashboard, Orders, Customers, Team, AuditLogs)  
  Mobile validation surface area: density, tables, filtering, pagination, and actions.

- `client/src/App.tsx` (`PrivateRoute`)  
  Route gating; mobile nav must not route into inaccessible areas or produce loops.

---

## Workflows (step-by-step) for Common Mobile Tasks

### Workflow A — Add/Adjust Mobile Navigation (Bottom Nav)
**When:** New primary section/page is introduced or navigation needs better mobile usability.

1. **Confirm route + access rules**
   - Check `client/src/App.tsx` for route definitions and `PrivateRoute` usage.
2. **Update mobile IA**
   - Modify `client/src/components/MobileBottomNav.tsx` to add/remove nav items.
   - Ensure:
     - Active state matches current route
     - Tap targets are large enough (avoid tiny icons)
     - Labels are concise for small screens
3. **Ensure layout supports it**
   - Verify `client/src/components/layout/DashboardLayout.tsx` leaves room for bottom nav (no content hidden behind fixed nav).
4. **Validate on key pages**
   - Dashboard, Orders, Customers: ensure scroll + nav do not conflict.
5. **Regression checks**
   - Desktop navigation unchanged (`TopNavigation.tsx`).
   - Not-found and auth-gated routes behave correctly.

**Best practice:** Prefer a single source of truth for nav items (shared config) if you notice duplication between top and bottom nav—only refactor if it’s clearly beneficial and safe.

---

### Workflow B — Make a Page Mobile-Friendly (Layouts, Tables, Dense Content)
**When:** A page has horizontal overflow, tiny controls, or desktop-only table layouts.

1. **Start at the page**
   - Open target page under `client/src/pages/*` (e.g., `Orders.tsx`, `AuditLogs.tsx`).
2. **Identify the “desktop-first” elements**
   - Common culprits: wide tables, multi-column grids, large filter toolbars.
3. **Use `useIsMobile` for structural changes**
   - Import from `client/src/hooks/use-mobile.tsx`.
   - On mobile, switch:
     - tables → stacked cards
     - multi-column grids → single column
     - icon+text clusters → icon-only (with accessible labels) where appropriate
4. **Push generic fixes down to UI primitives**
   - If many pages suffer from the same issue (e.g., button sizing), fix in `client/src/components/ui/*`.
5. **Protect interaction quality**
   - Ensure important actions aren’t hidden behind hover-only affordances.
   - Avoid “double scroll” regions (scroll inside scroll) unless necessary.

**Best practice:** Prefer **responsive composition** (rearranging components) over dozens of breakpoint-specific class tweaks.

---

### Workflow C — Improve Touch & Accessibility on Mobile
**When:** Users struggle tapping controls, popovers are mispositioned, focus behavior breaks.

1. **Audit tap targets**
   - Buttons/icons in `TopNavigation`, `NotificationsBell`, tables and action menus.
2. **Standardize control sizing**
   - Use existing `Button` primitive (`client/src/components/ui/button.tsx`) and ensure it supports mobile-friendly sizes.
3. **Check focus + keyboard**
   - Mobile still needs correct focus order (especially for external keyboards and accessibility).
4. **Popover/dialog placement**
   - For `NotificationsBell.tsx`, ensure popover:
     - doesn’t overflow viewport
     - is scrollable inside if content is long
5. **Color/contrast**
   - Validate in both themes (`theme-provider.tsx`, `mode-toggle.tsx`), and with branding overrides (`branding-provider.tsx`).

**Best practice:** Don’t rely solely on color to convey state—use icons, labels, or badges where already established (see `ui/badge.tsx`).

---

### Workflow D — Mobile Performance Pass (Rendering, Requests, Heavy Components)
**When:** Mobile feels sluggish, battery-heavy, or scroll janky.

1. **Find expensive UI**
   - Charts (`client/src/components/ui/chart.tsx`)
   - Large lists/tables (Orders, AuditLogs, Team)
2. **Reduce work on mobile**
   - Conditionally render heavy components on mobile (using `useIsMobile`) or provide simplified versions.
3. **Avoid request storms**
   - Review API calls on page mount and filter changes.
   - Prefer stable caching patterns via `apiRequest` usage (`client/src/lib/queryClient.ts`).
4. **Paginate/virtualize where needed**
   - If AuditLogs or Orders is large, prefer pagination and avoid rendering hundreds of rows on mobile.

**Best practice:** Mobile optimizations should preserve correctness; never skip critical data loads silently—use progressive disclosure (load-more) instead.

---

### Workflow E — Mobile-Safe Branding & Theme Changes
**When:** Branding settings are changed or a tenant/theme option is added.

1. **Trace branding config usage**
   - Start from `client/src/components/branding-provider.tsx` and `settings/AppBranding.tsx`.
2. **Validate color contrast**
   - Especially for primary actions, badges, and nav items on small screens.
3. **Verify theme toggling**
   - Ensure dark mode works with branding.
4. **Apply changes consistently**
   - Prefer central tokens/variables rather than per-component overrides.

**Best practice:** Avoid “magic colors” inside pages; route through branding/theme whenever possible.

---

## Codebase Conventions & Patterns to Follow

### Use the existing mobile detection hook
- **Do:** `useIsMobile` from `client/src/hooks/use-mobile.tsx`
- **Don’t:** introduce a new breakpoint hook unless necessary.

### Prefer shared UI primitives
- Buttons: `client/src/components/ui/button.tsx`
- Badges: `client/src/components/ui/badge.tsx`
- Charts: `client/src/components/ui/chart.tsx`

If you need a new mobile-friendly variant (e.g., `Button` size), implement it once in the primitive and update call sites.

### Be mindful of duplicate “ButtonProps”
Both of these export `ButtonProps`:
- `client/src/components/ui-custom.tsx`
- `client/src/components/ui/button.tsx`

**Guideline:** In new work, prefer importing from `client/src/components/ui/button.tsx` for canonical button behavior, unless the feature explicitly uses `ui-custom` patterns already.

### Keep routing and navigation in sync
- `App.tsx` controls protected routes (`PrivateRoute`).
- `MobileBottomNav.tsx` must not expose routes that will immediately redirect or error.

### Match existing formatting & helper patterns
- `cn` utility exists in `client/src/lib/utils.ts` (and also referenced in `ui-custom.tsx`).
- Use `cn` for conditional classes to match the codebase’s style.

---

## Testing & Validation Checklist (Mobile)

### Functional checks (must)
- Navigation works with `MobileBottomNav` across all primary pages
- Protected routes don’t create loops on mobile
- Forms are usable on small screens (keyboard doesn’t cover primary action; fields are not too cramped)
- Notifications popover is usable and scrollable on mobile

### UX checks (should)
- No horizontal scroll on main pages (unless intentionally in a constrained region)
- Primary actions remain visible and easy to reach
- Dense pages (AuditLogs/Orders/Team) have mobile-friendly layouts (cards, collapsible filters)

### Visual checks (must)
- Light/dark mode parity (`ThemeProvider` + `ModeToggle`)
- Branding overrides don’t break contrast (`BrandingProvider`)

### Performance checks (should)
- Avoid rendering heavy charts by default on mobile if not essential
- Avoid large lists rendered all at once on mobile

---

## “Ready-to-Use” Implementation Recipes

### Recipe 1: Switch table → cards on mobile (page-level)
- Use `useIsMobile`
- Render:
  - desktop: table
  - mobile: card list with key fields + actions

Applies well to: `Orders.tsx`, `AuditLogs.tsx`, `Team.tsx`-style member lists.

### Recipe 2: Mobile-safe action menus
- Convert small icon buttons to:
  - `Button` with `size` suited for touch
  - include `aria-label` and visible label if space allows
- Ensure menu/popup fits viewport and scrolls internally.

### Recipe 3: Branding-safe colors
- Avoid hard-coded colors in pages.
- Prefer theme/branding-aware classes and existing component variants (badge/button variants).

---

## Collaboration Contracts (when server changes are needed)

If a mobile UX improvement requires backend support (pagination, filtered queries, notification payload changes):

1. Identify the responsible service under `server/services/*` (e.g., notifications → `notification.service.ts`).
2. Keep response shapes stable; add fields rather than renaming/removing.
3. Ensure client uses `apiRequest` (`client/src/lib/queryClient.ts`) consistently.
4. Add/adjust audit/notification flows carefully—mobile surfaces are more sensitive to noisy alerts.

---

## Definition of Done (Mobile Specialist)

A change is “done” when:
- Mobile layout is verified on the key pages impacted (at minimum: Dashboard + the touched page)
- Mobile navigation remains consistent and usable
- No regressions in desktop layout/navigation
- Theming/branding still looks correct (light/dark)
- Changes follow the component primitives and hook patterns already present in the repo

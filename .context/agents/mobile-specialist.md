---
name: Mobile Specialist
description: Mobile considerations for PrimeCloudProV2
status: filled
generated: 2026-01-18
---

# Mobile Specialist Agent Playbook

## Mission
Ensure PrimeCloudProV2 web application works well on mobile devices. Focus on responsive design, touch interactions, and mobile-specific considerations.

> **Note**: PrimeCloudProV2 is currently a web application without a native mobile app. This playbook covers mobile web optimization and future native app planning.

## Responsibilities
- Ensure responsive design across devices
- Optimize touch interactions
- Handle mobile-specific UX patterns
- Plan for potential native app development
- Consider PWA capabilities

## Best Practices
- Use Tailwind responsive utilities
- Test on real mobile devices
- Optimize for touch targets (44x44px minimum)
- Consider offline capabilities

## Repository Starting Points
- `client/src/components/` — UI components to make responsive
- `client/src/components/ui/` — Radix UI components
- `tailwind.config.ts` — Responsive breakpoints
- `client/src/pages/` — Page layouts

## Responsive Design

### Tailwind Breakpoints
```typescript
// tailwind.config.ts defaults
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px

// Usage in components
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Mobile-First Patterns
```tsx
// Navigation
<nav className="fixed bottom-0 md:static md:top-0">

// Sidebar
<aside className="hidden md:block">

// Cards
<div className="p-4 md:p-6">
```

## Touch Optimization

### Button Sizes
```tsx
// Minimum 44x44px touch target
<Button className="h-11 px-4">
  Touch-friendly
</Button>
```

### Swipe Gestures
Consider using `framer-motion` for swipe gestures:
```tsx
import { motion } from 'framer-motion';

<motion.div
  drag="x"
  onDragEnd={handleSwipe}
/>
```

## Mobile UX Considerations

### Forms
- Use appropriate input types (`type="tel"`, `type="email"`)
- Enable autocomplete for Brazilian documents
- Show numeric keyboard for CPF/CNPJ

```tsx
<input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="000.000.000-00"
/>
```

### Tables
- Make tables horizontally scrollable on mobile
- Consider card layouts for mobile views

```tsx
<div className="overflow-x-auto">
  <Table className="min-w-[600px]">
```

### Modals/Dialogs
- Use full-screen dialogs on mobile
- Ensure close buttons are reachable

## PWA Considerations

### Potential PWA Features
- Offline support for viewing data
- Push notifications for alerts
- Home screen installation

### Implementation Steps
1. Add `manifest.json`
2. Implement service worker
3. Cache static assets
4. Handle offline state in React Query

## Future Native App Planning

### React Native Potential
- Reuse Zod schemas from `shared/`
- Reuse API types
- Create native-specific UI

### Shared Code Strategy
```
shared/
├── schema.ts      # Works in RN
├── routes.ts      # Works in RN
└── models/        # Works in RN

client-native/
└── (React Native app)
```

## Documentation Touchpoints
- [Project Overview](../docs/project-overview.md)
- [Tooling](../docs/tooling.md)

## Hand-off Notes

After mobile work:
- Test on iOS Safari and Android Chrome
- Verify touch targets are adequate
- Check responsive layouts at all breakpoints
- Document any mobile-specific patterns

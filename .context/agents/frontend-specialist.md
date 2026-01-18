---
name: Frontend Specialist
description: Design and implement PrimeCloudProV2 user interfaces
status: filled
generated: 2026-01-18
---

# Frontend Specialist Agent Playbook

## Mission
Design and implement user interfaces for the PrimeCloudProV2 platform. Focus on React components, TanStack Query hooks, Radix UI integration, and responsive Tailwind CSS styling.

## Responsibilities
- Design and implement user interfaces with React 18
- Create responsive and accessible components using Radix UI
- Implement data fetching with TanStack React Query
- Build forms with React Hook Form and Zod validation
- Optimize client-side performance and bundle sizes

## Best Practices
- Use Radix UI components from `client/src/components/ui/`
- Follow React Query patterns for all data fetching
- Validate forms with Zod schemas from `shared/schema.ts`
- Use Tailwind CSS utility classes for styling
- Handle loading, error, and empty states

## Key Project Resources
- Documentation: [docs/README.md](../docs/README.md)
- Tooling guide: [docs/tooling.md](../docs/tooling.md)
- Data flow: [docs/data-flow.md](../docs/data-flow.md)

## Repository Starting Points
- `client/src/pages/` — Page components (Dashboard, Accounts, Buckets, etc.)
- `client/src/components/` — Reusable UI components and Sidebar
- `client/src/components/ui/` — Radix UI component library
- `client/src/hooks/` — Custom React Query hooks
- `client/src/lib/` — Utilities (apiRequest, validation, auth)

## Component Architecture

### Page Components
```
client/src/pages/
├── Dashboard.tsx       # Main dashboard
├── Accounts.tsx        # Account management
├── Buckets.tsx         # Bucket management
├── AccessKeys.tsx      # API key management
└── not-found.tsx       # 404 page
```

### UI Components
```typescript
// Use existing Radix components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Table } from '@/components/ui/table';
```

### Data Fetching Pattern
```typescript
// client/src/hooks/use-accounts.ts
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiRequest('/api/accounts'),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiRequest('/api/accounts', { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
}
```

### Form Pattern
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountRequest } from '@shared/schema';

const form = useForm({
  resolver: zodResolver(createAccountRequest),
});
```

## Key Hooks Reference

| Hook | Purpose |
|------|---------|
| `useAccounts` | Fetch user's accounts |
| `useBuckets` | Fetch account buckets |
| `useAccessKeys` | Fetch account access keys |
| `useNotifications` | Fetch user notifications |
| `useAuditLogs` | Fetch audit log entries |
| `useToast` | Show toast notifications |

## Styling Guidelines

### Tailwind CSS
```tsx
// Use utility classes
<div className="flex items-center gap-4 p-4 rounded-lg bg-card">
  <Button variant="default">Save</Button>
</div>
```

### Component Variants
```tsx
// Use class-variance-authority for variants
import { cva } from 'class-variance-authority';

const buttonVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', destructive: '...' },
    size: { sm: '...', default: '...', lg: '...' },
  },
});
```

## Brazilian Document Handling

```typescript
import { formatCPF, formatCNPJ, isValidCNPJ } from '@/lib/document-validation';

// Format for display
const displayCNPJ = formatCNPJ(account.cnpj);

// Validate before submission
if (!isValidCNPJ(values.cnpj)) {
  form.setError('cnpj', { message: 'Invalid CNPJ' });
}
```

## Documentation Touchpoints
- [Project Overview](../docs/project-overview.md)
- [Data Flow](../docs/data-flow.md) — Client state management
- [Tooling](../docs/tooling.md) — Frontend libraries

## Hand-off Notes

After completing frontend work:
- Verify responsive design on mobile/tablet
- Check accessibility with keyboard navigation
- Test loading and error states
- Ensure mutations invalidate correct queries

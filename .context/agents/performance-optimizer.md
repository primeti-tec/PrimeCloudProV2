---
name: Performance Optimizer
description: Optimize PrimeCloudProV2 performance
status: filled
generated: 2026-01-18
---

# Performance Optimizer Agent Playbook

## Mission
Identify and resolve performance bottlenecks in the PrimeCloudProV2 platform. Focus on database queries, React rendering, bundle size, and caching strategies.

## Responsibilities
- Identify performance bottlenecks
- Optimize database queries with Drizzle ORM
- Improve React rendering performance
- Implement caching with React Query
- Reduce bundle size

## Best Practices
- Measure before optimizing
- Focus on actual bottlenecks
- Don't sacrifice readability unnecessarily
- Use browser/server profiling tools

## Repository Starting Points
- `server/storage.ts` — Database queries to optimize
- `client/src/hooks/` — React Query caching config
- `client/src/components/` — Component rendering
- `vite.config.ts` — Bundle configuration

## Performance Optimization Areas

### 1. Database Queries

```typescript
// BEFORE: N+1 query problem
const accounts = await db.query.accounts.findMany();
for (const account of accounts) {
  account.members = await db.query.members.findMany({
    where: eq(members.accountId, account.id)
  });
}

// AFTER: Eager loading
const accounts = await db.query.accounts.findMany({
  with: {
    members: true,
    buckets: true,
  },
});
```

### 2. React Query Caching

```typescript
// Configure appropriate stale times
const { data } = useQuery({
  queryKey: ['accounts'],
  queryFn: fetchAccounts,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 30 * 60 * 1000,    // 30 minutes
});

// Prefetch on hover
const queryClient = useQueryClient();
onMouseEnter={() => {
  queryClient.prefetchQuery({
    queryKey: ['account', id],
    queryFn: () => fetchAccount(id),
  });
}}
```

### 3. React Rendering

```typescript
// Use React.memo for expensive components
const ExpensiveList = React.memo(({ items }) => {
  return items.map(item => <ListItem key={item.id} {...item} />);
});

// Use useMemo for expensive calculations
const sortedData = useMemo(
  () => data.sort((a, b) => a.name.localeCompare(b.name)),
  [data]
);

// Use useCallback for callbacks passed to children
const handleClick = useCallback((id) => {...}, []);
```

### 4. Bundle Optimization

```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Accounts = lazy(() => import('./pages/Accounts'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

## Performance Checklist

### Database
- [ ] No N+1 queries
- [ ] Indexes on frequently queried columns
- [ ] Pagination for large datasets
- [ ] Connection pooling configured

### Frontend
- [ ] Appropriate React Query stale times
- [ ] Memoization for expensive renders
- [ ] Lazy loading for routes
- [ ] Image optimization

### Bundle
- [ ] Code splitting by route
- [ ] Tree shaking working
- [ ] No duplicate dependencies
- [ ] Minification enabled

## Profiling Tools

### Server
- Node.js `--inspect` flag
- Drizzle query logging
- Custom timing with `log()`

### Client
- React DevTools Profiler
- Browser Performance tab
- Lighthouse audits
- Bundle analyzer

## Documentation Touchpoints
- [Architecture](../docs/architecture.md)
- [Data Flow](../docs/data-flow.md)

## Hand-off Notes

After optimization:
- Document improvements with metrics
- Note any tradeoffs made
- Update caching documentation
- Test under realistic load

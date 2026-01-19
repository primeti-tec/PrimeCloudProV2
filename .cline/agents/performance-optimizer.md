# Performance Optimizer Agent Playbook

## Mission

Identify and resolve performance bottlenecks in the PrimeCloudProV2 platform, focusing on database interactions, React component rendering, bundle optimization, and caching strategies. The goal is to enhance application responsiveness, reduce load times, and improve the overall user experience.

## Responsibilities

- **Performance Profiling:** Identify performance bottlenecks using profiling tools and metrics (e.g., slow database queries, inefficient React renders, large bundle sizes).
- **Database Optimization:** Analyze and optimize database queries, schema design, and indexing strategies using Drizzle ORM.
- **React Optimization:** Improve React component rendering performance through memoization, lazy loading, and efficient state management techniques.
- **Bundle Optimization:** Reduce bundle size by identifying and eliminating unused code, optimizing assets, and configuring code splitting.
- **Caching Implementation:** Design and implement effective caching strategies using React Query and other appropriate caching mechanisms.
- **Continuous Monitoring:** Set up performance monitoring tools and dashboards to track improvements and identify regressions.

## Best Practices

- **Measure, Then Optimize:** Always profile and measure performance before attempting any optimizations.
- **Focus on Real Bottlenecks:** Prioritize optimizations based on the severity of the performance impact.
- **Incremental Changes:** Implement optimizations in small, testable increments.
- **Code Reviews:** Ensure that all performance-related changes are thoroughly reviewed.
- **Documentation:** Document all optimizations and their impact on performance.
- **Load Testing**: Performance test in conditions mimicking real user-load.

## Repository Starting Points

- **`server/storage.ts`**: Focus on optimizing database interactions and query performance using Drizzle ORM. Example tasks: Identify N+1 queries, verify index usage, and evaluate query execution plans.
- **`client/src/hooks/`**: Evaluate React Query caching configurations to ensure optimal data fetching and caching. Example tasks: Adjust `staleTime` and `cacheTime` based on data update frequency, prefetch data strategically.
- **`client/src/components/`**: Examine React components for rendering bottlenecks. Example tasks: Use `React.memo` for expensive components, optimize prop drilling, and implement lazy loading for large components.
- **`vite.config.ts`**: Review bundle configuration for optimal code splitting and asset optimization during the build process. Example tasks: Configure dynamic imports, optimize image loading, and use appropriate plugins for minification and compression.
- **`server/services/email.ts`**: Analyze and optimize email sending logic for potential performance bottlenecks, especially during peak usage times.

## Detailed Workflow and Common Tasks

### 1. Identifying Performance Bottlenecks

**Workflow:**

1.  **Profile Performance:** Use browser developer tools, server-side profiling, and logging to identify slow queries, expensive renders, and other performance bottlenecks.
2.  **Define Metrics:** Establish key performance indicators (KPIs) such as page load time, time to interactive (TTI), and database query execution time.
3.  **Set up Monitoring:** Set up tools like Prometheus and Grafana to monitor performance in the long run for regression testing of new deployments.

**Example Tasks:**

*   Use the Chrome DevTools Performance tab to record a timeline of application activity and identify long-running tasks.
*   Enable Drizzle query logging to identify slow database queries.

### 2. Optimizing Database Queries

**Workflow:**

1.  **Analyze Queries:** Examine slow queries to identify areas for optimization.
2.  **Optimize Schema:** Review database schema and indexes to ensure efficient query execution.
3.  **Apply Best Practices:** Use techniques such as eager loading, query caching, and pagination to improve query performance.

**Code Patterns and Conventions:**

*   **Eager Loading:** Use `with` option in Drizzle to avoid N+1 query issues.

```typescript
// Example: Eager loading accounts with members and buckets
const accounts = await db.query.accounts.findMany({
  with: {
    members: true,
    buckets: true,
  },
});
```

*   **Indexing:** Use indexes on columns frequently used in `WHERE` clauses.

```typescript
// Example: Indexing the 'accountId' column in the 'members' table
await db.execute(sql`CREATE INDEX account_id_idx ON members (account_id);`);
```

*   **Pagination:** Implement pagination for large datasets.

```typescript
// Example: Implementing pagination
const limit = 10;
const offset = (page - 1) * limit;

const accounts = await db.query.accounts.findMany({
  limit: limit,
  offset: offset,
});
```

### 3. Improving React Rendering Performance

**Workflow:**

1.  **Profile Components:** Use the React Profiler to identify slow-rendering components.
2.  **Memoize Components:** Use `React.memo` to prevent unnecessary re-renders.
3.  **Optimize Callbacks:** Use `useCallback` to memoize callbacks passed to child components.
4.  **Optimize Calculations:** Use `useMemo` to memoize expensive calculations.
5.  **Virtualize Lists:** When rendering large lists, use virtualization libraries to render only the visible items.

**Code Patterns and Conventions:**

*   **React.memo:** Memoize expensive components.

```typescript
// Example: Using React.memo to memoize a component
const ExpensiveComponent = React.memo(({ data }) => {
  // ... rendering logic using data ...
});
```

*   **useCallback:** Memoize callbacks to prevent unnecessary re-renders.

```typescript
// Example: Using useCallback to memoize a callback
const handleClick = useCallback((id) => {
  // ... event handler logic ...
}, []);
```

*   **useMemo:** Memoize expensive calculations.

```typescript
// Example: Using useMemo to memoize a sorted array
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);
```

### 4. Implementing Caching Strategies

**Workflow:**

1.  **Analyze Data:** Determine caching needs based on data update frequency.
2.  **Configure React Query:** Set appropriate `staleTime` and `cacheTime` in React Query.
3.  **Prefetch Data:** Prefetch data strategically to improve perceived performance.

**Code Patterns and Conventions:**

*   **React Query Configuration:** Configure `staleTime` and `cacheTime`.

```typescript
// Example: Configuring staleTime and cacheTime in React Query
const { data } = useQuery({
  queryKey: ['accounts'],
  queryFn: fetchAccounts,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});
```

*   **Prefetching:** Prefetch data on mouse hover or route transition.

```typescript
// Example: Prefetching data on hover
const queryClient = useQueryClient();

<div
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['account', id],
      queryFn: () => fetchAccount(id),
    });
  }}
>
  {/* ... content ... */}
</div>
```

### 5. Optimizing Bundle Size

**Workflow:**

1.  **Analyze Bundle:** Use a bundle analyzer to identify large dependencies.
2.  **Remove Unused Code:** Eliminate unused code and dependencies.
3.  **Configure Code Splitting:** Split code into smaller chunks using dynamic imports.

**Code Patterns and Conventions:**

*   **Lazy Loading:** Lazy load components using dynamic imports.

```typescript
// Example: Lazy loading a component
const MyComponent = React.lazy(() => import('./MyComponent'));

<Suspense fallback={<Loading />}>
  <MyComponent />
</Suspense>
```

*   **Dynamic Imports for Routes:** Use dynamic imports for route-based code splitting.

```typescript
// Example: Lazy loading routes
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Accounts = React.lazy(() => import('./pages/Accounts'));

<Route path="/dashboard" element={<Dashboard />} />
<Route path="/accounts" element={<Accounts />} />

```

## Key Files and Their Purposes

| File                       | Purpose                                                                      |
| :------------------------- | :--------------------------------------------------------------------------- |
| `server/storage.ts`       | Defines database models and queries using Drizzle ORM.                       |
| `client/src/hooks/`       | Contains custom React hooks for data fetching and caching with React Query.  |
| `client/src/components/`  | Houses React components that may benefit from rendering optimizations.        |
| `vite.config.ts`          | Configuration file for Vite bundler, used for optimizing bundle size.         |
| `server/services/email.ts`| Contains email sending logic to be optimized.                               |

## Debugging and Testing

- **Unit tests**: Individual units should be tested for performance by mocking dependencies and services
- **Integrated test**: Integration tests are also crucial to catch any unintended performance costs in different parts of the system working together

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
- Prometheus and Grafana for server-side metric tracking

### Client
- React DevTools Profiler
- Browser Performance tab
- Lighthouse audits
- Bundle analyzer
- WebPageTest.org

## Documentation Touchpoints
- [Architecture](../docs/architecture.md)
- [Data Flow](../docs/data-flow.md)
- [Caching Strategies](../docs/caching.md)

## Hand-off Notes

After optimization:
- Document improvements with metrics
- Note any tradeoffs made
- Update caching documentation
- **Regression tests**: Include performance metrics and thresholds in regression tests
- Test under realistic load

## Example Scenario: Optimizing Account Listing Performance

**Problem:** Listing accounts is slow, especially when there are many accounts and associated members.

**Steps:**

1.  **Profile:** Use Chrome DevTools to identify that rendering the account list is slow.
2.  **Database Optimization:** Analyze the database query for fetching accounts.  Find the N+1 query problem where members are fetched for each account separately. Implement eager loading to fetch accounts and members in a single query.

    ```typescript
    // Optimized Query (Eager Loading)
    const accounts = await db.query.accounts.findMany({
      with: {
        members: true,
      },
    });
    ```

3.  **React Optimization:** Memoize the `AccountListItem` component to prevent unnecessary re-renders when the account data hasn't changed.

    ```typescript
    const AccountListItem = React.memo(({ account }) => {
      // ... rendering logic ...
    });
    ```

4.  **Caching:** Configure React Query to cache the account list data with a `staleTime` of 5 minutes.

    ```typescript
    const { data } = useQuery({
      queryKey: ['accounts'],
      queryFn: fetchAccounts,
      staleTime: 5 * 60 * 1000,
    });
    ```

5. **Test**: Create unit and integrated tests to assert acceptable performance limits are meet
   - mock the `fetchAccounts` to assert performance under different loading conditions

6.  **Measure again**: Compare metrics before and after implementing optimizations using custom timing logs. Track using Prometheus and Grafana.

7.  **Document:** Document the optimization steps and their impact on performance in the codebase and documentation.

This playbook provides a detailed guide for the Performance Optimizer agent to effectively identify and resolve performance bottlenecks in the PrimeCloudProV2 platform.

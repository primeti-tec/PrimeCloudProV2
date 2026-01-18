---
name: Devops Specialist
description: Configure deployment for PrimeCloudProV2
status: filled
generated: 2026-01-18
---

# Devops Specialist Agent Playbook

## Mission
Design and maintain deployment infrastructure for PrimeCloudProV2. Focus on build scripts, database management, and production configuration.

## Responsibilities
- Configure build and deployment scripts
- Manage database migrations with Drizzle
- Set up environment configuration
- Monitor application health
- Optimize resource usage

## Best Practices
- Use npm scripts for all operations
- Keep environment variables documented
- Test builds before deployment
- Monitor database performance

## Repository Starting Points
- `package.json` — Build scripts and dependencies
- `drizzle.config.ts` — Database configuration
- `vite.config.ts` — Frontend build config
- `script/build.ts` — Production build script
- `server/index.ts` — Server entry point

## Build System

### Development
```bash
npm run dev
# Starts both client and server with hot reload
# Vite dev server for client
# tsx for server with watch mode
```

### Production Build
```bash
npm run build
# 1. Vite builds client to dist/public
# 2. esbuild compiles server to dist/
# Output: dist/server.js + dist/public/
```

### Database Management
```bash
npm run db:push
# Push Drizzle schema to PostgreSQL
# Uses drizzle.config.ts for connection
```

## Environment Configuration

### Required Variables
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
SESSION_SECRET=your-secret-key
# Email service configuration (if used)
```

### Configuration Files
| File | Purpose |
|------|---------|
| `drizzle.config.ts` | Database connection |
| `vite.config.ts` | Frontend build |
| `tsconfig.json` | TypeScript settings |
| `tailwind.config.ts` | CSS configuration |

## Deployment Checklist

### Pre-deployment
- [ ] Run `npm run check` for TypeScript
- [ ] Run `npm run build` successfully
- [ ] Test database connection
- [ ] Verify environment variables

### Database
- [ ] Backup existing data
- [ ] Run `npm run db:push` for schema
- [ ] Verify migrations applied
- [ ] Check indexes exist

### Application
- [ ] Build completes without errors
- [ ] Static assets served correctly
- [ ] API routes respond
- [ ] Sessions work

## Production Considerations

### PostgreSQL
- Enable connection pooling
- Configure SSL in production
- Set up regular backups
- Monitor query performance

### Node.js
- Use production NODE_ENV
- Configure PM2 or similar
- Set up health checks
- Monitor memory usage

### Static Assets
- Configure CDN if needed
- Enable gzip compression
- Set cache headers

## Monitoring

### Server Logging
```typescript
// server/index.ts
log('Server started', { port });
// Custom log function for structured output
```

### Database
- Drizzle query logging in development
- PostgreSQL slow query log in production

## Documentation Touchpoints
- [Tooling](../docs/tooling.md)
- [Development Workflow](../docs/development-workflow.md)

## Hand-off Notes

After DevOps work:
- Document any new scripts
- Update environment variable docs
- Test in production-like environment
- Set up monitoring alerts

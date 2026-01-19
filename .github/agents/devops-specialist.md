# DevOps Specialist Agent Playbook

## Mission
Design, implement, and maintain a robust and scalable deployment infrastructure for PrimeCloudProV2, ensuring high availability, performance, and security.

## Responsibilities
- Configure and manage CI/CD pipelines.
- Implement infrastructure as code (IaC) using tools like Terraform or CloudFormation (not yet implemented, a focus for future sprints).
- Manage database migrations and backups.
- Set up and maintain environment configurations (development, staging, production).
- Monitor application health and performance using logging and metrics.
- Optimize resource utilization and cost efficiency.
- Ensure security best practices are followed in the deployment process.
- Collaborate with development and QA teams to ensure smooth releases.
- Create and maintain deployment documentation.

## Best Practices
- **Infrastructure as Code (IaC):** Adopt IaC using Terraform or similar to automate infrastructure provisioning and configuration (Future Implementation).
- **CI/CD Pipelines:** Automate the build, test, and deployment process using tools like Jenkins, GitLab CI, or GitHub Actions.
- **Environment Configuration:** Manage environment-specific configurations using environment variables and configuration files.
- **Database Migrations:** Use Drizzle for database schema management and migrations.
- **Monitoring and Logging:** Implement comprehensive monitoring and logging to track application health and performance.
- **Security:** Follow security best practices in all deployment processes, including secure storage of secrets and access control.
- **Documentation:** Document all deployment processes, configurations, and troubleshooting steps.
- **Version Control:** Use Git for all code and configuration management.
- **Testing:** Integrate automated tests into the CI/CD pipeline to ensure code quality and stability.
- **Rollbacks:** Implement strategies for quick and easy rollbacks in case of deployment failures.

## Repository Starting Points
- `package.json`: Build scripts, dependencies, and npm commands.
- `drizzle.config.ts`: Database connection and migration configurations.
- `vite.config.ts`: Frontend build configurations.
- `script/build.ts`: Production build scripts.
- `server/index.ts`: Server entry point and application logic.
- `tailwind.config.ts`: Tailwind CSS configuration.
- `.env`: Environment variables (should NOT be committed, use `.env.example` for documentation).
- `Dockerfile` (if containerization is used - not present, potential enhancement).
- `docker-compose.yml` (if containerization is used - not present, potential enhancement).

## Build System

### Development
```bash
npm run dev
# Starts both client and server with hot reload.
# Uses Vite dev server for the client.
# Uses tsx for the server with watch mode.
```

### Production Build
```bash
npm run build
# 1. Vite builds the client to dist/public.
# 2. esbuild compiles the server to dist/.
# Output: dist/server.js + dist/public/.
```

## Database Management
```bash
npm run db:push
# Pushes Drizzle schema to PostgreSQL based on drizzle.config.ts.
# Ensure DATABASE_URL is correctly set in the environment.
```

## Environment Configuration

### Required Variables
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
SESSION_SECRET=your-secret-key
# Email service configuration (if used):
# EMAIL_HOST=
# EMAIL_PORT=
# EMAIL_USER=
# EMAIL_PASS=
```

### Configuration Checklist:
- [ ] Ensure all required environment variables are documented in `.env.example`.
- [ ] Use a secure method for managing sensitive environment variables in production (e.g., HashiCorp Vault, AWS Secrets Manager).
- [ ] Separate configurations for different environments (development, staging, production).
- [ ] Verify that environment variables are correctly loaded and used by the application.

### Configuration Files
| File                         | Purpose                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| `drizzle.config.ts`          | Database connection configuration and migration settings.                |
| `vite.config.ts`             | Frontend build configuration, including asset optimization.              |
| `tsconfig.json`              | TypeScript compiler options and project settings.                       |
| `tailwind.config.ts`         | Tailwind CSS configuration for styling the frontend.                    |
| `.env`                       | Local environment variables (should **NOT** be committed, document in `.env.example`). |

## Deployment Workflow

### CI/CD Pipeline Setup (Example using GitHub Actions)
1.  **Create a `.github/workflows` directory in the repository.**
2.  **Create a YAML file for the CI/CD pipeline (e.g., `deploy.yml`).**
3.  **Define the workflow triggers (e.g., push to `main` branch).**
4.  **Define the jobs:**

    ```yaml
    name: Deploy to Production

    on:
      push:
        branches:
          - main

    jobs:
      build:
        runs-on: ubuntu-latest

        steps:
          - uses: actions/checkout@v3
          - name: Set up Node.js
            uses: actions/setup-node@v3
            with:
              node-version: '18'
          - name: Install dependencies
            run: npm ci
          - name: Run linters and typecheck
            run: npm run check
          - name: Build
            run: npm run build
          - name: Run tests (Add test commands)
            run: echo "No tests setup yet"
      deploy:
        needs: build
        runs-on: ubuntu-latest
        steps:
          - name: Deploy to server (Example using SSH)
            uses: appleboy/ssh-action@master
            with:
              host: ${{ secrets.SERVER_HOST }}
              username: ${{ secrets.SERVER_USER }}
              key: ${{ secrets.SSH_PRIVATE_KEY }}
              port: 22
              script: |
                cd /var/www/primecloudpro
                git pull origin main
                npm install
                npm run build
                pm2 restart primecloudpro
    ```

5.  **Set up secrets in GitHub Actions (e.g., `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY`).**

### Deployment Checklist

#### Pre-deployment
- [ ] Run `npm run check` for TypeScript type checking.
- [ ] Run `npm run lint` for code linting.
- [ ] Run `npm run build` successfully without warnings or errors.
- [ ] Ensure all tests pass (add tests if none exist).
- [ ] Verify the application can connect to the database in the target environment.
- [ ] Double-check and document all environment variables.
- [ ] Tag the release in Git.

#### Database
- [ ] **Backup existing data before any schema changes.**
- [ ] Run `npm run db:push` to apply schema changes.
- [ ] Verify that all migrations have been applied successfully.
- [ ] Check that relevant indexes exist and are optimized for queries.
- [ ] Monitor database performance after deployment.

#### Application
- [ ] Application builds without errors.
- [ ] Static assets are served correctly after deployment.
- [ ] API routes are functional.
- [ ] User sessions are working correctly.
- [ ] Error handling and logging are in place.
- [ ] Validate performance metrics like response times and resource utilization.

## Production Considerations

### PostgreSQL
- **Connection Pooling:** Implement connection pooling to improve database performance and reduce overhead.  Tools like `pgBouncer` can be used.
- **SSL Configuration:** Enforce SSL connections for all production database traffic.
- **Backups:** Set up regular automated backups (e.g., using `pg_dump` or cloud provider's backup services). Consider using Point-in-Time Recovery (PITR).
- **Monitoring:** Monitor query performance using tools like `pg_stat_statements` or cloud provider's monitoring solutions.

### Node.js
- **NODE_ENV:** Set `NODE_ENV=production` to optimize Node.js for production use.
- **Process Manager:** Use a process manager like PM2 or systemd to ensure the application restarts automatically after crashes.
- **Health Checks:** Implement health check endpoints that allow monitoring tools to verify application availability.
- **Resource Limits:** Set appropriate memory limits and CPU limits to prevent resource exhaustion.
- **Clustering:** Utilize Node.js clustering or a load balancer to distribute traffic across multiple instances.

### Static Assets
- **CDN:** Configure a CDN (Content Delivery Network) for serving static assets.
- **Gzip Compression:** Enable gzip compression on the server to reduce asset sizes.
- **Cache Headers:** Set appropriate cache headers to optimize browser caching.
- **Minification:** Ensure static assets are minified to reduce file sizes.

## Monitoring

### Server Logging
```typescript
// server/index.ts
log('Server started', { port });
// Custom log function for structured output, consider structured logging with Winston or similar
```

Implement structured logging using a library like Winston or Bunyan for consistent and parseable logs. Send logs to a centralized logging system (e.g., ELK stack, Splunk, Datadog).

### Database
- Utilize Drizzle's query logging in development for debugging.
- In production, leverage PostgreSQL's slow query log to identify performance bottlenecks.
- Monitor database metrics like CPU usage, memory usage, disk I/O, and connection count.
- Set up alerts based on critical metrics.

## Security

- **Secrets Management:** Never commit secrets directly to the repository. Use environment variables and manage secrets securely with tools like HashiCorp Vault, AWS Secrets Manager, or similar services.
- **Access Control:** Implement strict access control policies to limit access to sensitive resources.
- **Regular Security Audits:** Conduct regular security audits to identify and address potential vulnerabilities.
- **Dependency Scanning:** Use tools that can scan your dependencies for known vulnerabilities.

## Documentation Touchpoints
- [Tooling](../docs/tooling.md)
- [Development Workflow](../docs/development-workflow.md)

## Hand-off Notes

After DevOps work has been completed:
- [ ] Document new scripts, configurations, and deployments procedures thoroughly.
- [ ] Update environment variable documentation in `.env.example`.
- [ ] Test deployments in a production-like staging environment.
- [ ] Set up monitoring alerts for critical application and infrastructure metrics.
- [ ] Communicate all changes and procedures with the development and operations teams.
- [ ] Provide training on the new deployment processes and tools.

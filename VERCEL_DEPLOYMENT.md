# Vercel Environment Variables

## Required Environment Variables for Production

Add these in your Vercel project settings under Environment Variables:

### Database Configuration
Vercel automatically provides these when using Vercel Postgres:
- `POSTGRES_URL` - Full database connection URL (automatically added)
- `POSTGRES_USER` - PostgreSQL username  
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_HOST` - PostgreSQL host
- `POSTGRES_DATABASE` - PostgreSQL database name

Alternatively, you can manually set:
- `DATABASE_URL` - Full database connection URL
- `DB_NAME` - PostgreSQL database name
- `DB_USER` - PostgreSQL username  
- `DB_PASSWORD` - PostgreSQL password
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (usually 5432)
- `DB_DIALECT` - Database dialect (set to `postgres`)

### JWT Configuration
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRE` - Token expiration time (e.g., `7d`)

### Admin User Configuration (Required)
- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD` - Admin password

### Optional
- `LOG_LEVEL` - Logging level (default: `info`)
- `NODE_ENV` - Set automatically to `production` by Vercel

## Database Setup

Vercel doesn't provide built-in PostgreSQL. Use one of:
1. **Vercel Postgres** - Vercel's managed PostgreSQL service
2. **External PostgreSQL** - Supabase, PlanetScale, Neon, etc.

## Deployment Steps

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app will automatically:
- Build Next.js app (`vercel-build` script)
- Start the Express server which serves both API and frontend
- Handle database migrations on startup
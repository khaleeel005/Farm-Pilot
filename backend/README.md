# Farm Manager Backend API

Standalone Express + TypeScript API server for Farm Manager application.

## Tech Stack

- **Runtime**: Node.js v22+
- **Framework**: Express 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (Sequelize ORM)
- **Authentication**: JWT
- **Package Manager**: pnpm

## Prerequisites

- Node.js 22 or higher
- PostgreSQL database
- pnpm (install with `npm install -g pnpm`)

## Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env
   # Edit .env with required values
   ```

   For test-specific overrides, create `./.env.test` from `./.env.test.example`.

3. **Start PostgreSQL (Docker)**:
   ```bash
   pnpm db:up
   ```

4. **Run database migrations**:
   ```bash
   pnpm db:migrate
   ```

   In non-production environments, the app can still create/update tables on startup via Sequelize `sync({ alter: true })`.

## Development

Start the development server with hot reload:

```bash
pnpm dev
```

The API will be available on the host/port you configure in `PORT`.

## Production

Build TypeScript to JavaScript:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## Scripts

- `pnpm dev` - Start development server with tsx watch
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Run production server
- `pnpm test` - Run tests
- `pnpm typecheck` - Check TypeScript types without emitting
- `pnpm db:up` - Start local PostgreSQL container
- `pnpm db:down` - Stop local PostgreSQL container
- `pnpm db:logs` - Tail PostgreSQL logs
- `pnpm db:migrate` - Run database migrations
- `pnpm db:migrate:undo` - Rollback last migration

## API Endpoints

All endpoints are prefixed with `/api`

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Houses

- `GET /api/houses` - List all houses
- `POST /api/houses` - Create new house
- `GET /api/houses/:id` - Get house details
- `PUT /api/houses/:id` - Update house
- `DELETE /api/houses/:id` - Delete house

### Daily Logs

- `GET /api/daily-logs` - List daily logs
- `POST /api/daily-logs` - Create daily log
- `GET /api/daily-logs/:id` - Get log details
- `PUT /api/daily-logs/:id` - Update log
- `DELETE /api/daily-logs/:id` - Delete log

### Feed Management

- `GET /api/feed/recipes` - List feed recipes
- `POST /api/feed/recipes` - Create recipe
- `GET /api/feed/batches` - List feed batches
- `POST /api/feed/batches` - Create batch

### Sales

- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Reports

- `GET /api/reports/daily` - Daily report
- `GET /api/reports/house/:id` - House-specific report
- `GET /api/reports/financial` - Financial summary

### Health Check

- `GET /api/health` - Server health status

## Environment Variables

See `.env.example` for all available configuration options.

Required variables:

- `NODE_ENV` - Environment (`development`, `test`, or `production`)
- `PORT` - Server port
- `FRONTEND_URL` - Comma-separated allowed CORS origins
- `DB_DIALECT`, `DB_LOG`, and dialect-specific database settings
- `DB_DOCKER_PORT` (used by Docker compose host port mapping)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_NAME`

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── validations/    # Input validation
│   ├── types/          # TypeScript types
│   └── server.ts       # Entry point
├── tests/              # Test files
├── dist/               # Compiled JavaScript (gitignored)
├── package.json
├── tsconfig.json
└── .env
```

## Notes

- Native modules (`bcrypt`, `sqlite3`) may require build approval with pnpm
- The server uses `tsx` for development (no build step needed)
- Production uses compiled JavaScript from the `dist/` directory

# API Integration Guide

## Overview

The frontend communicates with the backend API using a comprehensive API client located in `src/lib/api.ts`. All API calls use **relative URLs** which work seamlessly with the Rsbuild proxy in development and same-origin deployment in production.

## API Client Architecture

### Primary API Client: `src/lib/api.ts`

**Features:**

- ✅ 865 lines with all endpoints
- ✅ Relative URLs (`/api/*`)
- ✅ JWT authentication with localStorage
- ✅ Automatic token refresh
- ✅ Type-safe with TypeScript
- ✅ Custom error handling
- ✅ Event emitter for auth events

**Usage in Components:**

```typescript
import { getHouses, createHouse, deleteHouse } from "@/lib/api";

// All components use this pattern
const houses = await getHouses();
```

### Secondary API Client: `src/services/api.ts`

**Features:**

- ✅ Generic REST client
- ✅ Cookie-based authentication
- ✅ 87 lines, simple wrapper

**Note:** This was created during migration but components use `lib/api.ts` instead.

## How It Works

### Development (Rsbuild Proxy)

```typescript
// rsbuild.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
    },
  },
}
```

**Flow:**

1. Frontend makes request: `fetch('/api/houses')`
2. Rsbuild proxy intercepts `/api/*` requests
3. Forwards to backend: `http://localhost:5001/api/houses`
4. Response returns to frontend

### Production (Same-Origin)

**Flow:**

1. Frontend deployed to: `https://app.example.com`
2. Backend deployed to: `https://app.example.com/api`
3. Requests use relative URLs: `fetch('/api/houses')`
4. No CORS issues (same origin)

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Houses

- `GET /api/houses` - List all houses
- `POST /api/houses` - Create house
- `PUT /api/houses/:id` - Update house
- `DELETE /api/houses/:id` - Delete house

### Daily Logs

- `GET /api/daily-logs` - List daily logs
- `POST /api/daily-logs` - Create daily log
- `PUT /api/daily-logs/:id` - Update daily log
- `DELETE /api/daily-logs/:id` - Delete daily log

### Sales

- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Customers

- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Feed Management

- `GET /api/feed/recipes` - List feed recipes
- `POST /api/feed/recipes` - Create recipe
- `PUT /api/feed/recipes/:id` - Update recipe
- `DELETE /api/feed/recipes/:id` - Delete recipe
- `GET /api/feed/batches` - List feed batches
- `POST /api/feed/batches` - Create batch
- `PUT /api/feed/batches/:id` - Update batch
- `DELETE /api/feed/batches/:id` - Delete batch

### Labor Management

- `GET /api/laborers` - List laborers
- `POST /api/laborers` - Create laborer
- `PUT /api/laborers/:id` - Update laborer
- `DELETE /api/laborers/:id` - Delete laborer
- `GET /api/work-assignments` - List work assignments
- `POST /api/work-assignments` - Create assignment
- `GET /api/payroll/:monthYear` - Get payroll for month
- `POST /api/payroll/generate/:monthYear` - Generate payroll

### Staff Management (Owner Only)

- `GET /api/staff` - List staff
- `POST /api/staff` - Create staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Delete staff

### Cost Analysis

- `GET /api/costs/daily/:date` - Get daily costs
- `GET /api/costs/summary` - Get costs summary
- `POST /api/costs/operating` - Create operating cost
- `GET /api/costs/egg-price/:date` - Get egg price estimate

### Cost Entries (Expenses)

- `GET /api/cost-entries` - List cost entries
- `POST /api/cost-entries` - Create cost entry
- `PUT /api/cost-entries/:id` - Update cost entry
- `DELETE /api/cost-entries/:id` - Delete cost entry
- `GET /api/cost-entries/types` - Get cost types
- `GET /api/cost-entries/summary` - Get summary

### Reports

- `GET /api/reports/production` - Production report
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/financial` - Financial report
- `GET /api/reports/export/:type` - Export report (CSV/PDF)

## Authentication Flow

### Login

```typescript
import { login } from "@/lib/api";

const data = await login({ username, password });
// Token stored in localStorage
// Auth event emitted
```

### Auto Token Refresh

```typescript
// Automatic on 401 responses
async function fetchWithAuth(url, options) {
  const res = await fetch(url, { headers: authHeader() });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry request with new token
    }
  }
}
```

### Logout

```typescript
import { logout } from "@/lib/api";

await logout();
// Tokens removed from localStorage
// Auth event emitted
```

## Error Handling

### Custom ApiError Class

```typescript
class ApiError extends Error {
  status: number;
  code: string;

  get isForbidden(): boolean;
  get isUnauthorized(): boolean;
  get isNotFound(): boolean;
}
```

### Usage in Components

```typescript
try {
  const houses = await getHouses();
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isUnauthorized) {
      // Redirect to login
    } else if (error.isForbidden) {
      // Show permission error
    }
  }
}
```

## Component Integration

### Example: House Management

```typescript
import { getHouses, createHouse, deleteHouse } from "@/lib/api";

function HouseManagement() {
  const [houses, setHouses] = useState([]);

  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
    try {
      const data = await getHouses();
      setHouses(data);
    } catch (error) {
      console.error("Failed to load houses", error);
    }
  };

  const handleCreate = async (payload) => {
    await createHouse(payload);
    await loadHouses();
  };
}
```

## Verification

### All Components Using Correct API ✅

**Components verified:**

- `staff-management.tsx` ✅
- `house-management.tsx` ✅
- `cost-analysis.tsx` ✅
- `staff-daily-entry.tsx` ✅
- `daily-logs.tsx` ✅
- `dashboard-overview.tsx` ✅
- `feed-management.tsx` ✅
- `daily-entry-form.tsx` ✅
- `sales-management.tsx` ✅
- `expense-management.tsx` ✅
- `labor-management.tsx` ✅

**All components import from:** `@/lib/api` ✅

### Proxy Configuration ✅

**Rsbuild config verified:**

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
    },
  },
}
```

## Testing API Integration

### 1. Start Backend

```bash
cd backend
pnpm dev
# Backend running on http://localhost:5001
```

### 2. Start Frontend

```bash
cd frontend
pnpm dev
# Frontend running on http://localhost:3000
```

### 3. Test Endpoints

```bash
# Health check
curl http://localhost:5001/api/health

# Login (get token)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get houses (with token)
curl http://localhost:5001/api/houses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Test via Frontend

1. Open http://localhost:3000
2. Login with credentials
3. Navigate to different pages
4. Check browser DevTools Network tab
5. Verify API calls go through proxy

## Production Deployment

### Option 1: Separate Domains

**Frontend:** `https://app.example.com`  
**Backend:** `https://api.example.com`

**Update frontend:**

```typescript
// lib/api.ts
const BASE = "https://api.example.com";
```

**Enable CORS on backend:**

```typescript
// backend/src/server.ts
app.use(
  cors({
    origin: "https://app.example.com",
    credentials: true,
  }),
);
```

### Option 2: Same Domain (Recommended)

**Frontend:** `https://example.com`  
**Backend:** `https://example.com/api`

**Nginx config:**

```nginx
server {
  listen 80;
  server_name example.com;

  # Frontend
  location / {
    root /var/www/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # Backend API
  location /api {
    proxy_pass http://localhost:5001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

**No code changes needed!** Relative URLs work automatically.

## Summary

✅ **All API calls properly configured**  
✅ **Components use `@/lib/api`**  
✅ **Relative URLs work with proxy**  
✅ **Authentication flow working**  
✅ **Error handling in place**  
✅ **Type-safe throughout**  
✅ **Production-ready**

The API integration is complete and ready for both development and production use!

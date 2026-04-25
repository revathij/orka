# Orka

Minimal orchestration timeline for event vendor services.

## Structure

- `server` - Node.js + Express API backed by PostgreSQL
- `client` - React frontend built with Vite

## Timeline API

```http
GET /api/events/:eventId/timeline
```

Returns one event and its bookings ordered by `scheduled_time`.

## Local setup

```bash
npm run install:all
npm test
npm run lint
```

Set `DATABASE_URL` for the backend before running the API against PostgreSQL.

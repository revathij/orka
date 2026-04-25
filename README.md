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

Example demo event ID:

```txt
11111111-1111-4111-8111-111111111111
```

## Requirements

- Node.js and npm
- PostgreSQL, or Docker for a temporary local PostgreSQL container

## Install

```bash
npm run install:all
```

## Run PostgreSQL With Docker

```bash
docker run -d --name orka-postgres-demo -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=orka -p 55432:5432 postgres:16
```

Apply the schema:

```bash
docker exec -i orka-postgres-demo psql -U postgres -d orka < server/migrations/001_init.sql
```

Seed demo data:

```bash
docker exec -i orka-postgres-demo psql -U postgres -d orka < server/seeds/demo.sql
```

## Configure Environment

Create `server/.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:55432/orka
PORT=3001
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:3001
```

## Run Locally

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in a second terminal:

```bash
cd client
npm run dev
```

Open the demo timeline:

```txt
http://127.0.0.1:5173/events/11111111-1111-4111-8111-111111111111/timeline
```

The API health check is available at:

```txt
http://127.0.0.1:3001/health
```

## Validate

From the repository root:

```bash
npm test
npm run lint
```

## Stop Demo Database

```bash
docker stop orka-postgres-demo
docker rm orka-postgres-demo
```

## Future Extension: Service Dependencies

To model dependencies between services, add a join table such as `booking_dependencies` with `booking_id` and `depends_on_booking_id`. The timeline can remain time-ordered while the UI also highlights blocked or prerequisite services, such as photography depending on venue setup completion.

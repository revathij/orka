# Orka

Minimal orchestration timeline for event vendor services.

## Core APIs

```http
GET /api/events
POST /api/events
GET /api/events/:eventId/timeline
POST /api/events/:eventId/bookings
GET /api/vendors
POST /api/vendors
```

## Vendor Photos

Vendors can upload profile photos from the UI. The frontend converts the selected image to a data URL and stores it in PostgreSQL via `photo_url`.

## Migrations

```bash
docker exec -i orka-postgres-demo psql -U postgres -d orka < server/migrations/001_init.sql
docker exec -i orka-postgres-demo psql -U postgres -d orka < server/migrations/002_event_details.sql
docker exec -i orka-postgres-demo psql -U postgres -d orka < server/migrations/003_vendor_catalog.sql
docker exec -i orka-postgres-demo psql -U postgres -d orka < server/migrations/004_vendor_photos.sql
```

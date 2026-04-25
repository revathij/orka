INSERT INTO events (id, name, starts_at, location, description) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Meera and Arjun Wedding', '2026-06-01T08:00:00Z', 'Orchid Garden Hall', 'Demo wedding timeline for local development')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  starts_at = EXCLUDED.starts_at,
  location = EXCLUDED.location,
  description = EXCLUDED.description;

INSERT INTO vendors (id, name, service_type, contact_name, phone, email, notes) VALUES
  ('22222222-2222-4222-8222-222222222221', 'Morning Bloom Florals', 'Decor', 'Aisha Rahman', '+65 9000 1001', 'aisha@bloom.example', 'Prefers early setup slots'),
  ('22222222-2222-4222-8222-222222222222', 'Golden Table Catering', 'Catering', 'Nikhil Sharma', '+65 9000 1002', 'nikhil@table.example', 'Vegetarian menu available'),
  ('22222222-2222-4222-8222-222222222223', 'Blue Hour Photography', 'Photography', 'Priya Menon', '+65 9000 1003', 'priya@bluehour.example', 'Two photographer package'),
  ('22222222-2222-4222-8222-222222222224', 'Harbor Lights Music', 'Music', 'Arun Dey', '+65 9000 1004', 'arun@harborlights.example', 'Supports acoustic and DJ sets')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  service_type = EXCLUDED.service_type,
  contact_name = EXCLUDED.contact_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  notes = EXCLUDED.notes;

INSERT INTO bookings (id, event_id, vendor_id, service_type, scheduled_time, status) VALUES
  ('33333333-3333-4333-8333-333333333331', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222221', 'Floral setup', '2026-06-01T07:30:00Z', 'booked'),
  ('33333333-3333-4333-8333-333333333332', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222223', 'Portrait session', '2026-06-01T09:00:00Z', 'planned'),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Lunch service', '2026-06-01T12:30:00Z', 'completed'),
  ('33333333-3333-4333-8333-333333333334', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222224', 'After-party DJ', '2026-06-01T20:00:00Z', 'cancelled')
ON CONFLICT (id) DO UPDATE SET
  event_id = EXCLUDED.event_id,
  vendor_id = EXCLUDED.vendor_id,
  service_type = EXCLUDED.service_type,
  scheduled_time = EXCLUDED.scheduled_time,
  status = EXCLUDED.status;

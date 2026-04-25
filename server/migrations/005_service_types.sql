CREATE TABLE IF NOT EXISTS service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO service_types (name)
VALUES ('Photography'), ('Catering'), ('Decor'), ('Music')
ON CONFLICT (name) DO NOTHING;

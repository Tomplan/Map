-- Create the Organization_Profile table
CREATE TABLE "Organization_Profile" (
  "id" INT PRIMARY KEY DEFAULT 1,
  "name" TEXT,
  "logo" TEXT,
  "website" TEXT,
  "info" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT "singleton_id" CHECK (id = 1)
);

-- Insert the default (and only) row with branding from BRANDING_CONFIG
INSERT INTO "Organization_Profile" (id, name, logo, website, info)
VALUES (1, '4x4 Vakantiebeurs', '4x4Vakantiebeurs.png', '', 'Event organizer information.')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE "Organization_Profile" ENABLE ROW LEVEL SECURITY;

-- Policies for Organization_Profile
-- Allow public read access
CREATE POLICY "Allow public read access on Organization_Profile"
ON "Organization_Profile"
FOR SELECT
USING (true);

-- Allow admin write access
CREATE POLICY "Allow admin write access on Organization_Profile"
ON "Organization_Profile"
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_organization_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the timestamp
CREATE TRIGGER on_organization_profile_update
BEFORE UPDATE ON "Organization_Profile"
FOR EACH ROW
EXECUTE PROCEDURE public.handle_organization_profile_update();

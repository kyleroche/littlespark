CREATE TABLE IF NOT EXISTS ls_parents (id uuid PRIMARY KEY, email text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS ls_kids (id uuid PRIMARY KEY, parent_id uuid NOT NULL REFERENCES ls_parents(id) ON DELETE CASCADE, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 32), avatar text NOT NULL DEFAULT 'robot', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ls_kids_parent ON ls_kids(parent_id);
CREATE TABLE IF NOT EXISTS ls_sessions (hash text PRIMARY KEY, parent_id uuid REFERENCES ls_parents(id) ON DELETE CASCADE, kid_id uuid REFERENCES ls_kids(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), CHECK(num_nonnulls(parent_id,kid_id)=1));
CREATE INDEX IF NOT EXISTS ls_sessions_expiry ON ls_sessions(expires_at);
CREATE TABLE IF NOT EXISTS ls_parent_links (email text PRIMARY KEY, hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, used_at timestamptz);
CREATE TABLE IF NOT EXISTS ls_kid_links (kid_id uuid PRIMARY KEY REFERENCES ls_kids(id) ON DELETE CASCADE, hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, used_at timestamptz);
CREATE TABLE IF NOT EXISTS ls_progress (kid_id uuid NOT NULL REFERENCES ls_kids(id) ON DELETE CASCADE, lesson_id text NOT NULL, state jsonb NOT NULL, generation integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(kid_id,lesson_id));
CREATE TABLE IF NOT EXISTS ls_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);

-- Bind child sessions and links to a revocation generation. Existing rows stay valid at 0.
ALTER TABLE ls_kids ADD COLUMN IF NOT EXISTS auth_version integer NOT NULL DEFAULT 0;
ALTER TABLE ls_sessions ADD COLUMN IF NOT EXISTS auth_version integer NOT NULL DEFAULT 0;
ALTER TABLE ls_kid_links ADD COLUMN IF NOT EXISTS auth_version integer NOT NULL DEFAULT 0;

-- T11 coordinator-owned additive migration, version 001.
-- Application code creates opaque UUIDs; PostgreSQL uniqueness is the authority.
-- This migration is forward-only. Roll back application code compatibly; do not
-- drop identity/result rows as a rollback strategy.

CREATE TABLE players (
  id uuid PRIMARY KEY,
  username_display varchar(24) NOT NULL,
  username_key varchar(24) COLLATE "C" NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT players_username_display_length CHECK (char_length(username_display) BETWEEN 3 AND 24),
  CONSTRAINT players_username_key_format CHECK (username_key ~ '^[a-z0-9_]{3,24}$'),
  CONSTRAINT players_username_display_format CHECK (username_display ~ '^[A-Za-z0-9_]{3,24}$')
);

CREATE TABLE sessions (
  token_hash char(64) PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT sessions_token_hash_format CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT sessions_expiry_after_creation CHECK (expires_at > created_at)
);
CREATE INDEX sessions_player_expiry_idx ON sessions (player_id, expires_at);

CREATE TABLE recovery_codes (
  code_hash char(64) PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  CONSTRAINT recovery_codes_hash_format CHECK (code_hash ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX recovery_codes_one_active_per_player_idx
  ON recovery_codes (player_id) WHERE consumed_at IS NULL;

CREATE TABLE match_results (
  match_id uuid PRIMARY KEY,
  result_hash char(64) NOT NULL,
  result_json jsonb NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_results_hash_format CHECK (result_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE match_result_participants (
  match_id uuid NOT NULL REFERENCES match_results(match_id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  team varchar(8) NOT NULL CHECK (team IN ('home', 'away')),
  PRIMARY KEY (match_id, player_id)
);
CREATE INDEX match_result_participants_player_idx
  ON match_result_participants (player_id, match_id);

-- Delivery/read metadata only. Invite capability and membership truth stay in
-- MatchRoom; this table deliberately stores no invite token or secret.
CREATE TABLE invitation_inbox (
  id uuid PRIMARY KEY,
  sender_player_id uuid NOT NULL REFERENCES players(id),
  recipient_player_id uuid NOT NULL REFERENCES players(id),
  room_id varchar(128) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  removed_at timestamptz,
  CONSTRAINT invitation_inbox_not_self CHECK (sender_player_id <> recipient_player_id)
);
CREATE INDEX invitation_inbox_recipient_idx
  ON invitation_inbox (recipient_player_id, created_at DESC)
  WHERE removed_at IS NULL;

-- Rate-limit bucket keys are HMACs of client/account scope keys. Raw IPs and
-- usernames are not persisted. Expired buckets are pruned by the API repository.
CREATE TABLE identity_rate_limits (
  scope varchar(32) NOT NULL,
  bucket_hash char(64) NOT NULL,
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (scope, bucket_hash),
  CONSTRAINT identity_rate_limits_scope_check CHECK (
    scope IN ('registration-ip', 'recovery-ip', 'recovery-account')
  ),
  CONSTRAINT identity_rate_limits_hash_format CHECK (bucket_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT identity_rate_limits_expiry_check CHECK (expires_at > window_started_at)
);
CREATE INDEX identity_rate_limits_expiry_idx ON identity_rate_limits (expires_at);

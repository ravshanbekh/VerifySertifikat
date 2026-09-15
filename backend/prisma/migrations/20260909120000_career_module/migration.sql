-- Additive migration: no existing Verify tables or records are removed.
CREATE TYPE "CareerRole" AS ENUM ('graduate', 'employer');
CREATE TYPE "CareerStatus" AS ENUM ('pending', 'active', 'blocked');
-- Existing schema already uses this value; older deployments may not have it yet.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'deleted';
CREATE TABLE "career_accounts" (
 "id" TEXT NOT NULL, "email" TEXT NOT NULL, "password_hash" TEXT NOT NULL,
 "full_name" TEXT NOT NULL, "phone" TEXT NOT NULL, "telegram" TEXT NOT NULL,
 "role" "CareerRole" NOT NULL, "status" "CareerStatus" NOT NULL DEFAULT 'pending',
 "company_name" TEXT, "website" TEXT, "industry" TEXT, "consent_at" TIMESTAMP(3) NOT NULL,
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "career_accounts_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "career_profiles" (
 "id" TEXT NOT NULL, "account_id" TEXT NOT NULL, "certificate_id" TEXT NOT NULL,
 "headline" TEXT NOT NULL DEFAULT '', "bio" TEXT NOT NULL DEFAULT '', "city" TEXT NOT NULL DEFAULT '',
 "level" TEXT NOT NULL DEFAULT 'Junior', "work_format" TEXT NOT NULL DEFAULT 'Hybrid',
 "work_type" TEXT NOT NULL DEFAULT 'Full-time', "availability" TEXT NOT NULL DEFAULT 'open',
 "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[], "skills" TEXT[] DEFAULT ARRAY[]::TEXT[], "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
 "experience" TEXT NOT NULL DEFAULT '', "projects" JSONB NOT NULL DEFAULT '[]',
 "linkedin" TEXT NOT NULL DEFAULT '', "github" TEXT NOT NULL DEFAULT '', "portfolio" TEXT NOT NULL DEFAULT '',
 "avatar_url" TEXT NOT NULL DEFAULT '', "cv_filename" TEXT, "published" BOOLEAN NOT NULL DEFAULT false,
 "contact_consent" BOOLEAN NOT NULL DEFAULT false, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "career_profiles_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "career_invites" (
 "id" TEXT NOT NULL, "certificate_id" TEXT NOT NULL, "code_hash" TEXT NOT NULL, "grant_hash" TEXT,
 "grant_expires" TIMESTAMP(3), "expires_at" TIMESTAMP(3) NOT NULL, "consumed_at" TIMESTAMP(3),
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "career_invites_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "career_sessions" (
 "token_hash" TEXT NOT NULL, "account_id" TEXT NOT NULL, "expires_at" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "career_sessions_pkey" PRIMARY KEY ("token_hash")
);
CREATE TABLE "career_saved" (
 "employer_id" TEXT NOT NULL, "profile_id" TEXT NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "career_saved_pkey" PRIMARY KEY ("employer_id", "profile_id")
);
CREATE TABLE "career_events" (
 "id" TEXT NOT NULL, "account_id" TEXT, "action" TEXT NOT NULL, "target_id" TEXT, "details" JSONB,
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "career_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "career_accounts_email_key" ON "career_accounts"("email");
CREATE UNIQUE INDEX "career_profiles_account_id_key" ON "career_profiles"("account_id");
CREATE UNIQUE INDEX "career_profiles_certificate_id_key" ON "career_profiles"("certificate_id");
CREATE INDEX "career_profiles_published_city_level_idx" ON "career_profiles"("published", "city", "level");
CREATE UNIQUE INDEX "career_invites_code_hash_key" ON "career_invites"("code_hash");
CREATE UNIQUE INDEX "career_invites_grant_hash_key" ON "career_invites"("grant_hash");
CREATE INDEX "career_invites_certificate_id_idx" ON "career_invites"("certificate_id");
CREATE INDEX "career_sessions_expires_at_idx" ON "career_sessions"("expires_at");
CREATE INDEX "career_events_account_id_created_at_idx" ON "career_events"("account_id", "created_at");
ALTER TABLE "career_profiles" ADD CONSTRAINT "career_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "career_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_profiles" ADD CONSTRAINT "career_profiles_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "career_invites" ADD CONSTRAINT "career_invites_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_sessions" ADD CONSTRAINT "career_sessions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "career_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_saved" ADD CONSTRAINT "career_saved_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "career_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_saved" ADD CONSTRAINT "career_saved_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "career_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_events" ADD CONSTRAINT "career_events_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "career_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

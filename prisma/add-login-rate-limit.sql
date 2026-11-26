BEGIN;

CREATE TABLE "admin_login_rate_limits" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admin_login_rate_limits_pkey"
    PRIMARY KEY ("key")
);

CREATE INDEX "admin_login_rate_limits_expires_at_idx"
ON "admin_login_rate_limits"("expires_at");

COMMIT;
import 'server-only';

import { prisma } from '@/lib/db';

import type {
  Prisma,
} from '@/generated/prisma/client';

// ==========================================
// SUPPORTED AUDIT ACTIONS
// ==========================================

export const AUDIT_ACTIONS = {

  // AUTHENTICATION

  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_RATE_LIMITED: 'LOGIN_RATE_LIMITED',
  LOGOUT: 'LOGOUT',
  LOGOUT_FAILED: 'LOGOUT_FAILED',

  // PRODUCTS

  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',
  PRODUCT_STATUS_CHANGED: 'PRODUCT_STATUS_CHANGED',

  // CATEGORIES

  CATEGORY_CREATED: 'CATEGORY_CREATED',
  CATEGORY_UPDATED: 'CATEGORY_UPDATED',
  CATEGORY_DELETED: 'CATEGORY_DELETED',
  CATEGORY_VISIBILITY_CHANGED: 'CATEGORY_VISIBILITY_CHANGED',

  // HOMEPAGE BANNERS

  BANNER_CREATED: 'BANNER_CREATED',
  BANNER_UPDATED: 'BANNER_UPDATED',
  BANNER_DELETED: 'BANNER_DELETED',
  BANNER_STATUS_CHANGED: 'BANNER_STATUS_CHANGED',

  // DISCOUNT CAMPAIGNS

  DISCOUNT_CREATED: 'DISCOUNT_CREATED',
  DISCOUNT_UPDATED: 'DISCOUNT_UPDATED',
  DISCOUNT_DELETED: 'DISCOUNT_DELETED',
  DISCOUNT_STATUS_CHANGED: 'DISCOUNT_STATUS_CHANGED',

  // MARKETPLACES

  MARKETPLACE_CREATED: 'MARKETPLACE_CREATED',
  MARKETPLACE_UPDATED: 'MARKETPLACE_UPDATED',
  MARKETPLACE_DELETED: 'MARKETPLACE_DELETED',
  MARKETPLACE_STATUS_CHANGED: 'MARKETPLACE_STATUS_CHANGED',

  // FAQ MANAGEMENT

  FAQ_CREATED: 'FAQ_CREATED',
  FAQ_UPDATED: 'FAQ_UPDATED',
  FAQ_DELETED: 'FAQ_DELETED',
  FAQ_STATUS_CHANGED: 'FAQ_STATUS_CHANGED',

  // WEBSITE SETTINGS

  SETTINGS_UPDATED: 'SETTINGS_UPDATED',

  // MEDIA MANAGEMENT

  MEDIA_UPLOADED: 'MEDIA_UPLOADED',
  MEDIA_DELETED: 'MEDIA_DELETED',

  // ADMIN ACCOUNT MANAGEMENT

  ADMIN_ACCOUNT_SETUP: 'ADMIN_ACCOUNT_SETUP',
  ADMIN_CREATED: 'ADMIN_CREATED',
  ADMIN_UPDATED: 'ADMIN_UPDATED',
  ADMIN_DEACTIVATED: 'ADMIN_DEACTIVATED',
  ADMIN_ACTIVATED: 'ADMIN_ACTIVATED',
  ADMIN_ROLE_CHANGED: 'ADMIN_ROLE_CHANGED',
  ADMIN_PASSWORD_CHANGED: 'ADMIN_PASSWORD_CHANGED',

  // SESSION MANAGEMENT

  SESSION_REVOKED: 'SESSION_REVOKED',
  ALL_SESSIONS_REVOKED: 'ALL_SESSIONS_REVOKED',

  // SECURITY EVENTS

  ACCESS_DENIED: 'ACCESS_DENIED',
  CSRF_REJECTED: 'CSRF_REJECTED',

} as const;

// ==========================================
// AUDIT ACTION TYPE
// ==========================================

export type AuditAction =
  (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

// ==========================================
// SUPPORTED ENTITY TYPES
// ==========================================

export const AUDIT_ENTITIES = {
  ADMIN_USER: 'AdminUser',

  ADMIN_SESSION: 'AdminSession',

  PRODUCT: 'Product',

  CATEGORY: 'Category',

  BANNER: 'HomepageBanner',

  DISCOUNT: 'DiscountCampaign',

  MARKETPLACE: 'Marketplace',

  FAQ: 'FAQ',

  SETTINGS: 'SiteSetting',

  MEDIA: 'Media',

  SECURITY: 'Security',
} as const;

export type AuditEntity =
  (typeof AUDIT_ENTITIES)[keyof typeof AUDIT_ENTITIES];

// ==========================================
// ALLOWED AUDIT REASONS
// ==========================================

export const AUDIT_REASONS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  SESSION_REVOCATION_FAILED: 'SESSION_REVOCATION_FAILED',

  INVALID_SESSION: 'INVALID_SESSION',

  INSUFFICIENT_PERMISSION: 'INSUFFICIENT_PERMISSION',

  INVALID_ORIGIN: 'INVALID_ORIGIN',
} as const;

export type AuditReason =
  (typeof AUDIT_REASONS)[keyof typeof AUDIT_REASONS];

// ==========================================
// AUDIT LOG INPUT
// ==========================================

interface AuditLogInput {
  adminId?: string | null;

  action: AuditAction;

  entityType?: AuditEntity;

  entityId?: string | null;

  reason?: AuditReason;
}

// ==========================================
// DATABASE CLIENT TYPE
//
// SUPPORTS:
// - STANDARD PRISMA CLIENT
// - PRISMA TRANSACTION CLIENT
// ==========================================

type AuditDatabaseClient = Pick<
  Prisma.TransactionClient,
  'auditLog'
>;

// ==========================================
// VALIDATE AUDIT ACTION
// ==========================================

function isValidAuditAction(
  action: unknown
): action is AuditAction {

  return Object.values(
    AUDIT_ACTIONS
  ).some(
    (value) => value === action
  );
}

// ==========================================
// VALIDATE AUDIT ENTITY
// ==========================================

function isValidAuditEntity(
  entity: unknown
): entity is AuditEntity {

  return Object.values(
    AUDIT_ENTITIES
  ).some(
    (value) => value === entity
  );
}

// ==========================================
// VALIDATE AUDIT REASON
// ==========================================

function isValidAuditReason(
  reason: unknown
): reason is AuditReason {

  return Object.values(
    AUDIT_REASONS
  ).some(
    (value) => value === reason
  );
}

// ==========================================
// VALIDATE OPTIONAL RECORD IDENTIFIER
// ==========================================

function normalizeIdentifier(
  value: string | null | undefined
): string | null {

  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    typeof value !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(value)
  ) {
    throw new Error(
      'Invalid audit record identifier.'
    );
  }

  return value;
}

// ==========================================
// STRICT AUDIT LOG CREATION
//
// USE INSIDE DATABASE TRANSACTIONS
// WHEN AUDIT LOGGING IS MANDATORY.
//
// IF LOGGING FAILS, THE ERROR IS PROPAGATED.
// ==========================================

export async function createAuditLog(
  input: AuditLogInput,

  database: AuditDatabaseClient = prisma
): Promise<void> {

  // ========================================
  // VALIDATE AUDIT ACTION
  // ========================================

  if (!isValidAuditAction(input.action)) {
    throw new Error(
      'Invalid audit action.'
    );
  }

  // ========================================
  // VALIDATE ENTITY TYPE
  // ========================================

  if (
    input.entityType !== undefined &&
    !isValidAuditEntity(input.entityType)
  ) {
    throw new Error(
      'Invalid audit entity type.'
    );
  }

  // ========================================
  // VALIDATE EVENT REASON
  // ========================================

  if (
    input.reason !== undefined &&
    !isValidAuditReason(input.reason)
  ) {
    throw new Error(
      'Invalid audit reason.'
    );
  }

  // ========================================
  // VALIDATE ADMIN AND ENTITY IDENTIFIERS
  // ========================================

  const adminId =
    normalizeIdentifier(
      input.adminId
    );

  const entityId =
    normalizeIdentifier(
      input.entityId
    );

  // ========================================
  // CREATE SAFE AUDIT RECORD
  //
  // NEVER STORE:
  // - PASSWORDS
  // - PASSWORD HASHES
  // - JWT TOKENS
  // - SESSION COOKIES
  // - DATABASE CREDENTIALS
  // - COMPLETE REQUEST BODIES
  // ========================================

  await database.auditLog.create({
    data: {
      adminId,

      action: input.action,

      entityType:
        input.entityType ?? null,

      entityId,

      ...(input.reason
        ? {
            details: {
              reason: input.reason,
            },
          }
        : {}),
    },

    select: {
      id: true,
    },
  });
}

// ==========================================
// BEST-EFFORT AUDIT LOGGING
//
// USE FOR EVENTS WHERE LOGGING FAILURE
// MUST NOT INTERRUPT THE MAIN OPERATION.
//
// NEVER EXPOSE DATABASE ERROR DETAILS.
// ==========================================

export async function writeAuditLog(
  input: AuditLogInput
): Promise<boolean> {

  try {

    await createAuditLog(input);

    return true;

  } catch {

    console.error(
      '[AUDIT] Unable to record admin activity.'
    );

    return false;
  }
}